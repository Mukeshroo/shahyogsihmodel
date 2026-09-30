import { clientDb } from './clientDb.ts';

function createJsonResponse(data: any, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'X-Sahyog-Source': 'Browser-ClientDb'
    }
  });
}

export function setupApiInterceptor() {
  if (typeof window === 'undefined') return;

  // If running with the full-stack server (localhost, port 3000, or AI Studio Cloud Run dev/preview container),
  // native fetch connects directly to the running Express backend. No interception needed!
  const isLocalOrContainer = 
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1' ||
    window.location.hostname.includes('run.app') ||
    window.location.port === '3000';

  if (isLocalOrContainer) {
    return;
  }

  try {
    const originalFetch = window.fetch ? window.fetch.bind(window) : null;
    if (!originalFetch) return;

    const customFetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
      let urlStr = '';
      if (typeof input === 'string') {
        urlStr = input;
      } else if (input instanceof URL) {
        urlStr = input.toString();
      } else if (input && typeof (input as Request).url === 'string') {
        urlStr = (input as Request).url;
      }

      // Only intercept /api/v1 calls
      if (!urlStr.includes('/api/v1')) {
        return originalFetch(input, init);
      }

      // Extract path and query
      let path = urlStr;
      try {
        const parsed = new URL(urlStr, window.location.origin);
        path = parsed.pathname;
      } catch (e) {
        // relative path
      }

      const method = (init?.method || 'GET').toUpperCase();

      // Check if backend is reachable (e.g. running fullstack Express)
      // Only attempt real network fetch if we're not known to be in static mode
      let backendResponse: Response | null = null;
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 1000);
        backendResponse = await originalFetch(input, {
          ...init,
          signal: controller.signal
        });
        clearTimeout(timeoutId);

        const contentType = backendResponse.headers.get('content-type') || '';
        if (backendResponse.status !== 404 && contentType.includes('application/json')) {
          return backendResponse;
        }
      } catch (networkErr) {
        // Network failure, offline, or aborted — fall through to clientDb
      }

      // --- CLIENT-SIDE DB HANDLER ---
      try {
      // Parse body if present
      let bodyData: any = {};
      if (init?.body && typeof init.body === 'string') {
        try {
          bodyData = JSON.parse(init.body);
        } catch (e) {
          bodyData = {};
        }
      }

      // Parse URL params
      const parsedUrl = new URL(urlStr, window.location.origin);
      const searchParams = parsedUrl.searchParams;

      // 1. Auth
      if (path === '/api/v1/auth/login' && method === 'POST') {
        const res = clientDb.login(bodyData.email || 'priya.sharma@example.com');
        return createJsonResponse(res);
      }
      if (path === '/api/v1/auth/register' && method === 'POST') {
        const res = clientDb.register(bodyData);
        return createJsonResponse(res, 201);
      }

      // 2. Services
      if (path === '/api/v1/services' && method === 'GET') {
        return createJsonResponse(clientDb.getCategories());
      }

      // 3. Workers
      if (path === '/api/v1/workers' && method === 'GET') {
        const status = searchParams.get('status') || undefined;
        const categoryId = searchParams.get('categoryId') || undefined;
        const cooperativeId = searchParams.get('cooperativeId') || undefined;
        return createJsonResponse(clientDb.getWorkers({ status, categoryId, cooperativeId }));
      }
      if (path.startsWith('/api/v1/workers/') && path.endsWith('/approve') && method === 'POST') {
        const id = path.replace('/api/v1/workers/', '').replace('/approve', '');
        const updated = clientDb.approveWorker(id, bodyData.approvedBy);
        return createJsonResponse(updated);
      }
      if (path.startsWith('/api/v1/workers/') && path.endsWith('/reject') && method === 'POST') {
        const id = path.replace('/api/v1/workers/', '').replace('/reject', '');
        const updated = clientDb.rejectWorker(id);
        return createJsonResponse(updated);
      }
      if (path.startsWith('/api/v1/workers/') && method === 'PATCH') {
        const id = path.replace('/api/v1/workers/', '');
        const updated = clientDb.updateWorker(id, bodyData);
        return createJsonResponse(updated);
      }
      if (path.startsWith('/api/v1/workers/') && method === 'GET') {
        const id = path.replace('/api/v1/workers/', '');
        const w = clientDb.getWorkerById(id);
        return w ? createJsonResponse(w) : createJsonResponse({ error: 'Worker not found' }, 404);
      }

      // 4. Cooperatives
      if (path === '/api/v1/cooperatives' && method === 'GET') {
        return createJsonResponse(clientDb.getCooperatives());
      }

      // 5. Bookings
      if (path === '/api/v1/bookings' && method === 'GET') {
        const customerId = searchParams.get('customerId') || undefined;
        const workerId = searchParams.get('workerId') || undefined;
        const cooperativeId = searchParams.get('cooperativeId') || undefined;
        const status = searchParams.get('status') || undefined;
        return createJsonResponse(clientDb.getBookings({ customerId, workerId, cooperativeId, status }));
      }
      if (path === '/api/v1/bookings/emergency' && method === 'POST') {
        const booking = clientDb.createEmergencyBooking(bodyData);
        return createJsonResponse(booking, 201);
      }
      if (path === '/api/v1/bookings' && method === 'POST') {
        const booking = clientDb.createBooking(bodyData);
        return createJsonResponse(booking, 201);
      }
      if (path.startsWith('/api/v1/bookings/') && path.endsWith('/accept') && method === 'POST') {
        const id = path.replace('/api/v1/bookings/', '').replace('/accept', '');
        const booking = clientDb.updateBookingStatus(id, 'ON_THE_WAY');
        return createJsonResponse(booking);
      }
      if (path.startsWith('/api/v1/bookings/') && path.endsWith('/reject') && method === 'POST') {
        const id = path.replace('/api/v1/bookings/', '').replace('/reject', '');
        const booking = clientDb.updateBookingStatus(id, 'PENDING', { assignedWorkerId: null, workerName: null });
        return createJsonResponse(booking);
      }
      if (path.startsWith('/api/v1/bookings/') && path.endsWith('/start') && method === 'POST') {
        const id = path.replace('/api/v1/bookings/', '').replace('/start', '');
        const target = clientDb.getBookingById(id);
        if (target && target.otpCode && bodyData.otp && target.otpCode !== bodyData.otp) {
          return createJsonResponse({ error: 'Invalid start OTP. Please verify with customer.' }, 400);
        }
        const booking = clientDb.updateBookingStatus(id, 'IN_PROGRESS');
        return createJsonResponse(booking);
      }
      if (path.startsWith('/api/v1/bookings/') && path.endsWith('/complete') && method === 'POST') {
        const id = path.replace('/api/v1/bookings/', '').replace('/complete', '');
        const booking = clientDb.updateBookingStatus(id, 'COMPLETED');
        return createJsonResponse(booking);
      }
      if (path.startsWith('/api/v1/bookings/') && path.endsWith('/cancel') && method === 'POST') {
        const id = path.replace('/api/v1/bookings/', '').replace('/cancel', '');
        const booking = clientDb.updateBookingStatus(id, 'CANCELLED');
        return createJsonResponse(booking);
      }
      if (path.startsWith('/api/v1/bookings/') && path.endsWith('/rate') && method === 'POST') {
        const id = path.replace('/api/v1/bookings/', '').replace('/rate', '');
        const booking = clientDb.rateBooking(id, Number(bodyData.rating) || 5, bodyData.comment);
        return createJsonResponse(booking);
      }
      if (path.startsWith('/api/v1/bookings/') && method === 'GET') {
        const id = path.replace('/api/v1/bookings/', '');
        const b = clientDb.getBookingById(id);
        return b ? createJsonResponse(b) : createJsonResponse({ error: 'Booking not found' }, 404);
      }

      // 6. Payments
      if (path === '/api/v1/payments' && method === 'GET') {
        return createJsonResponse(clientDb.getPayments());
      }
      if (path === '/api/v1/payments/razorpay/create-order' && method === 'POST') {
        return createJsonResponse({
          orderId: `order_sim_${Date.now()}`,
          amount: (bodyData.amount || 350) * 100,
          currency: 'INR',
          key: 'rzp_test_SAHYOG_KANPUR_2026'
        });
      }
      if (path === '/api/v1/payments/verify' && method === 'POST') {
        const res = clientDb.verifyPayment(bodyData.bookingId, bodyData.paymentMethod || 'UPI');
        return createJsonResponse(res);
      }
      if (path === '/api/v1/payments/cash-reconcile' && method === 'POST') {
        const res = clientDb.verifyPayment(bodyData.bookingId, 'CASH');
        return createJsonResponse(res);
      }

      // 7. Invoices
      if (path === '/api/v1/invoices' && method === 'GET') {
        return createJsonResponse(clientDb.getInvoices());
      }
      if (path.startsWith('/api/v1/invoices/') && method === 'GET') {
        const bookingId = path.replace('/api/v1/invoices/', '');
        const inv = clientDb.getInvoiceByBookingId(bookingId);
        return inv ? createJsonResponse(inv) : createJsonResponse({ error: 'Invoice not found' }, 404);
      }

      // 8. Certificates
      if (path.startsWith('/api/v1/certificates/verify/') && method === 'GET') {
        const id = path.replace('/api/v1/certificates/verify/', '');
        const cert = clientDb.getCertificate(id);
        if (cert) {
          const worker = clientDb.getWorkerById(cert.workerId);
          return createJsonResponse({
            valid: true,
            certificate: cert,
            worker,
            status: cert.status,
            issuedBy: cert.cooperativeName
          });
        }
        return createJsonResponse({ valid: false, error: 'Certificate not found' }, 404);
      }

      // 9. Welfare & Insurance
      if (path === '/api/v1/welfare' && method === 'GET') {
        return createJsonResponse(clientDb.getWelfare());
      }
      if (path === '/api/v1/welfare/claim' && method === 'POST') {
        const claim = clientDb.submitWelfareClaim(bodyData);
        return createJsonResponse(claim, 201);
      }
      if (path.startsWith('/api/v1/welfare/') && method === 'GET') {
        const workerId = path.replace('/api/v1/welfare/', '');
        const w = clientDb.getWelfare(workerId);
        return w ? createJsonResponse(w) : createJsonResponse({ error: 'Welfare record not found' }, 404);
      }

      // 10. Forecasts
      if (path === '/api/v1/forecasts' && method === 'GET') {
        return createJsonResponse(clientDb.getForecasts());
      }

      // 11. Complaints
      if (path === '/api/v1/complaints' && method === 'GET') {
        return createJsonResponse(clientDb.getComplaints());
      }
      if (path === '/api/v1/complaints' && method === 'POST') {
        const c = clientDb.createComplaint(bodyData);
        return createJsonResponse(c, 201);
      }
      if (path.startsWith('/api/v1/complaints/') && path.endsWith('/resolve') && method === 'PATCH') {
        const id = path.replace('/api/v1/complaints/', '').replace('/resolve', '');
        const c = clientDb.resolveComplaint(id, bodyData.resolutionNotes || 'Resolved');
        return createJsonResponse(c);
      }

      // 12. Settings & Audit
      if (path === '/api/v1/settings' && method === 'GET') {
        return createJsonResponse(clientDb.getSettings());
      }
      if (path === '/api/v1/settings' && method === 'PATCH') {
        const updated = clientDb.updateSettings(bodyData);
        return createJsonResponse(updated);
      }
      if (path === '/api/v1/audit-logs' && method === 'GET') {
        return createJsonResponse(clientDb.getAuditLogs());
      }

      // 13. Notifications
      if (path === '/api/v1/notifications' && method === 'GET') {
        return createJsonResponse(clientDb.getNotifications());
      }
      if (path.startsWith('/api/v1/notifications/') && path.endsWith('/read') && method === 'PATCH') {
        const id = path.replace('/api/v1/notifications/', '').replace('/read', '');
        const n = clientDb.markNotificationAsRead(id);
        return createJsonResponse(n);
      }
    } catch (e: any) {
      console.error('Browser ClientDb error:', e);
      return createJsonResponse({ error: e.message || 'Internal error' }, 500);
    }

    // Default fallback
    return createJsonResponse({ message: 'Success' });
  };

  try {
    Object.defineProperty(window, 'fetch', {
      value: customFetch,
      writable: true,
      configurable: true,
      enumerable: true
    });
  } catch (defErr) {
    try {
      (window as any).fetch = customFetch;
    } catch (assignErr) {
      console.warn('[SAHYOG] Could not override window.fetch:', assignErr);
    }
  }
} catch (outerErr) {
  console.warn('[SAHYOG] setupApiInterceptor skipped:', outerErr);
}
}
