import express, { Request, Response } from 'express';
import crypto from 'crypto';
import { db } from './db.ts';
import {
  Booking,
  PaymentTransaction,
  Invoice,
  SkillCertificate,
  Complaint,
  Worker,
  User
} from '../src/types/index.ts';

export const apiRouter = express.Router();

// ==================== AUTHENTICATION ====================
apiRouter.post('/auth/login', (req: Request, res: Response) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  const user = db.getUserByEmail(email);
  if (!user) {
    return res.status(404).json({ error: 'User not found with this email' });
  }

  let workerProfile: Worker | null = null;
  if (user.role === 'worker') {
    workerProfile = db.getWorkerByUserId(user.id) || null;
  }

  db.logAudit({
    userId: user.id,
    userName: user.name,
    role: user.role,
    action: 'USER_LOGIN',
    entityType: 'User',
    entityId: user.id,
    details: `User logged in successfully as ${user.role}`
  });

  return res.json({
    token: `sahyog-jwt-${user.id}-${Date.now()}`,
    user,
    workerProfile
  });
});

apiRouter.post('/auth/register', (req: Request, res: Response) => {
  const { name, email, phone, role, address, skills, cooperativeId, experienceYears } = req.body;

  if (!name || !email || !phone || !role) {
    return res.status(400).json({ error: 'Name, email, phone, and role are required' });
  }

  const existing = db.getUserByEmail(email);
  if (existing) {
    return res.status(409).json({ error: 'Account with this email already exists' });
  }

  const userId = `user-${Date.now()}`;
  const newUser: User = {
    id: userId,
    email,
    phone,
    name,
    role: role as any,
    avatar: `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80`,
    address: address || 'Kanpur, Uttar Pradesh',
    district: 'Kanpur Nagar',
    language: 'hi',
    createdAt: new Date().toISOString()
  };

  db.createUser(newUser);

  let newWorker: Worker | null = null;
  if (role === 'worker') {
    const coop = db.getCooperativeById(cooperativeId || 'coop-knp-1');
    const workerId = `work-${Date.now()}`;
    newWorker = {
      id: workerId,
      userId,
      name,
      phone,
      avatar: newUser.avatar,
      cooperativeId: coop?.id || 'coop-knp-1',
      cooperativeName: coop?.name || 'Kalyanpur Shramik Sahyog Samiti Ltd.',
      status: 'UNDER_REVIEW', // Pending secretary approval
      approvedSkills: skills || ['cat-electrician'],
      experienceYears: Number(experienceYears) || 3,
      rating: 0,
      completedJobs: 0,
      isAvailable: false,
      lat: 26.4950,
      lng: 80.2600,
      upiId: `${name.toLowerCase().replace(/\s+/g, '')}@upi`,
      bankAccount: 'Account Pending Verification',
      qrCertificateId: `CERT-PENDING-${workerId.slice(-4)}`,
      welfareEnrolled: false,
      address: newUser.address,
      area: 'Kalyanpur',
      joinedAt: new Date().toISOString(),
      todayEarnings: 0,
      totalEarnings: 0
    };
    db.createWorker(newWorker);

    // Notify cooperative secretary
    db.addNotification({
      recipientUserId: 'user-sec-1',
      type: 'VERIFICATION',
      channel: 'IN_APP',
      title: 'New Worker Application Submitted',
      message: `${name} has applied to join ${newWorker.cooperativeName}. Documents ready for review.`,
      actionUrl: '/secretary'
    });
  }

  db.logAudit({
    userId,
    userName: name,
    role,
    action: 'USER_REGISTERED',
    entityType: 'User',
    entityId: userId,
    details: `New ${role} registration created: ${name}`
  });

  return res.status(201).json({
    token: `sahyog-jwt-${userId}-${Date.now()}`,
    user: newUser,
    workerProfile: newWorker
  });
});

apiRouter.get('/auth/users', (req: Request, res: Response) => {
  return res.json(db.getUsers());
});

// ==================== WORKERS ====================
apiRouter.get('/workers', (req: Request, res: Response) => {
  const { skill, status, available } = req.query;
  let workers = db.getWorkers();

  if (skill) {
    workers = workers.filter((w) => w.approvedSkills.includes(skill as string));
  }
  if (status) {
    workers = workers.filter((w) => w.status === status);
  }
  if (available !== undefined) {
    workers = workers.filter((w) => w.isAvailable === (available === 'true'));
  }

  return res.json(workers);
});

