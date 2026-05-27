import { describe, it, expect, vi, beforeEach } from 'vitest';

// ─── computeCustomerRefund ────────────────────────────────────────────────────
// Import only the pure function — no DB or Duffel involved

import { computeCustomerRefund } from '../src/modules/trips/trips.service.js';

describe('computeCustomerRefund', () => {
  it('full refund with no penalty — customer gets back what they paid', () => {
    // publicPrice=100, totalPaid=90, airlineRefund=100 → penalty=0, customerRefund=90
    expect(computeCustomerRefund(90, 100, 100)).toBe(90);
  });

  it('partial refund absorbs penalty, Travanora margin preserved', () => {
    // publicPrice=100, totalPaid=90, airlineRefund=80 → penalty=20, customerRefund=70
    expect(computeCustomerRefund(90, 100, 80)).toBe(70);
  });

  it('penalty equals full public price → zero refund', () => {
    // penalty=100 > totalPaid=90 → customerRefund=0, never negative
    expect(computeCustomerRefund(90, 100, 0)).toBe(0);
  });

  it('penalty exceeds totalPaid → clamps to 0', () => {
    expect(computeCustomerRefund(50, 100, 0)).toBe(0);
  });

  it('full penalty is absorbed when airline keeps everything', () => {
    // penalty=100, totalPaid=100 → customerRefund=0
    expect(computeCustomerRefund(100, 100, 0)).toBe(0);
  });

  it('rounds to 3 decimal places (KWD precision)', () => {
    // (7.333... - 0) rounded to 3dp
    const result = computeCustomerRefund(22 / 3, 10, 10);
    expect(result).toBeCloseTo(22 / 3, 3);
  });

  it('zero-fee cancellation where airline refunds full public price', () => {
    // Member paid discounted price; no penalty
    expect(computeCustomerRefund(45, 50, 50)).toBe(45);
  });
});

// ─── refundCustomer — mocked Stripe + Mongoose ────────────────────────────────

vi.mock('../src/modules/refunds/refund-ledger.model.js', () => ({
  RefundLedger: {
    findByIdAndUpdate: vi.fn().mockResolvedValue(null),
  },
}));

vi.mock('../src/modules/audit/audit-log.model.js', () => ({
  AuditLog: {
    create: vi.fn().mockResolvedValue(null),
  },
}));

vi.mock('../src/lib/logger.js', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock env before importing refundCustomer
vi.mock('../src/config/env.js', () => ({
  env: {
    STRIPE_SECRET_KEY: 'sk_test_mock',
    NODE_ENV: 'test',
  },
}));

describe('refundCustomer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns completed immediately for zero-amount refund (non-refundable fare)', async () => {
    const { refundCustomer } = await import('../src/modules/refunds/refund-customer.service.js');
    const { RefundLedger } = await import('../src/modules/refunds/refund-ledger.model.js');

    const booking = {
      _id: 'booking123',
      userId: 'user123',
      totalAmount: 90,
      stripePaymentIntentId: 'pi_test_123',
      passengers: [{ firstName: 'Ahmad', email: 'ahmad@test.com' }],
    } as Parameters<typeof refundCustomer>[0]['booking'];

    const result = await refundCustomer({
      booking,
      amount: 0,
      currency: 'KWD',
      reason: 'cancellation',
      ledgerId: 'ledger123',
    });

    expect(result.status).toBe('completed');
    expect(RefundLedger.findByIdAndUpdate).toHaveBeenCalledWith('ledger123', expect.objectContaining({
      customerRefundStatus: 'completed',
    }));
  });

  it('returns manual_required when no stripePaymentIntentId', async () => {
    const { refundCustomer } = await import('../src/modules/refunds/refund-customer.service.js');

    const booking = {
      _id: 'booking456',
      userId: 'user456',
      totalAmount: 90,
      stripePaymentIntentId: undefined,
      passengers: [],
    } as unknown as Parameters<typeof refundCustomer>[0]['booking'];

    const result = await refundCustomer({
      booking,
      amount: 50,
      currency: 'KWD',
      reason: 'cancellation',
      ledgerId: 'ledger456',
    });

    expect(result.status).toBe('manual_required');
  });

  it('returns manual_required when refund amount exceeds total paid', async () => {
    const { refundCustomer } = await import('../src/modules/refunds/refund-customer.service.js');

    const booking = {
      _id: 'booking789',
      userId: 'user789',
      totalAmount: 50,
      stripePaymentIntentId: 'pi_test_999',
      passengers: [],
    } as unknown as Parameters<typeof refundCustomer>[0]['booking'];

    const result = await refundCustomer({
      booking,
      amount: 100,
      currency: 'KWD',
      reason: 'cancellation',
      ledgerId: 'ledger789',
    });

    expect(result.status).toBe('manual_required');
  });
});
