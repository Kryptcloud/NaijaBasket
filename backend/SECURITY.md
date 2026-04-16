# 🔒 naijabasket Backend Security Documentation

## Overview
This document outlines all security measures implemented in the naijabasket backend to protect against common attack vectors and ensure data integrity.

## Table of Contents
1. [Authentication & Authorization](#authentication--authorization)
2. [Input Validation & Sanitization](#input-validation--sanitization)
3. [Data Protection](#data-protection)
4. [API Security](#api-security)
5. [Network Security](#network-security)
6. [Monitoring & Logging](#monitoring--logging)
7. [Compliance & Best Practices](#compliance--best-practices)

---

## Authentication & Authorization

### JWT (JSON Web Tokens)
- **Access Tokens**: 7-day expiration (configurable)
- **Refresh Tokens**: 30-day expiration with database tracking
- **Token Blacklisting**: Refresh tokens stored in database, can be revoked
- **Secret Management**: JWT secrets stored in environment variables (never in code)
- **Token Structure**:
  ```
  {
    "id": "user-uuid",
    "email": "user@example.com",
    "role": "customer|admin",
    "iat": timestamp,
    "exp": timestamp,
    "iss": "naijabasket",
    "sub": "user-id"
  }
  ```

### Password Security
- **Algorithm**: bcrypt with 12 rounds (industry standard)
- **Requirements**:
  - Minimum 8 characters
  - At least 1 uppercase letter
  - At least 1 number
  - At least 1 special character (!@#$%^&*)
- **Storage**: Hash storage in database, never plaintext
- **Never transmitted**: Passwords only hashed during login/registration

### Role-Based Access Control (RBAC)
- **Roles**: `customer`, `admin`
- **Admin Routes**: Protected by `adminMiddleware` on all `/api/admin/*` routes
- **Verification**: Role checked in JWT token and re-verified on sensitive operations

### Rate Limiting on Auth
- **Login**: 5 attempts per 15 minutes per IP
- **Registration**: Standard rate limit (100 requests per 15 minutes)
- **Strategy**: IP-based identification, prevents brute force attacks

---

## Input Validation & Sanitization

### Server-Side Validation
All inputs validated using `express-validator`:
```typescript
body("email").isEmail().normalizeEmail()
body("password").isLength({ min: 8 }).matches(/[A-Z]/)
body("amount").isInt({ min: 100 })
```

### Input Sanitization
- **XSS Prevention**: Angle brackets and quotes removed from string inputs
- **Length Limits**: 
  - Names, emails: 255 characters max
  - Descriptions: 500 characters max
  - Addresses: 500 characters max
- **Type Checking**: Strict type validation before database insertion

### SQL Injection Prevention
- **Parameterized Queries**: All database queries use `$1, $2, $n` parameterization
- **No String Concatenation**: Raw SQL strings never concatenated with user input
- **Example**:
  ```typescript
  // ✅ SAFE
  db.query("SELECT * FROM users WHERE email = $1", [email])
  
  // ❌ DANGEROUS (Never do this)
  db.query(`SELECT * FROM users WHERE email = '${email}'`)
  ```

---

## Data Protection

### Password Hashing
```typescript
const hashedPassword = await bcrypt.hash(password, 12);
const isValid = await bcrypt.compare(password, hashedPassword);
```

### Database Security
- **Connection Pooling**: Max 20 concurrent connections
- **SSL Support**: Enabled in production environments
- **Query Logging**: All queries logged with durations
- **Transaction Support**: ACID compliance for multi-step operations
- **UUID Primary Keys**: Prevents sequential ID enumeration attacks

### Sensitive Data Handling
- **No Log Exposure**: Sensitive endpoints (auth) marked in logs
- **No Error Details in Production**: Stack traces not sent to clients in prod
- **Credential Masking**: Passwords, tokens never logged
- **Database Encryption**: Consider encrypting payment details at rest

---

## API Security

### Helmet.js Headers
```
X-Content-Type-Options: nosniff     // Prevent MIME sniffing
X-Frame-Options: DENY               // Disable clickjacking
X-XSS-Protection: 1; mode=block     // XSS filter activation
Strict-Transport-Security: max-age=31536000
Content-Security-Policy: default-src 'self'
```

### CORS (Cross-Origin Resource Sharing)
```typescript
const corsOptions = {
  origin: process.env.ALLOWED_ORIGINS?.split(","),
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
  allowedHeaders: ["Content-Type", "Authorization"],
  maxAge: 3600
}
```
- **Whitelist Enabled**: Only specified origins allowed
- **Credentials**: Required for sensitive operations
- **Pre-flight Cache**: 1 hour

### Rate Limiting
```
General API:     100 requests per 15 minutes
Auth Endpoints:  5 requests per 15 minutes (login/register)
Per-IP Blocking: Automatic on excessive requests
```

### Request Size Limits
- **JSON Payload**: 10KB maximum
- **URL Encoded**: 10KB maximum
- **Prevention**: DoS attacks via large payloads

---

## Network Security

### HTTPS/TLS
- **Production**: All traffic over HTTPS (TLS 1.2+)
- **HSTS**: Enabled with 1-year max-age and includeSubDomains
- **Certificate**: Self-signed in dev, proper CA in production

### Webhook Security
- **Paystack Webhooks**: HMAC-SHA512 signature verification
- **Constant-Time Comparison**: Prevents timing attacks
- **IP Whitelisting**: Optional (Paystack IP ranges)

### API Keys & Secrets
- **Environment Variables**: All secrets in `.env` file (never committed)
- **Rotation**: Keys should be rotated regularly
- **Scoping**: Paystack keys limited to necessary permissions

---

## Monitoring & Logging

### Request Logging
```
[timestamp] METHOD path
  statusCode: 200
  duration: 145ms
  ip: 192.168.1.1
  userAgent: Mozilla/5.0...
  userId: uuid
```

### Error Logging
- **File**: `logs/errors.log`
- **Console**: Development environment
- **Stack Traces**: Included in development, hidden in production
- **Sensitive Data**: Passwords, tokens never logged

### Audit Trail
- **Table**: `audit_logs` for admin actions
- **Fields**: User, action, entity, changes, IP, timestamp
- **Retention**: Minimum 90 days

### Security Events
- Failed login attempts tracked in `login_attempts` table
- Webhook verification failures logged
- Suspicious patterns: Multiple failed logins from same IP

---

## Compliance & Best Practices

### Database Best Practices
1. **User Isolation**: Queries scoped to authenticated user ID
2. **Soft Deletes**: Products marked inactive, not deleted
3. **Timestamps**: All records have created_at and updated_at
4. **Foreign Keys**: Referential integrity enabled
5. **Indexes**: High-value queries indexed for performance

### Transaction Security
```typescript
// Atomic operations for order creation
await db.transaction(async (client) => {
  // Insert order
  // Insert order items
  // Update totals
  // All succeed or all rollback
})
```

### Payment Security
- **No Card Storage**: Payment handled by Paystack (PCI-DSS compliant)
- **Webhook Verification**: HMAC signature validation
- **Amount Verification**: Server-side total calculation, not trusted from client
- **Reference Tracking**: Unique reference per transaction

### Admin Security
- **Separate Role**: Distinct `admin` role in JWT
- **Admin Endpoints**: All require admin middleware verification
- **Audit Logging**: All admin actions logged with IP and timestamp
- **No Direct Access**: No admin routes accessible without proper auth

### Error Handling
```typescript
// ✅ Safe error response
{
  "error": "Validation failed",
  "details": [{ "field": "email", "message": "Invalid format" }]
}

// ❌ Unsafe (leaks internals)
{
  "error": "Cannot read property 'email' of undefined",
  "stack": "at Object.query..."
}
```

---

## Deployment Checklist

- [ ] Generate strong JWT_SECRET (32+ characters)
- [ ] Generate strong REFRESH_TOKEN_SECRET (32+ characters)
- [ ] Set NODE_ENV=production
- [ ] Configure ALLOWED_ORIGINS for CORS
- [ ] Set Paystack keys (SECRET and WEBHOOK SECRET)
- [ ] Configure database SSL=true
- [ ] Setup SMTP for email notifications (optional)
- [ ] Enable HTTPS/TLS certificates
- [ ] Configure proper logging (file system or cloud service)
- [ ] Setup monitoring/alerting for errors
- [ ] Implement rate limiting on production servers
- [ ] Regular security audits (quarterly)
- [ ] Dependency updates (monthly)
- [ ] Database backups (daily)
- [ ] Log rotation (prevent disk space issues)

---

## Incident Response

### If a secret is exposed:
1. Rotate immediately (regenerate all keys)
2. Invalidate all tokens (clear refresh_tokens table)
3. Force password reset for all users (optional)
4. Audit logs for unauthorized access
5. Monitor for suspicious activity

### If a payment webhook fails:
1. Check signature verification
2. Verify IP whitelisting (if enabled)
3. Check Paystack API status
4. Implement retry logic with exponential backoff
5. Alert admin via email/SMS

---

## Third-Party Security

### Paystack Integration
- **Reference**: https://paystack.com/docs/api/
- **PCI-DSS**: Paystack is PCI DSS Level 1 certified
- **Webhook IP**: Verify from Paystack documentation
- **Test vs Live**: Different keys for test and production environments

### Dependencies
- Update regularly: `npm audit`, `npm update`
- Known vulnerabilities: Monitor security advisories
- Pinned versions: Consider pinning versions in package-lock.json

---

## References
- OWASP Top 10: https://owasp.org/www-project-top-ten/
- JWT Best Practices: https://tools.ietf.org/html/rfc8725
- Express Security: https://expressjs.com/en/advanced/best-practice-security.html
- Node.js Security: https://nodejs.org/en/docs/guides/security/

---

Last Updated: 2024
Version: 1.0