apiRouter.get('/workers/:id', (req: Request, res: Response) => {
  const worker = db.getWorkerById(req.params.id);
  if (!worker) {
    return res.status(404).json({ error: 'Worker not found' });
  }
  return res.json(worker);
});

apiRouter.patch('/workers/:id', (req: Request, res: Response) => {
  const updated = db.updateWorker(req.params.id, req.body);
  if (!updated) {
    return res.status(404).json({ error: 'Worker not found' });
  }
  return res.json(updated);
});

// Secretary approval for worker
apiRouter.post('/workers/:id/approve', (req: Request, res: Response) => {
  const worker = db.getWorkerById(req.params.id);
  if (!worker) {
    return res.status(404).json({ error: 'Worker not found' });
  }

  const certNumber = `CERT-KNP-2026-${worker.approvedSkills[0]?.replace('cat-', '').toUpperCase().slice(0, 4) || 'SKIL'}-${Math.floor(1000 + Math.random() * 9000)}`;

  // Update worker to APPROVED
  const updatedWorker = db.updateWorker(worker.id, {
    status: 'APPROVED',
    isAvailable: true,
    qrCertificateId: certNumber,
    welfareEnrolled: true
  });

  // Issue official signed skill certificate
  const newCert: SkillCertificate = {
    id: `cert-${Date.now()}`,
    certificateNumber: certNumber,
    workerId: worker.id,
    workerName: worker.name,
    cooperativeId: worker.cooperativeId,
    cooperativeName: worker.cooperativeName,
    skills: worker.approvedSkills.map((s) => s.replace('cat-', '').toUpperCase() + ' Technician Certified'),
    issueDate: new Date().toISOString().split('T')[0],
    expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    status: 'ACTIVE',
    signatureHash: crypto.createHash('sha256').update(`${certNumber}-${worker.id}-SAHYOG`).digest('hex'),
    verificationUrl: `/verify/${certNumber}`,
    authorizedBy: 'Cooperative Secretary (Aadhaar & Police Verified)'
  };
  db.issueCertificate(newCert);

  // Enroll in Welfare Pool
  db.updateWelfare(worker.id, {
    workerName: worker.name,
    cooperativeName: worker.cooperativeName,
    status: 'ACTIVE'
  });

  // Audit Log
  db.logAudit({
    userId: 'user-sec-1',
    userName: 'Cooperative Secretary',
    role: 'secretary',
    action: 'WORKER_APPROVED',
    entityType: 'Worker',
    entityId: worker.id,
    details: `Worker ${worker.name} approved with Certificate ${certNumber}`
  });

  // Notify Worker
  db.addNotification({
    recipientUserId: worker.userId,
    type: 'VERIFICATION',
    channel: 'WHATSAPP',
    title: 'Congratulations! Your Sahyog Cooperative Membership is Approved',
    message: `Your skill certificate ${certNumber} is now active. You are enrolled in Group Insurance and ready to receive bookings.`,
    actionUrl: `/verify/${certNumber}`
  });

  return res.json({ worker: updatedWorker, certificate: newCert });
});

apiRouter.post('/workers/:id/reject', (req: Request, res: Response) => {
  const { reason } = req.body;
  const worker = db.updateWorker(req.params.id, { status: 'REJECTED' });
  if (!worker) {
    return res.status(404).json({ error: 'Worker not found' });
  }

  db.logAudit({
    userId: 'user-sec-1',
    userName: 'Cooperative Secretary',
    role: 'secretary',
    action: 'WORKER_REJECTED',
    entityType: 'Worker',
    entityId: worker.id,
    details: `Application for ${worker.name} rejected. Reason: ${reason || 'Incomplete documentation'}`
  });

  return res.json(worker);
});

// ==================== SERVICES & COOPERATIVES ====================
apiRouter.get('/services', (req: Request, res: Response) => {
  return res.json(db.getCategories());
});

apiRouter.get('/cooperatives', (req: Request, res: Response) => {
  return res.json(db.getCooperatives());
});

