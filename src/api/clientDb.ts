import {
  User,
  Cooperative,
  ServiceCategory,
  Worker,
  SkillCertificate,
  Booking,
  BookingStatus,
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
} from '../types/index.ts';

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
} from '../../server/seedData.ts';

const STORAGE_KEY = 'sahyog_browser_db_v2';

interface DbData {
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

function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return parseFloat((R * c).toFixed(2));
}

class ClientDbService {
  private data: DbData;

  constructor() {
    this.data = this.load();
  }

  private load(): DbData {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.warn('Failed to parse localStorage db, resetting to initial seed', e);
    }

    const initial: DbData = {
      users: [...initialUsers],
      cooperatives: [...initialCooperatives],
      categories: [...initialCategories],
      workers: [...initialWorkers],
      certificates: [...initialCertificates],
      bookings: [...initialBookings],
      payments: [...initialPayments],
      invoices: [...initialInvoices],
      welfare: [...initialWelfare],
      forecasts: [...initialDemandForecasts],
      complaints: [...initialComplaints],
      auditLogs: [...initialAuditLogs],
      settings: { ...initialSystemSettings },
      notifications: [...initialNotifications],
      fairAllocationLogs: []
    };
    this.save(initial);
    return initial;
  }

  private save(data: DbData) {
    this.data = data;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      console.warn('Failed to write to localStorage', e);
    }
  }

  // --- Auth ---
  public getUsers(): User[] {
    return this.data.users;
  }

  public login(email: string) {
    const user = this.data.users.find(
      (u) => u.email.toLowerCase() === email.trim().toLowerCase()
    );
    if (!user) {
      // Auto-create demo customer user if not found
      const newUser: User = {
        id: `user-${Date.now()}`,
        email: email.trim(),
        name: email.split('@')[0],
        phone: '+91 98399 00000',
        role: 'customer',
        avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
        address: 'Kalyanpur, Kanpur',
        district: 'Kanpur Nagar',
        language: 'hi',
        createdAt: new Date().toISOString()
      };
      this.data.users.push(newUser);
      this.save(this.data);
      return {
        token: `jwt_sim_${newUser.id}`,
        user: newUser,
        workerProfile: null
      };
    }

    const workerProfile =
      user.role === 'worker'
        ? this.data.workers.find((w) => w.userId === user.id) || null
        : null;

    return {
      token: `jwt_sim_${user.id}`,
      user,
      workerProfile
    };
  }

  public register(data: any) {
    const existing = this.data.users.find((u) => u.email === data.email);
    if (existing) {
      return this.login(data.email);
    }

    const userId = `user-${Date.now()}`;
    const user: User = {
      id: userId,
      email: data.email,
      phone: data.phone || '+91 98390 00000',
      name: data.name,
      role: data.role || 'customer',
      avatar:
        data.role === 'worker'
          ? 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150'
          : 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150',
      address: data.address || 'Kanpur, UP',
      district: 'Kanpur Nagar',
      language: data.language || 'hi',
      createdAt: new Date().toISOString()
    };

    this.data.users.push(user);

    let workerProfile: Worker | null = null;
    if (data.role === 'worker') {
      const coop = this.data.cooperatives[0];
      const certId = `CERT-KNP-${Date.now().toString().slice(-4)}`;
      workerProfile = {
        id: `work-${Date.now()}`,
        userId: user.id,
        name: user.name,
        phone: user.phone,
        avatar: user.avatar,
        cooperativeId: coop.id,
        cooperativeName: coop.name,
        status: 'PENDING',
        approvedSkills: data.skills || ['cat-electrician'],
        experienceYears: Number(data.experienceYears) || 2,
        rating: 4.8,
        completedJobs: 0,
        isAvailable: true,
        lat: 26.496,
        lng: 80.334,
        upiId: `${data.name.toLowerCase().replace(/\s+/g, '')}@upi`,
        bankAccount: '998822334455',
        qrCertificateId: certId,
        welfareEnrolled: true,
        address: data.address || 'Kanpur',
        area: 'Kalyanpur',
        joinedAt: new Date().toISOString().split('T')[0]
      };
      this.data.workers.push(workerProfile);
    }

    this.save(this.data);
    return {
      token: `jwt_sim_${user.id}`,
      user,
      workerProfile
    };
  }

  // --- Services ---
  public getCategories() {
    return this.data.categories;
  }

  // --- Cooperatives ---
  public getCooperatives() {
    return this.data.cooperatives;
  }

  // --- Workers ---
  public getWorkers(filters?: { status?: string; categoryId?: string; cooperativeId?: string }) {
    let result = [...this.data.workers];
    if (filters?.status) {
      result = result.filter((w) => w.status === filters.status);
    }
    if (filters?.categoryId) {
      result = result.filter((w) => w.approvedSkills.includes(filters.categoryId!));
    }
    if (filters?.cooperativeId) {
      result = result.filter((w) => w.cooperativeId === filters.cooperativeId);
    }
    return result;
  }

  public getWorkerById(id: string) {
    return this.data.workers.find((w) => w.id === id) || null;
  }

  public updateWorker(id: string, updates: Partial<Worker>) {
    const idx = this.data.workers.findIndex((w) => w.id === id);
    if (idx === -1) return null;
    this.data.workers[idx] = { ...this.data.workers[idx], ...updates };
    this.save(this.data);
    return this.data.workers[idx];
  }

  public approveWorker(id: string, approvedBy: string) {
    const worker = this.getWorkerById(id);
    if (!worker) return null;
    worker.status = 'APPROVED';

    // Issue certificate if none
    const existingCert = this.data.certificates.find((c) => c.workerId === worker.id);
    if (!existingCert) {
      const cert: SkillCertificate = {
        id: `cert-${Date.now()}`,
        certificateNumber: worker.qrCertificateId || `CERT-KNP-2026-${Date.now().toString().slice(-4)}`,
        workerId: worker.id,
        workerName: worker.name,
        cooperativeId: worker.cooperativeId,
        cooperativeName: worker.cooperativeName,
        skills: worker.approvedSkills.map((s) => s.replace('cat-', '').toUpperCase() + ' Certified'),
        issueDate: new Date().toISOString().split('T')[0],
        expiryDate: new Date(Date.now() + 365 * 24 * 3600 * 1000).toISOString().split('T')[0],
        status: 'ACTIVE',
        signatureHash: `sha256_sig_${Date.now()}`,
        verificationUrl: `/verify/${worker.qrCertificateId}`,
        authorizedBy: approvedBy || 'Secretary Alok Nath Mishra'
      };
      this.data.certificates.push(cert);
    }

    this.save(this.data);
    return worker;
  }

  public rejectWorker(id: string) {
    const worker = this.getWorkerById(id);
    if (!worker) return null;
    worker.status = 'REJECTED';
    this.save(this.data);
    return worker;
  }

  // --- Bookings & Fair Allocation ---
  public getBookings(filters?: { customerId?: string; workerId?: string; cooperativeId?: string; status?: string }) {
    let result = [...this.data.bookings];
    if (filters?.customerId) {
      result = result.filter((b) => b.customerId === filters.customerId);
    }
    if (filters?.workerId) {
      result = result.filter((b) => b.assignedWorkerId === filters.workerId);
    }
    if (filters?.status) {
      result = result.filter((b) => b.status === filters.status);
    }
    // Return newest first
    return result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public getBookingById(id: string) {
    return this.data.bookings.find((b) => b.id === id) || null;
  }

  public allocateWorker(categoryId: string, customerLat: number, customerLng: number): {
    selectedWorker: Worker | null;
    candidates: FairAllocationCandidate[];
  } {
    const eligible = this.data.workers.filter(
      (w) => w.status === 'APPROVED' && w.approvedSkills.includes(categoryId)
    );

    if (eligible.length === 0) {
      return { selectedWorker: null, candidates: [] };
    }

    const candidates: FairAllocationCandidate[] = eligible.map((worker) => {
      const distanceKm = calculateDistanceKm(customerLat, customerLng, worker.lat, worker.lng);
      const skillScore = 100;
      const distanceScore = Math.max(0, Math.round((1 - distanceKm / 20) * 100));
      const availabilityScore = worker.isAvailable ? 100 : 20;
      const workloadScore = Math.max(10, Math.round((1 - worker.completedJobs / 50) * 100));
      const fairnessRotationScore = 85;

      const finalScore = parseFloat(
        (
          skillScore * 0.3 +
          distanceScore * 0.25 +
          availabilityScore * 0.15 +
          workloadScore * 0.15 +
          fairnessRotationScore * 0.15
        ).toFixed(1)
      );

      return {
        workerId: worker.id,
        workerName: worker.name,
        skillScore,
        distanceKm,
        distanceScore,
        availabilityScore,
        workloadScore,
        fairnessRotationScore,
        finalScore
      };
    });

    candidates.sort((a, b) => b.finalScore - a.finalScore);
    if (candidates.length > 0) {
      const selectedWorker = this.getWorkerById(candidates[0].workerId);
      return { selectedWorker, candidates };
    }

    return { selectedWorker: null, candidates: [] };
  }

  public createBooking(data: any): Booking {
    const category = this.data.categories.find((c) => c.id === data.categoryId);
    const amount = Number(data.estimatedAmount) || category?.basePrice || 350;

    // 90/10 Cooperative Split
    const platformFee = parseFloat((amount * (this.data.settings.platformFeePercent / 100)).toFixed(2));
    const workerShare = parseFloat((amount - platformFee).toFixed(2));
    const welfareFee = parseFloat((amount * (this.data.settings.workerWelfarePercent / 100)).toFixed(2));

    const custLat = Number(data.customerLat) || 26.494;
    const custLng = Number(data.customerLng) || 80.332;

    let worker: Worker | null = null;
    let candidates: FairAllocationCandidate[] = [];

    if (data.workerId) {
      worker = this.getWorkerById(data.workerId);
    } else {
      const alloc = this.allocateWorker(data.categoryId, custLat, custLng);
      worker = alloc.selectedWorker;
      candidates = alloc.candidates;
    }

    const bookingId = `SHY-26-${Math.floor(1000 + Math.random() * 9000)}`;
    const otp = Math.floor(1000 + Math.random() * 9000).toString();

    const booking: Booking = {
      id: bookingId,
      bookingCode: bookingId,
      customerId: data.customerId || 'user-cust-1',
      customerName: data.customerName || 'Priya Sharma',
      customerPhone: data.customerPhone || '+91 98390 12345',
      address: data.customerAddress || 'Flat 402, Kalyanpur, Kanpur',
      area: 'Kalyanpur',
      lat: custLat,
      lng: custLng,
      serviceCategoryId: data.categoryId || 'cat-electrician',
      serviceName: category?.name || 'Electrician Services',
      description: data.description || 'Service required in Kanpur',
      scheduledTime: data.scheduledDate || new Date().toISOString(),
      isEmergency: Boolean(data.isEmergency),
      status: worker ? 'ACCEPTED' : 'PENDING',
      assignedWorkerId: worker?.id || null,
      workerName: worker?.name || null,
      workerPhone: worker?.phone || null,
      workerAvatar: worker?.avatar || null,
      otpCode: otp,
      totalAmount: amount,
      workerShare,
      platformFee,
      welfareFee,
      paymentMethod: 'UPI',
      paymentStatus: 'PENDING',
      createdAt: new Date().toISOString()
    };

    this.data.bookings.unshift(booking);

    // Save allocation log
    if (candidates.length > 0) {
      this.data.fairAllocationLogs.push({
        id: `fair-${Date.now()}`,
        bookingId: booking.id,
        timestamp: new Date().toISOString(),
        serviceCategory: booking.serviceName,
        candidatesScored: candidates,
        selectedWorkerId: worker?.id || '',
        selectedWorkerName: worker?.name || '',
        reason: `Worker ${worker?.name} selected with highest score (${candidates[0].finalScore}) based on distance (${candidates[0].distanceKm} km), skill rating, and rotation equity.`
      });
    }

    // Generate Invoice Draft
    const invoiceId = `INV-26-${booking.id.replace('SHY-26-', '')}`;
    const invoice: Invoice = {
      id: invoiceId,
      invoiceNumber: invoiceId,
      bookingId: booking.id,
      bookingCode: booking.bookingCode,
      customerName: booking.customerName,
      customerPhone: booking.customerPhone,
      customerAddress: booking.address,
      workerName: worker?.name || 'Assigned Worker',
      workerCertificateId: worker?.qrCertificateId || 'CERT-KNP-2026-ELEC-0492',
      cooperativeName: worker?.cooperativeName || 'Kalyanpur Shramik Sahyog Samiti',
      cooperativeGst: '09AAACK0192Q1ZV',
      serviceName: booking.serviceName,
      baseAmount: amount,
      gstAmount: 0,
      totalAmount: amount,
      workerShare,
      platformCommission: platformFee,
      welfareContribution: welfareFee,
      paymentMethod: 'UPI',
      paymentStatus: 'PENDING',
      issuedAt: new Date().toISOString()
    };
    this.data.invoices.push(invoice);

    // Add In-App notification
    this.data.notifications.unshift({
      id: `notif-${Date.now()}`,
      recipientUserId: booking.customerId,
      type: 'BOOKING',
      channel: 'IN_APP',
      title: 'Booking Confirmed!',
      message: `Your booking ${booking.id} with ${booking.workerName || 'cooperative worker'} is confirmed. OTP: ${booking.otpCode}`,
      read: false,
      timestamp: new Date().toISOString(),
      actionUrl: '/customer'
    });

    this.save(this.data);
    return booking;
  }

  public createEmergencyBooking(data: any): Booking {
    const custLat = Number(data.customerLat) || 26.496;
    const custLng = Number(data.customerLng) || 80.334;

    const nearbyWorkers = this.data.workers
      .filter((w) => w.status === 'APPROVED' && w.isAvailable)
      .map((w) => ({
        ...w,
        distance: calculateDistanceKm(custLat, custLng, w.lat, w.lng)
      }))
      .sort((a, b) => a.distance - b.distance);

    const nearestWorker = nearbyWorkers[0] || this.data.workers[0];

    return this.createBooking({
      ...data,
      isEmergency: true,
      workerId: nearestWorker?.id,
      customerLat: custLat,
      customerLng: custLng,
      description: `[EMERGENCY SOS] ${data.hazardDescription || 'Urgent repair required'}`
    });
  }

  public updateBookingStatus(id: string, status: BookingStatus, extra?: Partial<Booking>) {
    const idx = this.data.bookings.findIndex((b) => b.id === id);
    if (idx === -1) return null;

    const current = this.data.bookings[idx];
    const updated: Booking = {
      ...current,
      status,
      ...extra
    };

    if (status === 'COMPLETED') {
      updated.completedAt = new Date().toISOString();
      if (updated.assignedWorkerId) {
        const wIdx = this.data.workers.findIndex((w) => w.id === updated.assignedWorkerId);
        if (wIdx !== -1) {
          this.data.workers[wIdx].completedJobs += 1;
        }
      }
    }

    this.data.bookings[idx] = updated;

    // Update invoice status if completed
    const invIdx = this.data.invoices.findIndex((inv) => inv.bookingId === id);
    if (invIdx !== -1) {
      if (status === 'COMPLETED' || updated.paymentStatus === 'PAID') {
        this.data.invoices[invIdx].paymentStatus = 'PAID';
      }
    }

    this.save(this.data);
    return updated;
  }

  public rateBooking(id: string, rating: number, comment?: string) {
    const booking = this.getBookingById(id);
    if (!booking) return null;

    booking.rating = rating;
    booking.reviewComment = comment;

    // Recalculate worker rating
    if (booking.assignedWorkerId) {
      const worker = this.getWorkerById(booking.assignedWorkerId);
      if (worker) {
        worker.rating = parseFloat(((worker.rating * 4 + rating) / 5).toFixed(1));
      }
    }

    this.save(this.data);
    return booking;
  }

  // --- Payments & Ledger ---
  public verifyPayment(bookingId: string, paymentMethod: 'UPI' | 'GATEWAY_RAZORPAY' | 'CASH') {
    const booking = this.getBookingById(bookingId);
    if (!booking) return null;

    booking.paymentStatus = 'PAID';
    booking.paymentMethod = paymentMethod;
    if (booking.status === 'ACCEPTED' || booking.status === 'ON_THE_WAY' || booking.status === 'IN_PROGRESS' || booking.status === 'ARRIVED') {
      booking.status = 'COMPLETED';
      booking.completedAt = new Date().toISOString();
    }

    const txId = `TXN-KNP-${Date.now()}`;
    const tx: PaymentTransaction = {
      id: txId,
      bookingId: booking.id,
      bookingCode: booking.bookingCode,
      transactionId: txId,
      amount: booking.totalAmount,
      workerShare: booking.workerShare,
      platformFee: booking.platformFee,
      welfareFee: booking.welfareFee,
      paymentMethod,
      status: 'CAPTURED',
      signatureVerified: true,
      payerName: booking.customerName,
      workerName: booking.workerName || 'Assigned Worker',
      createdAt: new Date().toISOString()
    };
    this.data.payments.unshift(tx);

    // Update invoice
    const invoice = this.data.invoices.find((inv) => inv.bookingId === booking.id);
    if (invoice) {
      invoice.paymentStatus = 'PAID';
    }

    // Credit Worker Welfare Pool (2%)
    if (booking.assignedWorkerId) {
      const welfare = this.data.welfare.find((w) => w.workerId === booking.assignedWorkerId);
      if (welfare) {
        welfare.totalContributionsFromGigs += booking.welfareFee;
      }
    }

    this.save(this.data);
    return { booking, transaction: tx, invoice };
  }

  // --- Certificates ---
  public getCertificate(id: string) {
    return (
      this.data.certificates.find(
        (c) => c.certificateNumber === id || c.id === id || c.workerId === id
      ) || null
    );
  }

  public getCertificates(): SkillCertificate[] {
    return this.data.certificates;
  }

  // --- Analytics Overview ---
  public getAnalyticsOverview() {
    const workers = this.data.workers;
    const bookings = this.data.bookings;
    const cooperatives = this.data.cooperatives;
    const totalVolume = bookings.reduce((sum, b) => sum + (b.totalAmount || 0), 0);
    const workerEarnings = bookings.reduce((sum, b) => sum + (b.workerShare || 0), 0);
    const platformCommissions = bookings.reduce((sum, b) => sum + (b.platformFee || 0), 0);
    const welfarePool = bookings.reduce((sum, b) => sum + (b.welfareFee || 0), 0);

    return {
      totalCooperatives: cooperatives.length,
      totalWorkers: workers.length,
      approvedWorkers: workers.filter((w) => w.status === 'APPROVED').length,
      activeWorkersOnline: workers.filter((w) => w.isAvailable).length,
      totalBookings: bookings.length,
      completedBookings: bookings.filter((b) => b.status === 'COMPLETED').length,
      emergencySosCalls: bookings.filter((b) => b.isEmergency).length,
      totalVolume,
      workerEarnings,
      platformCommissions,
      welfarePool,
      fairAllocationRotationIndex: '96.8% (Equitable gig distribution active)',
      fairAllocationLogs: this.data.fairAllocationLogs.slice(0, 5)
    };
  }

  public verifyOtpAndStartBooking(id: string, otp: string) {
    const booking = this.getBookingById(id);
    if (!booking) return { error: 'Booking not found' };
    if (booking.otpCode && booking.otpCode !== otp.trim()) {
      return { error: 'Invalid start OTP. Please verify with customer.' };
    }
    const updated = this.updateBookingStatus(id, 'IN_PROGRESS');
    return { success: true, booking: updated };
  }

  public completeBooking(id: string, finalAmount?: number) {
    const booking = this.getBookingById(id);
    if (!booking) return null;
    if (finalAmount && finalAmount > 0) {
      booking.totalAmount = finalAmount;
      const workerShare = Math.round(finalAmount * 0.90);
      const welfareFee = Math.round(finalAmount * 0.02);
      const platformFee = finalAmount - workerShare - welfareFee;
      booking.workerShare = workerShare;
      booking.welfareFee = welfareFee;
      booking.platformFee = platformFee;
    }
    const updated = this.updateBookingStatus(id, 'COMPLETED');
    const invoice = this.data.invoices.find((i) => i.bookingId === id) || null;
    return { booking: updated, invoice };
  }

  // --- Invoices ---
  public getInvoiceByBookingId(bookingId: string) {
    return this.data.invoices.find((i) => i.bookingId === bookingId) || null;
  }

  public getInvoices() {
    return this.data.invoices;
  }

  // --- Welfare ---
  public getWelfare(workerId?: string) {
    if (workerId) {
      return this.data.welfare.find((w) => w.workerId === workerId) || null;
    }
    return this.data.welfare;
  }

  public submitWelfareClaim(data: any) {
    const welfare = this.data.welfare.find((w) => w.workerId === data.workerId);
    if (!welfare) return null;

    const claim = {
      id: `CLM-${Date.now()}`,
      type: data.policyType || 'UP Gig Worker Accidental Claim',
      amount: Number(data.amount) || 15000,
      status: 'IN_PROCESS' as const,
      filedDate: new Date().toISOString().split('T')[0]
    };

    welfare.claims.unshift(claim);
    this.save(this.data);
    return claim;
  }

  // --- Forecasts ---
  public getForecasts() {
    return this.data.forecasts;
  }

  // --- Complaints ---
  public getComplaints() {
    return this.data.complaints;
  }

  public createComplaint(data: any) {
    const code = `CMP-26-${Math.floor(1000 + Math.random() * 9000)}`;
    const comp: Complaint = {
      id: code,
      complaintCode: code,
      bookingId: data.bookingId,
      customerId: data.customerId || 'user-cust-1',
      customerName: data.customerName || 'Priya Sharma',
      workerId: data.workerId || 'work-1',
      workerName: data.workerName || 'Ramesh Verma',
      subject: data.subject || 'Service quality issue',
      description: data.description || 'Description of complaint',
      status: 'OPEN',
      createdAt: new Date().toISOString()
    };
    this.data.complaints.unshift(comp);
    this.save(this.data);
    return comp;
  }

  public resolveComplaint(id: string, resolutionNote: string) {
    const comp = this.data.complaints.find((c) => c.id === id);
    if (!comp) return null;
    comp.status = 'RESOLVED';
    comp.resolutionNote = resolutionNote;
    comp.resolvedAt = new Date().toISOString();
    this.save(this.data);
    return comp;
  }

  // --- Settings & Audit ---
  public getSettings() {
    return this.data.settings;
  }

  public updateSettings(updates: Partial<SystemSettings>) {
    this.data.settings = { ...this.data.settings, ...updates };
    this.save(this.data);
    return this.data.settings;
  }

  public getAuditLogs() {
    return this.data.auditLogs;
  }

  public getPayments() {
    return this.data.payments;
  }

  // --- Notifications ---
  public getNotifications() {
    return this.data.notifications;
  }

  public markNotificationAsRead(id: string) {
    const notif = this.data.notifications.find((n) => n.id === id);
    if (notif) {
      notif.read = true;
      this.save(this.data);
    }
    return notif;
  }
}

export const clientDb = new ClientDbService();
