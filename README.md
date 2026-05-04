# Data Validation Module

## Overview

This is my Node.js validation module for:
- email
- password
- phone number

I tried to keep it simple and readable.

Each function returns:

```json
{ "valid": true | false, "errors": ["..."] }
```

## Installation

```bash
npm install
npm test
```

Node.js 16+ is enough.

## Validation Rules

| Field    | Rule                | Criteria                                      | Error Message                                                    |
|----------|---------------------|-----------------------------------------------|------------------------------------------------------------------|
| Email    | Format              | Must match `user@domain.tld` pattern          | Email format is invalid. Expected format: user@example.com.      |
| Email    | Max length          | Cannot exceed 254 characters                  | Email must not exceed 254 characters.                            |
| Email    | Required            | Cannot be null, undefined, or empty           | Email is required and cannot be null.                            |
| Password | Min length          | At least 8 characters                         | Password must be at least 8 characters long.                     |
| Password | Uppercase           | At least one uppercase letter (A-Z)           | Password must contain at least one uppercase letter.             |
| Password | Lowercase           | At least one lowercase letter (a-z)           | Password must contain at least one lowercase letter.             |
| Password | Number              | At least one digit (0-9)                      | Password must contain at least one number.                       |
| Password | Special character   | At least one of `!@#$%^&*()_+-=` etc.        | Password must contain at least one special character.            |
| Password | Required            | Cannot be null, undefined, or empty           | Password is required and cannot be null.                         |
| Phone    | International format| Must start with `+` followed by 7-15 digits   | Phone number format is invalid. Expected: +1234567890.           |
| Phone    | Required            | Cannot be null, undefined, or empty           | Phone number is required and cannot be null.                     |

## Usage Examples

### Individual Validators

```javascript
const { validateEmail, validatePassword, validatePhone } = require('./validation');

console.log(validateEmail('user@example.com'));
// { valid: true, errors: [] }

console.log(validatePassword('weak'));
// { valid: false, errors: ['Password must be at least 8 characters long.', ...] }

console.log(validatePhone('123-456-7890'));
// { valid: false, errors: ['Phone number must start with "+" for international format.', ...] }
```

### Combined Validator

```javascript
const { validate } = require('./validation');

const result = validate({
  email: 'user@example.com',
  password: 'Str0ng!Pass',
  phone: '+14155552671',
});

console.log(result);
```

## API Endpoints

### POST /validate

Checks one or more fields.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "Str0ng!Pass",
  "phone": "+14155552671"
}
```

**Response (200):**
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

Returns active validation rules from DB.
Optional filter: `?field=password`

## Error Codes

| HTTP Status | Meaning               | When Returned                              |
|-------------|-----------------------|--------------------------------------------|
| 200         | OK                    | Validation finished (can still include field errors) |
| 400         | Bad Request           | Missing or wrong request body              |
| 404         | Not Found             | Endpoint not found                         |
| 429         | Too Many Requests     | Rate limit hit                             |
| 500         | Internal Server Error | Unexpected backend error                   |

## Running Tests

```bash
npm test
```

Current result: 27 tests, all passing.

## Project Structure

```text
task_2/
  validation.js          # validator functions
  validation.test.js     # jest tests
  schema.sql             # sql schema + seed rules
  package.json           # scripts/dependencies
  README.md              # this file
```