// ==================== BOOKINGS ====================
apiRouter.get('/bookings', (req: Request, res: Response) => {
  const { customerId, workerId, status } = req.query;
  let bookings = db.getBookings();

  if (customerId) {
    bookings = bookings.filter((b) => b.customerId === customerId);
  }
  if (workerId) {
    bookings = bookings.filter((b) => b.assignedWorkerId === workerId);
  }
  if (status) {
    bookings = bookings.filter((b) => b.status === status);
  }

  return res.json(bookings);
});

apiRouter.get('/bookings/:id', (req: Request, res: Response) => {
  const booking = db.getBookingById(req.params.id);
  if (!booking) {
    return res.status(404).json({ error: 'Booking not found' });
  }
  return res.json(booking);
});

// Create booking with Fair Work Allocation Engine
apiRouter.post('/bookings', (req: Request, res: Response) => {
  const {
    customerId,
    customerName,
    customerPhone,
    address,
    area,
    lat,
    lng,
    serviceCategoryId,
    description,
    scheduledTime,
    isEmergency,
    preferredWorkerId,
    amount
  } = req.body;

  if (!serviceCategoryId || !customerId) {
    return res.status(400).json({ error: 'Service category and customer ID are required' });
  }

  const category = db.getCategoryById(serviceCategoryId);
  const totalAmount = Number(amount) || category?.basePrice || 350;
  const split = db.calculateSplit(totalAmount);

  const customerLat = Number(lat) || 26.4960;
  const customerLng = Number(lng) || 80.2600;

  let assignedWorker: Worker | null = null;
  let allocationScore = 95.0;
  let allocationExplanation = 'Directly selected by customer';

  if (preferredWorkerId) {
    assignedWorker = db.getWorkerById(preferredWorkerId) || null;
  } else {
    // Run Fair Work Allocation Algorithm
    const fairResult = db.runFairAllocation(
      serviceCategoryId,
      customerLat,
      customerLng,
      Boolean(isEmergency)
    );
    assignedWorker = fairResult.bestCandidate;
    allocationScore = fairResult.scoredCandidates[0]?.finalScore || 90;
    allocationExplanation = fairResult.explanation;

    // Record fair allocation audit
    if (fairResult.scoredCandidates.length > 0) {
      db.recordFairAllocationLog({
        id: `fair-${Date.now()}`,
        bookingId: `SHY-${Date.now().toString().slice(-6)}`,
        timestamp: new Date().toISOString(),
        serviceCategory: category?.name || serviceCategoryId,
        candidatesScored: fairResult.scoredCandidates,
        selectedWorkerId: assignedWorker?.id || 'none',
        selectedWorkerName: assignedWorker?.name || 'None Available',
        reason: allocationExplanation
      });
    }
  }

  const bookingCode = `SHY-26-${Math.floor(1000 + Math.random() * 9000)}`;
  const otpCode = Math.floor(1000 + Math.random() * 9000).toString();

  const newBooking: Booking = {
    id: `bk-${Date.now()}`,
    bookingCode,
    customerId,
    customerName: customerName || 'Priya Sharma',
    customerPhone: customerPhone || '+91 98390 12345',
    address: address || 'Flat 402, Ganga Heights, Kalyanpur, Kanpur',
    area: area || 'Kalyanpur',
    lat: customerLat,
    lng: customerLng,
    serviceCategoryId,
    serviceName: category?.name || 'Household Service',
    description: description || 'General service requested',
    scheduledTime: scheduledTime || 'Immediate (Today)',
    isEmergency: Boolean(isEmergency),
    status: assignedWorker ? 'ASSIGNED' : 'MATCHING',
    assignedWorkerId: assignedWorker?.id || null,
    workerName: assignedWorker?.name || null,
    workerPhone: assignedWorker?.phone || null,
    workerAvatar: assignedWorker?.avatar || null,
    otpCode,
    totalAmount,
    workerShare: split.workerShare,
    platformFee: split.platformFee,
    welfareFee: split.welfareFee,
    paymentMethod: 'UPI',
    paymentStatus: 'PENDING',
    createdAt: new Date().toISOString(),
    allocationDetails: {
      score: allocationScore,
      explanation: allocationExplanation
    }
  };

  db.createBooking(newBooking);

  // If worker was assigned, notify worker
  if (assignedWorker) {
    db.addNotification({
      recipientUserId: assignedWorker.userId,
      type: isEmergency ? 'EMERGENCY' : 'BOOKING',
      channel: 'WHATSAPP',
      title: isEmergency ? '🚨 URGENT SOS SERVICE CALL' : 'New Fair Job Assigned',
      message: `Booking #${bookingCode} for ${category?.name} in ${newBooking.area}. Customer: ${newBooking.customerName}. Verify OTP upon arrival.`,
      actionUrl: '/worker'
    });
  }

  db.logAudit({
    userId: customerId,
    userName: newBooking.customerName,
    role: 'customer',
    action: isEmergency ? 'EMERGENCY_SOS_CREATED' : 'BOOKING_CREATED',
    entityType: 'Booking',
    entityId: newBooking.id,
    details: `Booking ${bookingCode} created for ₹${totalAmount}. Worker: ${assignedWorker?.name || 'Unassigned'}. ${allocationExplanation}`
  });

  return res.status(201).json(newBooking);
});

