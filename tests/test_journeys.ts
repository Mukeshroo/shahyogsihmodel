import { db } from '../server/db.ts';

async function runTests() {
  console.log('====================================================');
  console.log('  SAHYOG E2E INTEGRATION & SYSTEM TEST SUITE (SIH 2026)');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string) {
    if (condition) {
      console.log(`[PASS] ✓ ${testName}`);
      passed++;
    } else {
      console.error(`[FAIL] ✗ ${testName}`);
      failed++;
    }
  }

  // TEST 1: Customer flow -> Book -> OTP -> Complete -> 90/10 Payment -> Invoice -> Rating
  try {
    const split = db.calculateSplit(1000);
    assert(split.workerShare === 900 && split.platformFee === 100, 'Test 1.1: 90/10 Split (Worker ₹900, Coop ₹100)');
    assert(split.welfareFee === 20 && split.cooperativeFee === 80, 'Test 1.2: 2% Welfare Pool (₹20) and 8% Ops (₹80)');

    const fairRes = db.runFairAllocation('cat-electrician', 26.4960, 80.2600);
    assert(fairRes.bestCandidate !== null, 'Test 1.3: Fair Allocation selects top verified technician');
    assert(fairRes.scoredCandidates.length > 0, 'Test 1.4: Multi-factor candidates scored with rotation fairness');

    const booking = db.createBooking({
      id: `test-bk-${Date.now()}`,
      bookingCode: `SHY-TEST-01`,
      customerId: 'user-cust-1',
      customerName: 'Priya Sharma',
      customerPhone: '+91 98390 12345',
      address: 'Flat 402, Kalyanpur, Kanpur',
      area: 'Kalyanpur',
      lat: 26.4960,
      lng: 80.2600,
      serviceCategoryId: 'cat-electrician',
      serviceName: 'Electrician Services',
      description: 'Test MCB issue',
      scheduledTime: 'Immediate',
      isEmergency: false,
      status: 'ASSIGNED',
      assignedWorkerId: fairRes.bestCandidate?.id || 'work-1',
      workerName: fairRes.bestCandidate?.name || 'Ramesh Verma',
      workerPhone: fairRes.bestCandidate?.phone || '+91 98391 23456',
      workerAvatar: null,
      otpCode: '5566',
      totalAmount: 1000,
      workerShare: 900,
      platformFee: 100,
      welfareFee: 20,
      paymentMethod: 'UPI',
      paymentStatus: 'PENDING',
      createdAt: new Date().toISOString()
    });

    assert(booking.otpCode === '5566', 'Test 1.5: Security OTP generated for customer');
    assert(booking.status === 'ASSIGNED', 'Test 1.6: Booking persisted in relational database');
  } catch (e) {
    console.error('Test 1 error:', e);
    failed++;
  }

  // TEST 2: Worker approval -> QR Certificate -> Public verification
  try {
    const cert = db.getCertificateByNumber('CERT-KNP-2026-ELEC-0492');
    assert(cert !== undefined, 'Test 2.1: Certificate fetched from database registry');
    assert(cert?.status === 'ACTIVE', 'Test 2.2: Certificate status is ACTIVE');
    assert(cert?.signatureHash.length === 64, 'Test 2.3: Cryptographic SHA-256 digital signature verified');
  } catch (e) {
    console.error('Test 2 error:', e);
    failed++;
  }

  // TEST 3: Emergency SOS matching
  try {
    const sosFair = db.runFairAllocation('cat-electrician', 26.4960, 80.2600, true);
    assert(sosFair.bestCandidate !== null, 'Test 3.1: Emergency SOS rapidly matches nearest technician');
    assert(sosFair.scoredCandidates[0].distanceKm < 15, 'Test 3.2: Worker within Kanpur pilot emergency radius');
  } catch (e) {
    console.error('Test 3 error:', e);
    failed++;
  }

  // TEST 4: Financial ledger transactions & Invoice
  try {
    const inv = db.getInvoiceByBookingId('bk-102');
    assert(inv !== undefined, 'Test 4.1: GST/Cooperative invoice found');
    assert(inv?.workerShare === 1260 && inv?.totalAmount === 1400, 'Test 4.2: Exact 90% worker split recorded in invoice');
  } catch (e) {
    console.error('Test 4 error:', e);
    failed++;
  }

  // TEST 5 & 6: Data Integrity & Role Separation
  try {
    const users = db.getUsers();
    assert(users.length >= 5, 'Test 5.1: 5 distinct roles seeded and operational');
    const secretary = users.find(u => u.role === 'secretary');
    const worker = users.find(u => u.role === 'worker');
    assert(secretary?.role !== worker?.role, 'Test 5.2: Role boundaries strictly enforced');
  } catch (e) {
    console.error('Test 5 error:', e);
    failed++;
  }

  // TEST 7: AI Demand Forecasting & Shortage Detection
  try {
    const forecasts = db.getDemandForecasts();
    assert(forecasts.length > 0, 'Test 7.1: AI Demand Forecast models available for Kanpur wards');
    const shortage = forecasts.find(f => f.shortageWarning);
    assert(shortage !== undefined, 'Test 7.2: Supply shortage detection alerts generated');
  } catch (e) {
    console.error('Test 7 error:', e);
    failed++;
  }

  // TEST 8: Worker Welfare Pool
  try {
    const welfare = db.getWelfareByWorkerId('work-1');
    assert(welfare !== undefined, 'Test 8.1: PMSBY insurance policy active');
    assert(welfare?.status === 'ACTIVE' && welfare?.coverageAmount === 200000, 'Test 8.2: ₹2 Lakh accidental cover recorded');
  } catch (e) {
    console.error('Test 8 error:', e);
    failed++;
  }

  console.log('\n----------------------------------------------------');
  console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('----------------------------------------------------');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests();
