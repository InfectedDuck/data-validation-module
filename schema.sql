-- Validation rules table + seed data.

CREATE TABLE IF NOT EXISTS validation_rules (
    id            SERIAL PRIMARY KEY,
    rule_name     VARCHAR(100)  NOT NULL UNIQUE,
    field         VARCHAR(50)   NOT NULL,           -- 'email', 'password', 'phone'
    regex_pattern TEXT          NOT NULL,
    error_message VARCHAR(255)  NOT NULL,
    is_active     BOOLEAN       NOT NULL DEFAULT TRUE,
    created_at    TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at    TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Helps filter by field quickly.
CREATE INDEX idx_validation_rules_field ON validation_rules (field);

-- Default rules.

INSERT INTO validation_rules (rule_name, field, regex_pattern, error_message) VALUES
    ('email_format',
     'email',
     '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$',
     'Email format is invalid. Expected format: user@example.com.'),

    ('password_min_length',
     'password',
     '.{8,}',
     'Password must be at least 8 characters long.'),

    ('password_uppercase',
     'password',
     '[A-Z]',
     'Password must contain at least one uppercase letter.'),

    ('password_lowercase',
     'password',
     '[a-z]',
     'Password must contain at least one lowercase letter.'),

    ('password_number',
     'password',
     '\d',
     'Password must contain at least one number.'),

    ('password_special_char',
     'password',
     '[!@#$%^&*()_+\-=\[\]{};'':"\\|,.<>\/?]',
     'Password must contain at least one special character (!@#$%^&* etc.).'),

    ('phone_international',
     'phone',
     '^\+[1-9]\d{6,14}$',
     'Phone number format is invalid. Expected international format: +1234567890 (7-15 digits after +).');
