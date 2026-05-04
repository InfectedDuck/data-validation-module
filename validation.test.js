const { validateEmail, validatePassword, validatePhone, validate } = require('./validation');

// ---------------------------------------------------------------------------
// validateEmail
// ---------------------------------------------------------------------------

describe('validateEmail', () => {
  test('1. Valid standard email', () => {
    const result = validateEmail('user@example.com');
    expect(result).toEqual({ valid: true, errors: [] });
  });

  test('2. Valid email with subdomains and plus alias', () => {
    const result = validateEmail('john.doe+tag@mail.company.co.uk');
    expect(result).toEqual({ valid: true, errors: [] });
  });

  test('3. Invalid email — missing @ symbol', () => {
    const result = validateEmail('userexample.com');
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Email format is invalid. Expected format: user@example.com.');
  });

  test('4. Invalid email — missing domain', () => {
    const result = validateEmail('user@');
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  test('5. Edge case — empty string', () => {
    const result = validateEmail('');
    expect(result).toEqual({ valid: false, errors: ['Email cannot be empty.'] });
  });

  test('6. Edge case — null input', () => {
    const result = validateEmail(null);
    expect(result).toEqual({ valid: false, errors: ['Email is required and cannot be null.'] });
  });

  test('7. Edge case — undefined input', () => {
    const result = validateEmail(undefined);
    expect(result).toEqual({ valid: false, errors: ['Email is required and cannot be null.'] });
  });

  test('8. Edge case — non-string input (number)', () => {
    const result = validateEmail(12345);
    expect(result).toEqual({ valid: false, errors: ['Email must be a string.'] });
  });
});

// ---------------------------------------------------------------------------
// validatePassword
// ---------------------------------------------------------------------------

describe('validatePassword', () => {
  test('9. Valid strong password', () => {
    const result = validatePassword('Str0ng!Pass');
    expect(result).toEqual({ valid: true, errors: [] });
  });

  test('10. Invalid password — too short', () => {
    const result = validatePassword('Ab1!');
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Password must be at least 8 characters long.');
  });

  test('11. Invalid password — no number', () => {
    const result = validatePassword('StrongPass!');
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Password must contain at least one number.');
  });

  test('12. Invalid password — no special character', () => {
    const result = validatePassword('Str0ngPass');
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Password must contain at least one special character (!@#$%^&* etc.).');
  });

  test('13. Invalid password — no uppercase letter', () => {
    const result = validatePassword('str0ng!pass');
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Password must contain at least one uppercase letter.');
  });

  test('14. Invalid password — no lowercase letter', () => {
    const result = validatePassword('STR0NG!PASS');
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Password must contain at least one lowercase letter.');
  });

  test('15. Edge case — empty string', () => {
    const result = validatePassword('');
    expect(result).toEqual({ valid: false, errors: ['Password cannot be empty.'] });
  });

  test('16. Edge case — null input', () => {
    const result = validatePassword(null);
    expect(result).toEqual({ valid: false, errors: ['Password is required and cannot be null.'] });
  });

  test('17. Multiple failures reported at once', () => {
    const result = validatePassword('short');
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThanOrEqual(3);
  });
});

// ---------------------------------------------------------------------------
// validatePhone
// ---------------------------------------------------------------------------

describe('validatePhone', () => {
  test('18. Valid international phone number', () => {
    const result = validatePhone('+14155552671');
    expect(result).toEqual({ valid: true, errors: [] });
  });

  test('19. Valid phone — minimum length (7 digits)', () => {
    const result = validatePhone('+1234567');
    expect(result).toEqual({ valid: true, errors: [] });
  });

  test('20. Invalid phone — missing + prefix', () => {
    const result = validatePhone('14155552671');
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Phone number must start with "+" for international format.');
  });

  test('21. Invalid phone — contains letters', () => {
    const result = validatePhone('+1415abc2671');
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  test('22. Invalid phone — too short', () => {
    const result = validatePhone('+123');
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  test('23. Edge case — empty string', () => {
    const result = validatePhone('');
    expect(result).toEqual({ valid: false, errors: ['Phone number cannot be empty.'] });
  });

  test('24. Edge case — null input', () => {
    const result = validatePhone(null);
    expect(result).toEqual({ valid: false, errors: ['Phone number is required and cannot be null.'] });
  });

  test('25. Edge case — special characters only', () => {
    const result = validatePhone('!@#$%^');
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// validate (combined)
// ---------------------------------------------------------------------------

describe('validate (combined validator)', () => {
  test('26. All fields valid', () => {
    const result = validate({
      email: 'user@example.com',
      password: 'Str0ng!Pass',
      phone: '+14155552671',
    });
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  test('27. Multiple fields invalid — aggregates errors', () => {
    const result = validate({
      email: 'bad-email',
      password: 'weak',
      phone: '123',
    });
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThanOrEqual(3);
    expect(result.errors.every((e) => e.field && e.message)).toBe(true);
  });
});