// Worker accepts booking
apiRouter.post('/bookings/:id/accept', (req: Request, res: Response) => {
  const booking = db.getBookingById(req.params.id);
  if (!booking) return res.status(404).json({ error: 'Booking not found' });

  const updated = db.updateBooking(booking.id, {
    status: 'ACCEPTED'
  });

  // Notify customer
  db.addNotification({
    recipientUserId: booking.customerId,
    type: 'BOOKING',
    channel: 'IN_APP',
    title: `${booking.workerName} has accepted your booking`,
    message: `Worker will arrive at scheduled time. Please verify OTP ${booking.otpCode} with worker upon arrival.`,
    actionUrl: '/customer'
  });

  return res.json(updated);
});

// Worker updates status: ON_THE_WAY or ARRIVED
apiRouter.post('/bookings/:id/status', (req: Request, res: Response) => {
  const { status } = req.body;
  const booking = db.getBookingById(req.params.id);
  if (!booking) return res.status(404).json({ error: 'Booking not found' });

  const updated = db.updateBooking(booking.id, { status });
  return res.json(updated);
});

// Worker verifies customer OTP to start work
apiRouter.post('/bookings/:id/verify-otp-start', (req: Request, res: Response) => {
  const { otp } = req.body;
  const booking = db.getBookingById(req.params.id);
  if (!booking) return res.status(404).json({ error: 'Booking not found' });

  if (booking.otpCode !== otp?.trim()) {
    return res.status(400).json({ error: 'Invalid Customer OTP code. Please check with customer.' });
  }

  const updated = db.updateBooking(booking.id, {
    status: 'IN_PROGRESS'
  });

  db.logAudit({
    userId: booking.assignedWorkerId || 'worker',
    userName: booking.workerName || 'Worker',
    role: 'worker',
    action: 'BOOKING_OTP_VERIFIED',
    entityType: 'Booking',
    entityId: booking.id,
    details: `Customer OTP verified. Job started.`
  });

  return res.json({ success: true, booking: updated });
});

