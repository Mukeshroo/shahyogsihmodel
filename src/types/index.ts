export type UserRole = 'customer' | 'worker' | 'secretary' | 'federation' | 'admin';

export interface User {
  id: string;
  email: string;
  phone: string;
  name: string;
  role: UserRole;
  avatar: string;
  address: string;
  district: string;
  language: 'en' | 'hi';
  createdAt: string;
}

export interface Cooperative {
  id: string;
  name: string;
  registrationNumber: string;
  district: string;
  address: string;
  secretaryId: string;
  secretaryName: string;
  memberCount: number;
  commissionRate: number; // e.g. 10%
  welfareRate: number; // e.g. 2%
  phone: string;
}

export interface ServiceCategory {
  id: string;
  name: string;
  nameHi: string;
  icon: string;
  description: string;
  descriptionHi: string;
  basePrice: number;
  turnaroundTime: string;
  unit: string;
}

export interface Worker {
  id: string;
  userId: string;
  name: string;
  phone: string;
  avatar: string;
  cooperativeId: string;
  cooperativeName: string;
  status: 'PENDING' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED' | 'SUSPENDED';
  approvedSkills: string[];
  experienceYears: number;
  rating: number;
  completedJobs: number;
  isAvailable: boolean;
  lat: number;
  lng: number;
  upiId: string;
  bankAccount: string;
  qrCertificateId: string;
  welfareEnrolled: boolean;
  address: string;
  area: string;
  joinedAt: string;
  todayEarnings?: number;
  totalEarnings?: number;
}

export interface SkillCertificate {
  id: string;
  certificateNumber: string;
  workerId: string;
  workerName: string;
  cooperativeId: string;
  cooperativeName: string;
  skills: string[];
  issueDate: string;
  expiryDate: string;
  status: 'ACTIVE' | 'EXPIRED' | 'REVOKED';
  signatureHash: string;
  verificationUrl: string;
  authorizedBy: string;
}

export type BookingStatus =
  | 'PENDING'
  | 'MATCHING'
  | 'ASSIGNED'
  | 'ACCEPTED'
  | 'ON_THE_WAY'
  | 'ARRIVED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'DISPUTED';

export interface Booking {
  id: string;
  bookingCode: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  address: string;
  area: string;
  lat: number;
  lng: number;
  serviceCategoryId: string;
  serviceName: string;
  description: string;
  scheduledTime: string;
  isEmergency: boolean;
  status: BookingStatus;
  assignedWorkerId: string | null;
  workerName: string | null;
  workerPhone: string | null;
  workerAvatar: string | null;
  otpCode: string;
  totalAmount: number;
  workerShare: number; // 90%
  platformFee: number; // 10%
  welfareFee: number; // 2%
  paymentMethod: 'UPI' | 'GATEWAY_RAZORPAY' | 'CASH';
  paymentStatus: 'PENDING' | 'PAID' | 'REFUNDED';
  transactionId?: string;
  createdAt: string;
  completedAt?: string;
  rating?: number;
  reviewComment?: string;
  allocationDetails?: {
    score: number;
    explanation: string;
  };
}

export interface PaymentTransaction {
  id: string;
  bookingId: string;
  bookingCode: string;
  transactionId: string;
  amount: number;
  workerShare: number;
  platformFee: number;
  welfareFee: number;
  paymentMethod: 'UPI' | 'GATEWAY_RAZORPAY' | 'CASH';
  status: 'CAPTURED' | 'PENDING' | 'SETTLED' | 'REFUNDED';
  signatureVerified: boolean;
  payerName: string;
  workerName: string;
  createdAt: string;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  bookingId: string;
  bookingCode: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  workerName: string;
  workerCertificateId: string;
  cooperativeName: string;
  cooperativeGst: string;
  serviceName: string;
  baseAmount: number;
  gstAmount: number;
  totalAmount: number;
  workerShare: number;
  platformCommission: number;
  welfareContribution: number;
  paymentStatus: 'PAID' | 'PENDING' | 'REFUNDED';
  paymentMethod: string;
  issuedAt: string;
}

export interface WorkerWelfare {
  workerId: string;
  workerName: string;
  cooperativeName: string;
  policyNumber: string;
  insuranceScheme: string; // e.g. "PM Suraksha Bima + Cooperative Accidental"
  coverageAmount: number; // e.g. ₹2,00,000
  annualPremium: number; // e.g. ₹450
  subsidyPaid: number; // e.g. ₹450 (100% paid by Sahyog Welfare Pool)
  renewalDate: string;
  status: 'ACTIVE' | 'EXPIRED';
  claims: {
    id: string;
    type: string;
    amount: number;
    status: 'APPROVED' | 'IN_PROCESS' | 'SETTLED';
    filedDate: string;
  }[];
  totalContributionsFromGigs: number;
}

export interface DemandForecast {
  id: string;
  areaName: string;
  wardNumber: string;
  serviceCategory: string;
  currentWeeklyDemand: number;
  forecastedWeeklyDemand: number;
  growthPercentage: number;
  workerSupplyCount: number;
  shortageWarning: boolean;
  shortageWorkersNeeded: number;
  confidenceScore: number;
  modelVersion: string;
}

export interface FairAllocationCandidate {
  workerId: string;
  workerName: string;
  skillScore: number; // 0-100
  distanceKm: number;
  distanceScore: number; // 0-100
  availabilityScore: number; // 0-100
  workloadScore: number; // 0-100
  fairnessRotationScore: number; // 0-100
  finalScore: number; // weighted sum
}

export interface FairAllocationLog {
  id: string;
  bookingId: string;
  timestamp: string;
  serviceCategory: string;
  candidatesScored: FairAllocationCandidate[];
  selectedWorkerId: string;
  selectedWorkerName: string;
  reason: string;
}

export interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  role: string;
  action: string;
  entityType: string;
  entityId: string;
  details: string;
  timestamp: string;
}

export interface Complaint {
  id: string;
  complaintCode: string;
  bookingId: string;
  customerId: string;
  customerName: string;
  workerId: string;
  workerName: string;
  subject: string;
  description: string;
  status: 'OPEN' | 'IN_REVIEW' | 'RESOLVED';
  resolutionNote?: string;
  createdAt: string;
  resolvedAt?: string;
}

export interface SystemSettings {
  platformFeePercent: number; // 10
  workerWelfarePercent: number; // 2
  cooperativeAdminPercent: number; // 8
  razorpaySandboxKey: string;
  emergencySearchRadiusKm: number;
  autoAllocationTimeoutSec: number;
  bhashiniVoiceEnabled: boolean;
  whatsappNotificationsActive: boolean;
}

export interface AppNotification {
  id: string;
  recipientUserId: string;
  type: 'BOOKING' | 'EMERGENCY' | 'PAYMENT' | 'VERIFICATION' | 'WELFARE';
  channel: 'IN_APP' | 'WHATSAPP' | 'SMS';
  title: string;
  message: string;
  read: boolean;
  timestamp: string;
  actionUrl?: string;
}
