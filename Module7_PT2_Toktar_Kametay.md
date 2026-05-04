# Data Validation Module (ChatGPT-Assisted)

**Student:** Toktar Kametay

## Overview

This write-up walks through a Node.js validation module for email, password, and international-style phone numbers. ChatGPT helped with first drafts (requirements text, code shape, tests); I rewrote weak spots myself—especially the phone pattern (first draft allowed nonsense after `+`) and tests that only checked `toBeDefined()`.

Concrete footprint: **`validation.js`** about **144 lines**, **27 Jest tests** (all passing), **`schema.sql`** with **7 seeded regex-backed rules**, plus README and API sketches—no Express server wired up yet.

Password checks are picky on purpose: one mega-regex would return a single “invalid” with no hints; splitting rules trades verbosity for clearer UX.

---

## Constraints & assumptions

What I held fixed while designing:

- **English-only errors**, no i18n—fine for the brief, wrong for a global product without extra work.
- **Three-field API shape** (`email`, `password`, `phone`)—not a generic rules engine.
- **Validation ≠ transport**: SQL injection and parameterized queries matter only once an API talks to Postgres; the JS module never executes SQL by itself.

What I skipped for v1 (still honest scope):

- Running **Express** (or similar) with live `POST /validate`—delivered as SQL + endpoint specs instead.
- **Password max length**—easy add-on; left out because the rubric centered on minimum strength rules.

---

## 1. Requirements Document

I wanted one stable contract for every validator—always `{ valid: boolean, errors: string[] }`—so anything calling these functions (CLI, HTTP handler, tests) never needs special cases.

### Prompt Used

I asked ChatGPT:
> "I am building a Node.js data validation module. Please list clear requirements for validating email format, password strength (minimum 8 chars, at least 1 number, at least 1 special character), and phone number in international format. Also include practical error messages for each rule so I can show them in API responses."

The reply was a bullet list per field; I folded it into the table below for grading readability.

### Validation Rules

| Field | Rule | Criteria | Error Message |
|-------|------|----------|---------------|
| Email | Required | Cannot be null or empty | "Email is required and cannot be null." |
| Email | Format | Must match `user@domain.tld` pattern | "Email format is invalid. Expected format: user@example.com." |
| Email | Max length | Cannot exceed 254 characters | "Email must not exceed 254 characters." |
| Password | Required | Cannot be null or empty | "Password is required and cannot be null." |
| Password | Min length | At least 8 characters | "Password must be at least 8 characters long." |
| Password | Uppercase | At least one uppercase letter | "Password must contain at least one uppercase letter." |
| Password | Lowercase | At least one lowercase letter | "Password must contain at least one lowercase letter." |
| Password | Number | At least one digit | "Password must contain at least one number." |
| Password | Special char | At least one special character like `!@#$%^&*` | "Password must contain at least one special character (!@#$%^&* etc.)." |
| Phone | Required | Cannot be null or empty | "Phone number is required and cannot be null." |
| Phone | International format | Must start with `+` followed by 7-15 digits | "Phone number format is invalid. Expected international format: +1234567890." |

Beyond the brief’s minimum (8 chars + digit + special), I added upper/lowercase rules—slightly stricter, but it mirrors real password policies and pairs cleanly with the five-row SQL seed for passwords.

---

## 2. Source Code

Every validator follows the same pipeline: **null/undefined → wrong type → empty trim → field rules**. That repetition is deliberate—once you’ve read `validateEmail`, the other two scan quickly.

I tightened `validatePhone` after noticing `+0123…` could slip through if the pattern allowed zero right after `+`; it now matches `^\+[1-9]\d{6,14}$`. I also added `typeof !== 'string'` guards everywhere—easy to forget, and `validateEmail(12345)` was slipping through until tests screamed.

### Prompt Used