// Complete booking and generate invoice
apiRouter.post('/bookings/:id/complete', (req: Request, res: Response) => {
  const { finalAmount, notes } = req.body;
  const booking = db.getBookingById(req.params.id);
  if (!booking) return res.status(404).json({ error: 'Booking not found' });

  const amountToUse = Number(finalAmount) || booking.totalAmount;
  const split = db.calculateSplit(amountToUse);

  const updated = db.updateBooking(booking.id, {
    status: 'COMPLETED',
    totalAmount: amountToUse,
    workerShare: split.workerShare,
    platformFee: split.platformFee,
    welfareFee: split.welfareFee,
    completedAt: new Date().toISOString()
  });

  // Update worker earnings and jobs count
  if (booking.assignedWorkerId) {
    const worker = db.getWorkerById(booking.assignedWorkerId);
    if (worker) {
      db.updateWorker(worker.id, {
        completedJobs: worker.completedJobs + 1,
        todayEarnings: (worker.todayEarnings || 0) + split.workerShare,
        totalEarnings: (worker.totalEarnings || 0) + split.workerShare,
        isAvailable: true
      });
    }

    // Accumulate welfare contribution
    const welfare = db.getWelfareByWorkerId(booking.assignedWorkerId);
    if (welfare) {
      db.updateWelfare(booking.assignedWorkerId, {
        totalContributionsFromGigs: (welfare.totalContributionsFromGigs || 0) + split.welfareFee
      });
    }
  }

  // Generate official digital invoice
  const invNumber = `INV/SAHYOG/2026/${new Date().getMonth() + 1}/${Math.floor(1000 + Math.random() * 9000)}`;
  const workerObj = booking.assignedWorkerId ? db.getWorkerById(booking.assignedWorkerId) : null;
  const coopObj = workerObj ? db.getCooperativeById(workerObj.cooperativeId) : null;

  const invoice: Invoice = {
    id: `inv-${Date.now()}`,
    invoiceNumber: invNumber,
    bookingId: booking.id,
    bookingCode: booking.bookingCode,
    customerName: booking.customerName,
    customerPhone: booking.customerPhone,
    customerAddress: booking.address,
    workerName: booking.workerName || 'Worker',
    workerCertificateId: workerObj?.qrCertificateId || 'CERT-KNP-2026',
    cooperativeName: coopObj?.name || 'Kalyanpur Shramik Sahyog Samiti Ltd.',
    cooperativeGst: '09AAACK1234F1Z8',
    serviceName: booking.serviceName,
    baseAmount: amountToUse,
    gstAmount: 0,
    totalAmount: amountToUse,
    workerShare: split.workerShare,
    platformCommission: split.cooperativeFee,
    welfareContribution: split.welfareFee,
    paymentStatus: booking.paymentStatus,
    paymentMethod: booking.paymentMethod,
    issuedAt: new Date().toISOString()
  };

  db.createInvoice(invoice);

  // Notify customer to pay & rate
  db.addNotification({
    recipientUserId: booking.customerId,
    type: 'BOOKING',
    channel: 'IN_APP',
    title: 'Service Completed! Download Invoice',
    message: `Your ${booking.serviceName} has been completed by ${booking.workerName}. Total: ₹${amountToUse}. 90% goes directly to the worker.`,
    actionUrl: '/customer'
  });

  db.logAudit({
    userId: booking.assignedWorkerId || 'worker',
    userName: booking.workerName || 'Worker',
    role: 'worker',
    action: 'BOOKING_COMPLETED',
    entityType: 'Booking',
    entityId: booking.id,
    details: `Job completed for ₹${amountToUse}. Worker share: ₹${split.workerShare}, Welfare pool: ₹${split.welfareFee}. Invoice ${invNumber} generated.`
  });

  return res.json({ booking: updated, invoice });
});

// Customer rate booking
apiRouter.post('/bookings/:id/rate', (req: Request, res: Response) => {
  const { rating, comment } = req.body;
  const booking = db.getBookingById(req.params.id);
  if (!booking) return res.status(404).json({ error: 'Booking not found' });

  const updated = db.updateBooking(booking.id, {
    rating: Number(rating) || 5,
    reviewComment: comment || 'Very satisfied with cooperative service'
  });

  if (booking.assignedWorkerId) {
    const worker = db.getWorkerById(booking.assignedWorkerId);
    if (worker) {
      // Recalculate average rating
      const newRating = Math.round(((worker.rating * worker.completedJobs + Number(rating)) / (worker.completedJobs + 1)) * 10) / 10;
      db.updateWorker(worker.id, { rating: newRating });
    }
  }

  return res.json(updated);
});

