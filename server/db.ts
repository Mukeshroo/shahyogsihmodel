import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import {
  User,
  Cooperative,
  ServiceCategory,
  Worker,
  SkillCertificate,
  Booking,
  PaymentTransaction,
  Invoice,
  WorkerWelfare,
  DemandForecast,
  Complaint,
  AuditLog,
  SystemSettings,
  AppNotification,
  FairAllocationCandidate,
  FairAllocationLog
} from '../src/types/index.ts';

import {
  initialUsers,
  initialCooperatives,
  initialCategories,
  initialWorkers,
  initialCertificates,
  initialBookings,
  initialPayments,
  initialInvoices,
  initialWelfare,
  initialDemandForecasts,
  initialComplaints,
  initialAuditLogs,
  initialSystemSettings,
  initialNotifications
} from './seedData.ts';

interface DatabaseSchema {
  users: User[];
  cooperatives: Cooperative[];
  categories: ServiceCategory[];
  workers: Worker[];
  certificates: SkillCertificate[];
  bookings: Booking[];
  payments: PaymentTransaction[];
  invoices: Invoice[];
  welfare: WorkerWelfare[];
  forecasts: DemandForecast[];
  complaints: Complaint[];
  auditLogs: AuditLog[];
  settings: SystemSettings;
  notifications: AppNotification[];
  fairAllocationLogs: FairAllocationLog[];
}

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.resolve(DATA_DIR, 'database.json');

class DatabaseService {
  private data: DatabaseSchema;

  constructor() {
    this.data = this.loadDatabase();
  }

  private loadDatabase(): DatabaseSchema {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    if (fs.existsSync(DB_FILE)) {
      try {
        const fileContent = fs.readFileSync(DB_FILE, 'utf-8');
        const parsed = JSON.parse(fileContent);
        if (parsed.users && parsed.workers && parsed.bookings) {
          return parsed;
        }
      } catch (err) {
        console.error('Failed to parse database.json, re-seeding...', err);
      }
    }

    // Seed database
    const initialDb: DatabaseSchema = {
      users: initialUsers,
      cooperatives: initialCooperatives,
      categories: initialCategories,
      workers: initialWorkers,
      certificates: initialCertificates,
      bookings: initialBookings,
      payments: initialPayments,
      invoices: initialInvoices,
      welfare: initialWelfare,
      forecasts: initialDemandForecasts,
      complaints: initialComplaints,
      auditLogs: initialAuditLogs,
      settings: initialSystemSettings,
      notifications: initialNotifications,
      fairAllocationLogs: []
    };

    fs.writeFileSync(DB_FILE, JSON.stringify(initialDb, null, 2), 'utf-8');
    return initialDb;
  }

