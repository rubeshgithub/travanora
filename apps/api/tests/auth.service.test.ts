import { describe, it, expect } from 'vitest';
import { RegisterSchema, LoginSchema } from '@travanora/shared';

describe('RegisterSchema', () => {
  const base = {
    firstName: 'Ahmad',
    lastName: 'Al-Salem',
    email: 'ahmad@example.com',
    phone: { countryCode: '+965', number: '99887766' },
    city: 'Kuwait City',
    homeAirport: 'KWI',
    password: 'SecurePass1',
    confirmPassword: 'SecurePass1',
    termsAgreed: true as const,
    marketingOptIn: true,
  };

  it('accepts a valid registration', () => {
    expect(() => RegisterSchema.parse(base)).not.toThrow();
  });

  it('rejects mismatched passwords', () => {
    expect(() => RegisterSchema.parse({ ...base, confirmPassword: 'wrong' })).toThrow();
  });

  it('rejects weak passwords (no uppercase)', () => {
    expect(() =>
      RegisterSchema.parse({ ...base, password: 'weakpassword1', confirmPassword: 'weakpassword1' }),
    ).toThrow();
  });

  it('rejects passwords shorter than 8 chars', () => {
    expect(() => RegisterSchema.parse({ ...base, password: 'Ab1', confirmPassword: 'Ab1' })).toThrow();
  });

  it('upcases the IATA airport code', () => {
    const result = RegisterSchema.parse({ ...base, homeAirport: 'kwi' });
    expect(result.homeAirport).toBe('KWI');
  });

  it('lowercases the email', () => {
    const result = RegisterSchema.parse({ ...base, email: 'AHMAD@EXAMPLE.COM' });
    expect(result.email).toBe('ahmad@example.com');
  });
});

describe('LoginSchema', () => {
  it('accepts valid login', () => {
    expect(() =>
      LoginSchema.parse({ email: 'a@b.com', password: 'any', rememberMe: false }),
    ).not.toThrow();
  });

  it('defaults rememberMe to false', () => {
    const result = LoginSchema.parse({ email: 'a@b.com', password: 'any' });
    expect(result.rememberMe).toBe(false);
  });
});