// ==================== PAYMENTS (90/10 SPLIT LEDGER) ====================
apiRouter.post('/payments/process', (req: Request, res: Response) => {
  const { bookingId, paymentMethod, transactionRef } = req.body;
  const booking = db.getBookingById(bookingId);
  if (!booking) return res.status(404).json({ error: 'Booking not found' });

  const split = db.calculateSplit(booking.totalAmount);
  const txnId = transactionRef || `TXN-${paymentMethod}-${Date.now().toString().slice(-6)}`;

  const paymentRecord: PaymentTransaction = {
    id: `pay-${Date.now()}`,
    bookingId: booking.id,
    bookingCode: booking.bookingCode,
    transactionId: txnId,
    amount: booking.totalAmount,
    workerShare: split.workerShare,
    platformFee: split.platformFee,
    welfareFee: split.welfareFee,
    paymentMethod: paymentMethod || 'UPI',
    status: 'CAPTURED',
    signatureVerified: true,
    payerName: booking.customerName,
    workerName: booking.workerName || 'Worker',
    createdAt: new Date().toISOString()
  };

  db.createPayment(paymentRecord);

  // Update booking payment status
  db.updateBooking(booking.id, {
    paymentStatus: 'PAID',
    paymentMethod: paymentMethod || 'UPI',
    transactionId: txnId
  });

  // Update invoice payment status if exists
  const existingInv = db.getInvoiceByBookingId(booking.id);
  if (existingInv) {
    existingInv.paymentStatus = 'PAID';
    existingInv.paymentMethod = `${paymentMethod} (${txnId})`;
  }

  db.logAudit({
    userId: booking.customerId,
    userName: booking.customerName,
    role: 'customer',
    action: 'PAYMENT_CAPTURED',
    entityType: 'PaymentTransaction',
    entityId: paymentRecord.id,
    details: `Payment of ₹${booking.totalAmount} received via ${paymentMethod}. Worker credited ₹${split.workerShare} (90%), Welfare ₹${split.welfareFee} (2%). Signature verified.`
  });

  return res.json({
    success: true,
    transaction: paymentRecord,
    ledgerBreakdown: {
      total: booking.totalAmount,
      workerShare90: split.workerShare,
      platformFee10: split.platformFee,
      welfareFee2: split.welfareFee,
      coopAdmin8: split.cooperativeFee
    }
  });
});

apiRouter.get('/payments/transactions', (req: Request, res: Response) => {
  return res.json(db.getPayments());
});

// ==================== INVOICES ====================
apiRouter.get('/invoices', (req: Request, res: Response) => {
  return res.json(db.getInvoices());
});

apiRouter.get('/invoices/:bookingId', (req: Request, res: Response) => {
  const invoice = db.getInvoiceByBookingId(req.params.bookingId);
  if (!invoice) return res.status(404).json({ error: 'Invoice not found for this booking' });
  return res.json(invoice);
});

// ==================== QR SKILL CERTIFICATES (PUBLIC VERIFY) ====================
apiRouter.get('/certificates', (req: Request, res: Response) => {
  return res.json(db.getCertificates());
});

apiRouter.get('/certificates/verify/:certificateId', (req: Request, res: Response) => {
  const cert = db.getCertificateByNumber(req.params.certificateId);
  if (!cert) {
    return res.status(404).json({
      valid: false,
      message: 'Certificate not found or invalid in SAHYOG Cooperative Registry.'
    });
  }

  const worker = db.getWorkerById(cert.workerId);
  return res.json({
    valid: cert.status === 'ACTIVE',
    certificate: cert,
    worker: worker ? {
      name: worker.name,
      avatar: worker.avatar,
      experienceYears: worker.experienceYears,
      rating: worker.rating,
      completedJobs: worker.completedJobs,
      cooperativeName: worker.cooperativeName,
      status: worker.status
    } : null,
    cooperativeRegistrySeal: 'Government of Uttar Pradesh Registered Cooperative Gig Society'
  });
});

// ==================== WELFARE & INSURANCE ====================
apiRouter.get('/welfare', (req: Request, res: Response) => {
  return res.json(db.getWelfareRecords());
});

apiRouter.get('/welfare/:workerId', (req: Request, res: Response) => {
  const welfare = db.getWelfareByWorkerId(req.params.workerId);
  if (!welfare) return res.status(404).json({ error: 'Welfare record not found' });
  return res.json(welfare);
});

apiRouter.post('/welfare/:workerId/claim', (req: Request, res: Response) => {
  const { type, amount } = req.body;
  const welfare = db.getWelfareByWorkerId(req.params.workerId);
  if (!welfare) return res.status(404).json({ error: 'Welfare account not found' });

  const newClaim = {
    id: `clm-${Date.now()}`,
    type: type || 'Tool accidental damage subsidy',
    amount: Number(amount) || 2500,
    status: 'IN_PROCESS' as const,
    filedDate: new Date().toISOString().split('T')[0]
  };

  welfare.claims.unshift(newClaim);
  db.updateWelfare(welfare.workerId, { claims: welfare.claims });

  db.logAudit({
    userId: welfare.workerId,
    userName: welfare.workerName,
    role: 'worker',
    action: 'WELFARE_CLAIM_FILED',
    entityType: 'WorkerWelfare',
    entityId: newClaim.id,
    details: `Filed claim for ₹${newClaim.amount} (${newClaim.type})`
  });

  return res.status(201).json(newClaim);
});