  private persist() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (err) {
      console.error('Error persisting database:', err);
    }
  }

  // Haversine formula for PostGIS distance calculation in km
  public calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c * 10) / 10;
  }

  // 90/10 Split ledger calculator
  public calculateSplit(totalAmount: number) {
    const feePct = this.data.settings.platformFeePercent; // e.g. 10
    const welfarePct = this.data.settings.workerWelfarePercent; // e.g. 2
    const workerShare = Math.round(totalAmount * ((100 - feePct) / 100)); // 90%
    const platformFee = totalAmount - workerShare; // 10%
    const welfareFee = Math.round(totalAmount * (welfarePct / 100)); // 2%
    const cooperativeFee = platformFee - welfareFee; // 8%

    return {
      workerShare,
      platformFee,
      welfareFee,
      cooperativeFee
    };
  }

  // Fair Work Allocation Engine
  public runFairAllocation(
    serviceCategoryId: string,
    customerLat: number,
    customerLng: number,
    isEmergency: boolean = false
  ): {
    bestCandidate: Worker | null;
    scoredCandidates: FairAllocationCandidate[];
    explanation: string;
  } {
    // 1. Eligibility Check: Status APPROVED and Skill match
    const eligibleWorkers = this.data.workers.filter(
      (w) => w.status === 'APPROVED' && w.approvedSkills.includes(serviceCategoryId)
    );

    if (eligibleWorkers.length === 0) {
      return {
        bestCandidate: null,
        scoredCandidates: [],
        explanation: 'No approved workers available for this trade in this district.'
      };
    }

    // 2. Score each eligible candidate
    const scoredCandidates: FairAllocationCandidate[] = eligibleWorkers.map((w) => {
      // Distance score (max distance cutoff 20km)
      const distance = this.calculateDistanceKm(customerLat, customerLng, w.lat, w.lng);
      const distanceScore = Math.max(0, Math.min(100, Math.round(100 - (distance * 5))));

      // Availability score
      const availabilityScore = w.isAvailable ? 100 : 20;

      // Workload Balance score (fewer jobs done today -> higher score to balance gig distribution)
      const todayJobs = this.data.bookings.filter(
        (b) => b.assignedWorkerId === w.id && b.createdAt.startsWith(new Date().toISOString().split('T')[0])
      ).length;
      const workloadScore = Math.max(10, 100 - (todayJobs * 25));

      // Fairness Rotation Score: workers who had fewer recent assignments get priority
      const recentJobCount = this.data.bookings.filter(
        (b) => b.assignedWorkerId === w.id
      ).length;
      const fairnessRotationScore = Math.max(20, Math.min(100, 100 - (recentJobCount % 10) * 8));

      // Skill match score: primary approved skill
      const skillScore = 100;

      // Weights:
      // In emergency, distance has higher weight (40%)
      const weights = isEmergency
        ? { skill: 0.20, dist: 0.40, avail: 0.20, work: 0.10, fair: 0.10 }
        : { skill: 0.30, dist: 0.25, avail: 0.15, work: 0.15, fair: 0.15 };

      const finalScore = Math.round(
        (skillScore * weights.skill) +
        (distanceScore * weights.dist) +
        (availabilityScore * weights.avail) +
        (workloadScore * weights.work) +
        (fairnessRotationScore * weights.fair)
      );

      return {
        workerId: w.id,
        workerName: w.name,
        skillScore,
        distanceKm: distance,
        distanceScore,
        availabilityScore,
        workloadScore,
        fairnessRotationScore,
        finalScore
      };
    });

    // Rank candidates by highest finalScore
    scoredCandidates.sort((a, b) => b.finalScore - a.finalScore);

    const winnerCandidate = scoredCandidates[0];
    const bestWorker = this.data.workers.find((w) => w.id === winnerCandidate.workerId) || null;

    const explanation = `Fair Allocation Selected ${winnerCandidate.workerName} (Score: ${winnerCandidate.finalScore}/100) — Distance: ${winnerCandidate.distanceKm} km, Fairness Rotation: ${winnerCandidate.fairnessRotationScore}%, Workload Index: ${winnerCandidate.workloadScore}%.`;

    return {
      bestCandidate: bestWorker,
      scoredCandidates,
      explanation
    };
  }

  // Users
  public getUsers(): User[] {
    return this.data.users;
  }

  public getUserById(id: string): User | undefined {
    return this.data.users.find((u) => u.id === id);
  }

  public getUserByEmail(email: string): User | undefined {
    return this.data.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  }

  public createUser(user: User): User {
    this.data.users.push(user);
    this.persist();
    return user;
  }

  // Workers
  public getWorkers(): Worker[] {
    return this.data.workers;
  }

  public getWorkerById(id: string): Worker | undefined {
    return this.data.workers.find((w) => w.id === id);
  }

  public getWorkerByUserId(userId: string): Worker | undefined {
    return this.data.workers.find((w) => w.userId === userId);
  }

  public updateWorker(id: string, updates: Partial<Worker>): Worker | null {
    const index = this.data.workers.findIndex((w) => w.id === id);
    if (index === -1) return null;
    this.data.workers[index] = { ...this.data.workers[index], ...updates };
    this.persist();
    return this.data.workers[index];
  }

  public createWorker(worker: Worker): Worker {
    this.data.workers.push(worker);
    this.persist();
    return worker;
  }

  // Cooperatives
  public getCooperatives(): Cooperative[] {
    return this.data.cooperatives;
  }

  public getCooperativeById(id: string): Cooperative | undefined {
    return this.data.cooperatives.find((c) => c.id === id);
  }

  // Service Categories
  public getCategories(): ServiceCategory[] {
    return this.data.categories;
  }

  public getCategoryById(id: string): ServiceCategory | undefined {
    return this.data.categories.find((c) => c.id === id);
  }

  // Bookings
  public getBookings(): Booking[] {
    return this.data.bookings;
  }

  public getBookingById(id: string): Booking | undefined {
    return this.data.bookings.find((b) => b.id === id);
  }

  public createBooking(booking: Booking): Booking {
    this.data.bookings.unshift(booking);
    this.persist();
    return booking;
  }

  public updateBooking(id: string, updates: Partial<Booking>): Booking | null {
    const index = this.data.bookings.findIndex((b) => b.id === id);
    if (index === -1) return null;
    this.data.bookings[index] = { ...this.data.bookings[index], ...updates };
    this.persist();
    return this.data.bookings[index];
  }

  // Certificates
  public getCertificates(): SkillCertificate[] {
    return this.data.certificates;
  }

  public getCertificateByNumber(certNum: string): SkillCertificate | undefined {
    return this.data.certificates.find(
      (c) => c.certificateNumber.toLowerCase() === certNum.toLowerCase()
    );
  }

  public issueCertificate(cert: SkillCertificate): SkillCertificate {
    this.data.certificates.push(cert);
    this.persist();
    return cert;
  }

  // Payments
  public getPayments(): PaymentTransaction[] {
    return this.data.payments;
  }

  public createPayment(payment: PaymentTransaction): PaymentTransaction {
    this.data.payments.unshift(payment);
    this.persist();
    return payment;
  }

  // Invoices
  public getInvoices(): Invoice[] {
    return this.data.invoices;
  }

  public getInvoiceByBookingId(bookingId: string): Invoice | undefined {
    return this.data.invoices.find((i) => i.bookingId === bookingId);
  }

  public createInvoice(invoice: Invoice): Invoice {
    this.data.invoices.unshift(invoice);
    this.persist();
    return invoice;
  }

  // Welfare
  public getWelfareRecords(): WorkerWelfare[] {
    return this.data.welfare;
  }

  public getWelfareByWorkerId(workerId: string): WorkerWelfare | undefined {
    return this.data.welfare.find((w) => w.workerId === workerId);
  }

  public updateWelfare(workerId: string, updates: Partial<WorkerWelfare>): WorkerWelfare | null {
    const index = this.data.welfare.findIndex((w) => w.workerId === workerId);
    if (index === -1) {
      // create new welfare entry
      const worker = this.getWorkerById(workerId);
      const newEntry: WorkerWelfare = {
        workerId,
        workerName: worker?.name || 'Worker',
        cooperativeName: worker?.cooperativeName || 'Cooperative',
        policyNumber: `PMSBY-KNP-${Math.floor(10000 + Math.random() * 90000)}-2026`,
        insuranceScheme: 'PM Suraksha Bima Yojana + Cooperative Accidental Pool',
        coverageAmount: 200000,
        annualPremium: 450,
        subsidyPaid: 450,
        renewalDate: '2027-03-31',
        status: 'ACTIVE',
        claims: [],
        totalContributionsFromGigs: 0,
        ...updates
      };
      this.data.welfare.push(newEntry);
      this.persist();
      return newEntry;
    }
    this.data.welfare[index] = { ...this.data.welfare[index], ...updates };
    this.persist();
    return this.data.welfare[index];
  }

  // Forecasts
  public getDemandForecasts(): DemandForecast[] {
    return this.data.forecasts;
  }

  // Complaints
  public getComplaints(): Complaint[] {
    return this.data.complaints;
  }

  public createComplaint(complaint: Complaint): Complaint {
    this.data.complaints.unshift(complaint);
    this.persist();
    return complaint;
  }

  public updateComplaint(id: string, updates: Partial<Complaint>): Complaint | null {
    const index = this.data.complaints.findIndex((c) => c.id === id);
    if (index === -1) return null;
    this.data.complaints[index] = { ...this.data.complaints[index], ...updates };
    this.persist();
    return this.data.complaints[index];
  }

  // Audit Logs
  public getAuditLogs(): AuditLog[] {
    return this.data.auditLogs;
  }

  public logAudit(log: Omit<AuditLog, 'id' | 'timestamp'>): AuditLog {
    const newLog: AuditLog = {
      id: `aud-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toISOString(),
      ...log
    };
    this.data.auditLogs.unshift(newLog);
    this.persist();
    return newLog;
  }

  // Settings
  public getSettings(): SystemSettings {
    return this.data.settings;
  }

  public updateSettings(settings: Partial<SystemSettings>): SystemSettings {
    this.data.settings = { ...this.data.settings, ...settings };
    this.persist();
    return this.data.settings;
  }

  // Notifications
  public getNotifications(userId?: string): AppNotification[] {
    if (!userId) return this.data.notifications;
    return this.data.notifications.filter((n) => n.recipientUserId === userId);
  }

  public addNotification(notification: Omit<AppNotification, 'id' | 'timestamp' | 'read'>): AppNotification {
    const newNotif: AppNotification = {
      id: `notif-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toISOString(),
      read: false,
      ...notification
    };
    this.data.notifications.unshift(newNotif);
    this.persist();
    return newNotif;
  }

  public markNotificationRead(id: string) {
    const notif = this.data.notifications.find((n) => n.id === id);
    if (notif) {
      notif.read = true;
      this.persist();
    }
  }

  // Fair Allocation Logs
  public recordFairAllocationLog(log: FairAllocationLog) {
    this.data.fairAllocationLogs.unshift(log);
    this.persist();
  }

  public getFairAllocationLogs(): FairAllocationLog[] {
    return this.data.fairAllocationLogs;
  }
}

export const db = new DatabaseService();
