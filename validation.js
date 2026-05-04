// Simple validation helpers for email/password/phone.

const VALIDATION_RULES = {
  email: {
    pattern: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
    maxLength: 254,
  },
  password: {
    minLength: 8,
    hasUppercase: /[A-Z]/,
    hasLowercase: /[a-z]/,
    hasNumber: /\d/,
    hasSpecialChar: /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/,
  },
  phone: {
    pattern: /^\+[1-9]\d{6,14}$/,
  },
};

const validateEmail = (email) => {
  const errors = [];

  if (email === null || email === undefined) {
    return { valid: false, errors: ['Email is required and cannot be null.'] };
  }

  if (typeof email !== 'string') {
    return { valid: false, errors: ['Email must be a string.'] };
  }

  const trimmed = email.trim();

  if (trimmed.length === 0) {
    errors.push('Email cannot be empty.');
    return { valid: false, errors };
  }

  if (trimmed.length > VALIDATION_RULES.email.maxLength) {
    errors.push(`Email must not exceed ${VALIDATION_RULES.email.maxLength} characters.`);
  }

  if (!VALIDATION_RULES.email.pattern.test(trimmed)) {
    errors.push('Email format is invalid. Expected format: user@example.com.');
  }

  return { valid: errors.length === 0, errors };
};

const validatePassword = (password) => {
  const errors = [];

  if (password === null || password === undefined) {
    return { valid: false, errors: ['Password is required and cannot be null.'] };
  }

  if (typeof password !== 'string') {
    return { valid: false, errors: ['Password must be a string.'] };
  }

  if (password.length === 0) {
    errors.push('Password cannot be empty.');
    return { valid: false, errors };
  }

  const { minLength, hasUppercase, hasLowercase, hasNumber, hasSpecialChar } =
    VALIDATION_RULES.password;

  if (password.length < minLength) {
    errors.push(`Password must be at least ${minLength} characters long.`);
  }
  if (!hasUppercase.test(password)) {
    errors.push('Password must contain at least one uppercase letter.');
  }
  if (!hasLowercase.test(password)) {
    errors.push('Password must contain at least one lowercase letter.');
  }
  if (!hasNumber.test(password)) {
    errors.push('Password must contain at least one number.');
  }
  if (!hasSpecialChar.test(password)) {
    errors.push('Password must contain at least one special character (!@#$%^&* etc.).');
  }

  return { valid: errors.length === 0, errors };
};

const validatePhone = (phone) => {
  const errors = [];

  if (phone === null || phone === undefined) {
    return { valid: false, errors: ['Phone number is required and cannot be null.'] };
  }

  if (typeof phone !== 'string') {
    return { valid: false, errors: ['Phone number must be a string.'] };
  }

  const trimmed = phone.trim();

  if (trimmed.length === 0) {
    errors.push('Phone number cannot be empty.');
    return { valid: false, errors };
  }

  if (!trimmed.startsWith('+')) {
    errors.push('Phone number must start with "+" for international format.');
  }

  if (!VALIDATION_RULES.phone.pattern.test(trimmed)) {
    errors.push('Phone number format is invalid. Expected international format: +1234567890 (7-15 digits after +).');
  }

  return { valid: errors.length === 0, errors };
};

const validate = (data) => {
  const results = {};

  if (data.email !== undefined) {
    results.email = validateEmail(data.email);
  }
  if (data.password !== undefined) {
    results.password = validatePassword(data.password);
  }
  if (data.phone !== undefined) {
    results.phone = validatePhone(data.phone);
  }

  const allValid = Object.values(results).every((r) => r.valid);
  const allErrors = Object.entries(results).flatMap(([field, r]) =>
    r.errors.map((msg) => ({ field, message: msg }))
  );

  return { valid: allValid, results, errors: allErrors };
};

module.exports = {
  validateEmail,
  validatePassword,
  validatePhone,
  validate,
  VALIDATION_RULES,
};