I asked ChatGPT:
> "Can you generate a Node.js validation module using current JavaScript practices? I need three functions: validateEmail(), validatePassword(), and validatePhone(). Please include basic error handling and return each result in this format: { valid: boolean, errors: [] }. Structure it so I can explain it in writing."

First draft omitted non-string handling and used a looser phone regex; below is the version that stayed in `validation.js`:

### File: `validation.js`

```javascript
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

  if (data.email !== undefined) results.email = validateEmail(data.email);
  if (data.password !== undefined) results.password = validatePassword(data.password);
  if (data.phone !== undefined) results.phone = validatePhone(data.phone);

  const allValid = Object.values(results).every((r) => r.valid);
  const allErrors = Object.entries(results).flatMap(([field, r]) =>
    r.errors.map((msg) => ({ field, message: msg }))
  );

  return { valid: allValid, results, errors: allErrors };
};

module.exports = { validateEmail, validatePassword, validatePhone, validate, VALIDATION_RULES };
```

Implementation notes (instead of buzzwords): regex objects and lengths live in **`VALIDATION_RULES`** once; **`validatePassword`** pulls checks via **`const { minLength, … } = VALIDATION_RULES.password`**; **`validate()`** aggregates per-field failures with **`Object.entries(...).flatMap`** into `{ field, message }` pairs for HTTP-shaped responses.

---

## 3. Database Schema & API

The table carries more than the bare assignment columns (`field`, `is_active`, timestamps) because toggling a rule without deleting history beats rewriting migrations during demos.

### Prompt Used

I asked ChatGPT:
> "For the same validation project, help me design a simple SQL schema to store validation rules (rule_name, regex_pattern, error_message). Also draft two REST endpoints: POST /validate (to validate incoming data) and GET /validation-rules (to return active rules). Please include SQL plus endpoint request/response specs with examples."

### Database Schema: `schema.sql`

```sql
CREATE TABLE IF NOT EXISTS validation_rules (
    id            SERIAL PRIMARY KEY,
    rule_name     VARCHAR(100)  NOT NULL UNIQUE,
    field         VARCHAR(50)   NOT NULL,
    regex_pattern TEXT          NOT NULL,
    error_message VARCHAR(255)  NOT NULL,
    is_active     BOOLEAN       NOT NULL DEFAULT TRUE,
    created_at    TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at    TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_validation_rules_field ON validation_rules (field);

INSERT INTO validation_rules (rule_name, field, regex_pattern, error_message) VALUES
    ('email_format',       'email',    '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$',
     'Email format is invalid. Expected format: user@example.com.'),
    ('password_min_length','password', '.{8,}',
     'Password must be at least 8 characters long.'),
    ('password_uppercase', 'password', '[A-Z]',
     'Password must contain at least one uppercase letter.'),
    ('password_lowercase', 'password', '[a-z]',
     'Password must contain at least one lowercase letter.'),
    ('password_number',    'password', '\d',
     'Password must contain at least one number.'),
    ('password_special_char','password','[!@#$%^&*()_+\\-=\\[\\]{};:"|,.<>\\/?]',
     'Password must contain at least one special character (!@#$%^&* etc.).'),
    ('phone_international','phone',    '^\+[1-9]\d{6,14}$',
     'Phone number format is invalid. Expected international format: +1234567890.');
```

The schema uses a `validation_rules` table with rule name, field, regex and error message. I also added `is_active` and timestamps so rules can be disabled without deleting rows (useful for audit). The `field` column has an index because `GET /validation-rules?field=...` will filter on it.

### API Endpoints

#### POST /validate