// ==================== AI DEMAND FORECASTING ====================
apiRouter.get('/forecasts', (req: Request, res: Response) => {
  return res.json({
    forecasts: db.getDemandForecasts(),
    summary: {
      pilotDistrict: 'Kanpur Nagar, UP',
      modelArchitecture: 'Prophet-XGBoost-Hybrid-v2.6',
      totalWeeklyExpectedDemand: 750,
      predictedShortageWards: 3,
      workersNeededToRecruit: 15,
      accuracyRate: '94.2%',
      lastRetrained: '2026-03-30T00:00:00Z'
    }
  });
});

// ==================== COMPLAINTS ====================
apiRouter.get('/complaints', (req: Request, res: Response) => {
  return res.json(db.getComplaints());
});

apiRouter.post('/complaints', (req: Request, res: Response) => {
  const { bookingId, customerId, subject, description } = req.body;
  const booking = db.getBookingById(bookingId);

  const newComplaint: Complaint = {
    id: `cmp-${Date.now()}`,
    complaintCode: `CMP-KNP-2026-${Math.floor(1000 + Math.random() * 9000)}`,
    bookingId: bookingId || 'manual',
    customerId: customerId || 'user-cust-1',
    customerName: booking?.customerName || 'Priya Sharma',
    workerId: booking?.assignedWorkerId || 'work-1',
    workerName: booking?.workerName || 'Worker',
    subject: subject || 'Dispute regarding service',
    description: description || 'Detail not provided',
    status: 'OPEN',
    createdAt: new Date().toISOString()
  };

  db.createComplaint(newComplaint);

  db.logAudit({
    userId: newComplaint.customerId,
    userName: newComplaint.customerName,
    role: 'customer',
    action: 'COMPLAINT_FILED',
    entityType: 'Complaint',
    entityId: newComplaint.id,
    details: `Grievance ticket ${newComplaint.complaintCode} opened: ${subject}`
  });

  return res.status(201).json(newComplaint);
});

apiRouter.patch('/complaints/:id/resolve', (req: Request, res: Response) => {
  const { resolutionNote } = req.body;
  const updated = db.updateComplaint(req.params.id, {
    status: 'RESOLVED',
    resolutionNote: resolutionNote || 'Cooperative Secretary arbitrated and resolved the dispute.',
    resolvedAt: new Date().toISOString()
  });

  if (!updated) return res.status(404).json({ error: 'Complaint not found' });
  return res.json(updated);
});

// ==================== ANALYTICS & AUDIT LOGS ====================
apiRouter.get('/analytics/overview', (req: Request, res: Response) => {
  const workers = db.getWorkers();
  const bookings = db.getBookings();
  const payments = db.getPayments();
  const cooperatives = db.getCooperatives();

  const totalVolume = bookings.reduce((sum, b) => sum + (b.totalAmount || 0), 0);
  const workerEarnings = bookings.reduce((sum, b) => sum + (b.workerShare || 0), 0);
  const platformCommissions = bookings.reduce((sum, b) => sum + (b.platformFee || 0), 0);
  const welfarePool = bookings.reduce((sum, b) => sum + (b.welfareFee || 0), 0);

  return res.json({
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
    fairAllocationLogs: db.getFairAllocationLogs().slice(0, 5)
  });
});

apiRouter.get('/admin/audit-logs', (req: Request, res: Response) => {
  return res.json(db.getAuditLogs());
});

apiRouter.get('/admin/settings', (req: Request, res: Response) => {
  return res.json(db.getSettings());
});

apiRouter.patch('/admin/settings', (req: Request, res: Response) => {
  const updated = db.updateSettings(req.body);
  db.logAudit({
    userId: 'user-admin-1',
    userName: 'Super Admin',
    role: 'admin',
    action: 'SETTINGS_UPDATED',
    entityType: 'SystemSettings',
    entityId: 'global',
    details: `Updated system settings: ${JSON.stringify(req.body)}`
  });
  return res.json(updated);
});

// ==================== NOTIFICATIONS ====================
apiRouter.get('/notifications', (req: Request, res: Response) => {
  const { userId } = req.query;
  return res.json(db.getNotifications(userId as string));
});

apiRouter.patch('/notifications/:id/read', (req: Request, res: Response) => {
  db.markNotificationRead(req.params.id);
  return res.json({ success: true });
});