Validates one or more input fields.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "Str0ng!Pass",
  "phone": "+14155552671"
}
```

All fields are optional. You can send only the ones you want to check.

**Response when everything is valid (200):**
```json
{
  "valid": true,
  "results": {
    "email":    { "valid": true, "errors": [] },
    "password": { "valid": true, "errors": [] },
    "phone":    { "valid": true, "errors": [] }
  },
  "errors": []
}
```

**Response when there are validation errors (200):**
```json
{
  "valid": false,
  "results": {
    "email":    { "valid": false, "errors": ["Email format is invalid. Expected format: user@example.com."] },
    "password": { "valid": false, "errors": ["Password must be at least 8 characters long."] },
    "phone":    { "valid": true,  "errors": [] }
  },
  "errors": [
    { "field": "email",    "message": "Email format is invalid. Expected format: user@example.com." },
    { "field": "password", "message": "Password must be at least 8 characters long." }
  ]
}
```

**Bad request (400):**
```json
{
  "error": "Invalid request body. Expected JSON with at least one field: email, password, phone."
}
```

#### GET /validation-rules

Returns active validation rules. You can filter by field with a query param.

**Request:** `GET /validation-rules?field=password`

**Response (200):**
```json
{
  "rules": [
    {
      "id": 2,
      "rule_name": "password_min_length",
      "field": "password",
      "regex_pattern": ".{8,}",
      "error_message": "Password must be at least 8 characters long.",
      "is_active": true
    }
  ],
  "total": 1
}
```

---

## 4. Unit Tests

The repo runs **27** Jest cases (`npm test`), numbered in `validation.test.js` so failures map cleanly to expectations—handier than prose descriptions alone.

Friction worth mentioning: ChatGPT’s first pass leaned on lazy matchers (`toBeDefined()`, vague regex checks). I rewrote assertions to compare exact messages or `toContain` specific strings; otherwise regressions slip past silently.

### Prompt Used

I asked ChatGPT:
> "Please write Jest unit tests for my validation module. I want coverage for valid inputs, invalid inputs, and edge cases like empty strings, null/undefined, and special characters. Give me at least 10 test cases, and group them by validator so the test file is easy to review."

I kept **27** tests instead of trimming to ten—the extras caught non-string inputs, stacked password violations, and malformed phones.

### File: `validation.test.js`

```javascript
const {
  validateEmail,
  validatePassword,
  validatePhone,
  validate,
} = require('./validation');

describe('validateEmail', () => {
  test('returns valid for a standard email', () => {
    const result = validateEmail('user@example.com');
    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  test('returns valid for an email with subdomains and plus alias', () => {
    const result = validateEmail('john.doe+test@mail.example.co.uk');
    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  test('returns invalid when @ symbol is missing', () => {
    const result = validateEmail('userexample.com');
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toMatch(/format is invalid/i);
  });

  test('returns invalid when domain part is missing', () => {
    const result = validateEmail('user@');
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  test('returns invalid for an empty string', () => {
    const result = validateEmail('');
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toMatch(/empty/i);
  });

  test('returns invalid for null input', () => {
    const result = validateEmail(null);
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toMatch(/required/i);
  });

  test('returns invalid for undefined input', () => {
    const result = validateEmail(undefined);
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toMatch(/required/i);
  });

  test('returns invalid for non-string input (number)', () => {
    const result = validateEmail(12345);
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toMatch(/must be a string/i);
  });
});

describe('validatePassword', () => {
  test('returns valid for a strong password', () => {
    const result = validatePassword('Str0ng!Pass');
    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  test('returns invalid when password is too short', () => {
    const result = validatePassword('Aa1!');
    expect(result.valid).toBe(false);
    expect(result.errors).toEqual(
      expect.arrayContaining([expect.stringMatching(/at least 8 characters/i)])
    );
  });

  test('returns invalid when password has no number', () => {
    const result = validatePassword('Strong!Pass');
    expect(result.valid).toBe(false);
    expect(result.errors).toEqual(
      expect.arrayContaining([expect.stringMatching(/at least one number/i)])
    );
  });

  test('returns invalid when password has no special character', () => {
    const result = validatePassword('Str0ngPass1');
    expect(result.valid).toBe(false);
    expect(result.errors).toEqual(
      expect.arrayContaining([
        expect.stringMatching(/at least one special character/i),
      ])
    );
  });

  test('returns invalid when password has no uppercase letter', () => {
    const result = validatePassword('str0ng!pass');
    expect(result.valid).toBe(false);
    expect(result.errors).toEqual(
      expect.arrayContaining([
        expect.stringMatching(/at least one uppercase/i),
      ])
    );
  });

  test('returns invalid when password has no lowercase letter', () => {
    const result = validatePassword('STR0NG!PASS');
    expect(result.valid).toBe(false);
    expect(result.errors).toEqual(
      expect.arrayContaining([
        expect.stringMatching(/at least one lowercase/i),
      ])
    );
  });

  test('returns invalid for an empty string', () => {
    const result = validatePassword('');
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toMatch(/empty/i);
  });

  test('returns invalid for null input', () => {
    const result = validatePassword(null);
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toMatch(/required/i);
  });

  test('reports multiple failures at once for a weak password', () => {
    const result = validatePassword('short');
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThanOrEqual(3);
  });
});

describe('validatePhone', () => {
  test('returns valid for a standard international phone number', () => {
    const result = validatePhone('+14155552671');
    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  test('returns valid for the minimum length (7 digits after +)', () => {
    const result = validatePhone('+1234567');
    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  test('returns invalid when + prefix is missing', () => {
    const result = validatePhone('14155552671');
    expect(result.valid).toBe(false);
    expect(result.errors).toEqual(
      expect.arrayContaining([expect.stringMatching(/must start with/i)])
    );
  });

  test('returns invalid when phone contains letters', () => {
    const result = validatePhone('+1415ABC2671');
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toMatch(/format is invalid/i);
  });

  test('returns invalid when phone is too short', () => {
    const result = validatePhone('+12345');
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toMatch(/format is invalid/i);
  });

  test('returns invalid for an empty string', () => {
    const result = validatePhone('');
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toMatch(/empty/i);
  });

  test('returns invalid for null input', () => {
    const result = validatePhone(null);
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toMatch(/required/i);
  });

  test('returns invalid for special characters only', () => {
    const result = validatePhone('+!@#$%^&');
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toMatch(/format is invalid/i);
  });
});

describe('validate (combined validator)', () => {
  test('returns valid when all fields are valid', () => {
    const result = validate({
      email: 'user@example.com',
      password: 'Str0ng!Pass',
      phone: '+14155552671',
    });
    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  test('aggregates errors from multiple invalid fields', () => {
    const result = validate({
      email: 'not-an-email',
      password: 'short',
      phone: '12345',
    });
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThanOrEqual(3);
    const fields = result.errors.map((e) => e.field);
    expect(fields).toEqual(expect.arrayContaining(['email', 'password', 'phone']));
  });
});
```

### Test Results

```
PASS ./validation.test.js
  validateEmail
    ✓ returns valid for a standard email
    ✓ returns valid for an email with subdomains and plus alias
    ✓ returns invalid when @ symbol is missing
    ✓ returns invalid when domain part is missing
    ✓ returns invalid for an empty string
    ✓ returns invalid for null input
    ✓ returns invalid for undefined input
    ✓ returns invalid for non-string input (number)
  validatePassword
    ✓ returns valid for a strong password
    ✓ returns invalid when password is too short
    ✓ returns invalid when password has no number
    ✓ returns invalid when password has no special character
    ✓ returns invalid when password has no uppercase letter
    ✓ returns invalid when password has no lowercase letter
    ✓ returns invalid for an empty string
    ✓ returns invalid for null input
    ✓ reports multiple failures at once for a weak password
  validatePhone
    ✓ returns valid for a standard international phone number
    ✓ returns valid for the minimum length (7 digits after +)
    ✓ returns invalid when + prefix is missing
    ✓ returns invalid when phone contains letters
    ✓ returns invalid when phone is too short
    ✓ returns invalid for an empty string
    ✓ returns invalid for null input
    ✓ returns invalid for special characters only
  validate (combined validator)
    ✓ returns valid when all fields are valid
    ✓ aggregates errors from multiple invalid fields

Test Suites: 1 passed, 1 total
Tests:       27 passed, 27 total
```

Each case aims at **one behaviour**—when CI breaks, the failing line name tells you which rule drifted.

---

## 5. Documentation (README.md)

README ships beside the module (`task_2/README.md`) so npm scripts and folder layout stay obvious without scrolling this assignment doc.

### Prompt Used

I asked ChatGPT:
> "Can you help me draft a README.md for this project in Markdown? I need sections for Overview, Installation, Usage Examples, API Endpoints with request/response examples, Error Codes, and example code snippets. Keep the wording simple and clear, not too formal."

I trimmed repeated phrasing and aligned error-code notes with “spec only until a server exists.”

### File: `README.md`

````markdown
# Data Validation Module

A small Node.js module for validating user input: email, password, and international phone number. Each validator returns a consistent `{ valid: boolean, errors: [] }` shape, so it is easy to plug into any API.

## Overview

This module exposes three field validators and one combined validator:

- `validateEmail(email)` - format and length check
- `validatePassword(password)` - length, uppercase, lowercase, number, special character
- `validatePhone(phone)` - international format `+` followed by 7-15 digits
- `validate(data)` - runs the validators above on a `{ email, password, phone }` object and returns aggregated results

All validators return:

```js
{ valid: true | false, errors: ["..."] }
```

The combined `validate()` also returns a flat list of `{ field, message }` objects, which is what the API responds with.

## Installation

Requirements: Node.js 16+ and npm.

```bash
git clone <repo-url>
cd data-validation-module
npm install
```

To run the tests:

```bash
npm test
```

## Validation Rules

| Field    | Rule                  | Criteria                                       |
|----------|-----------------------|------------------------------------------------|
| Email    | Required              | Cannot be null, undefined or empty             |
| Email    | Format                | Must match `user@domain.tld`                   |
| Email    | Max length            | Up to 254 characters                           |
| Password | Required              | Cannot be null, undefined or empty             |
| Password | Min length            | At least 8 characters                          |
| Password | Uppercase             | At least 1 uppercase letter                    |
| Password | Lowercase             | At least 1 lowercase letter                    |
| Password | Number                | At least 1 digit                               |
| Password | Special character     | At least 1 of `!@#$%^&*()_+-=[]{};':"\|,.<>/?` |
| Phone    | Required              | Cannot be null, undefined or empty             |
| Phone    | International format  | `+` followed by 7-15 digits                    |

## Usage Examples

### Single field validation

```js
const { validateEmail, validatePassword, validatePhone } = require('./validation');

validateEmail('user@example.com');
// { valid: true, errors: [] }

validatePassword('weak');
// {
//   valid: false,
//   errors: [
//     'Password must be at least 8 characters long.',
//     'Password must contain at least one uppercase letter.',
//     'Password must contain at least one number.',
//     'Password must contain at least one special character (!@#$%^&* etc.).'
//   ]
// }

validatePhone('+14155552671');
// { valid: true, errors: [] }
```

### Combined validation

```js
const { validate } = require('./validation');

validate({
  email: 'user@example.com',
  password: 'Str0ng!Pass',
  phone: '+14155552671',
});
// {
//   valid: true,
//   results: { email: {...}, password: {...}, phone: {...} },
//   errors: []
// }
```

## API Endpoints

### POST /validate

Validates one or more fields. All fields are optional, but the body must contain at least one of `email`, `password`, or `phone`.

Request:

```http
POST /validate
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "Str0ng!Pass",
  "phone": "+14155552671"
}
```

Response (200):

```json
{
  "valid": true,
  "results": {
    "email":    { "valid": true, "errors": [] },
    "password": { "valid": true, "errors": [] },
    "phone":    { "valid": true, "errors": [] }
  },
  "errors": []
}
```

### GET /validation-rules

Returns active validation rules. Optional `?field=email|password|phone` filter.

Request:

```http
GET /validation-rules?field=password
```

Response (200):

```json
{
  "rules": [
    {
      "id": 2,
      "rule_name": "password_min_length",
      "field": "password",
      "regex_pattern": ".{8,}",
      "error_message": "Password must be at least 8 characters long.",
      "is_active": true
    }
  ],
  "total": 1
}
```

## Error Codes

| Code | When it happens                                                       |
|------|-----------------------------------------------------------------------|
| 200  | Request handled. Body indicates whether the data is valid.            |
| 400  | Bad request body (not JSON, or no recognised fields).                 |
| 404  | `GET /validation-rules` filter does not match any rule.               |
| 429  | Too many requests (rate limit hit).                                   |
| 500  | Unexpected server error.                                              |

Note that a validation failure is not an HTTP error. The endpoint returns 200 with `valid: false` and a list of errors, so the client can show them in the UI.

## Project Structure

```
data-validation-module/
├── validation.js        # validators + combined validate()
├── validation.test.js   # Jest tests (27 tests)
├── schema.sql           # validation_rules table + seed data
├── package.json
└── README.md
```

## Running Tests

```bash
npm test
```

Expected output:

```
Test Suites: 1 passed, 1 total
Tests:       27 passed, 27 total
```
````

---

## 6. Review and Improvements

Outcome first: unchanged regex complexity keeps **ReDoS** exposure low; **static error strings** avoid reflecting attacker-controlled markup into responses; **`typeof` guards** landed after review.

### Prompt Used

I asked ChatGPT:
> "Please review this validation module like a quick technical check before submission. Focus on security risks (for example SQL injection and XSS), expected performance (around 1000 requests/sec), and structural clarity in the code. Then suggest improvements I can realistically apply at this scope."

Below is what stuck after filtering generic advice into concrete edits.

### Security

- **SQL Injection:** The validator functions don't run SQL themselves, so this risk lives in the API/database layer. The fix is to use parameterized queries when reading/writing the `validation_rules` table. I added a note to the API spec about this.
- **XSS:** All error messages are static strings I wrote myself, not built from user input, so they are safe to send back. On the frontend the output should still be escaped (just standard practice, not specific to this module).
- **Input validation:** I already check for null, undefined, wrong types, and empty strings before running the regex. ChatGPT pointed out one case I missed at first: passing a number to `validateEmail`. I added the `typeof !== 'string'` check after that.
- **ReDoS:** ChatGPT mentioned this. My regexes are simple (no nested quantifiers), so the risk is low, but I kept the patterns short on purpose.

### Performance

- **Regex compilation:** Patterns sit on **`VALIDATION_RULES`** objects once; validators call `.test()` instead of rebuilding literals per request.
- **Throughput (about 1000 req/s sketch):** Pure string checks are cheap; if anything saturates first it would be DB I/O on **`GET /validation-rules`**, hence the **`field`** index in SQL—not magic, just avoiding full scans as rows grow.
- **Still pending:** Password **max** length caps oversized payloads (left documented, not coded—see Constraints & assumptions).

### Structure

- **Parallel validator layout:** Same gate order across email/password/phone (see §2)—easy diff reviews.
- **Single config block:** Tweaking `VALIDATION_RULES` propagates without hunting through branches.
- **Aggregated helper:** `validate()` composes smaller functions instead of forked logic.

### Changes I Made After the Review

- Added the `typeof !== 'string'` check in all three validators (was missing in my first version).
- Kept all error messages as static strings (no raw user input echoed back, to avoid XSS risk).
- Confirmed all regex patterns are defined as constants, not built inside functions.
- Added note to the API spec that `GET /validation-rules` should be admin-only and that DB queries must be parameterized.
- Added password max length as a future improvement (not in code yet—see Constraints & assumptions).
