# Quick Security Reference Guide

## 🔒 Essential Security Commands

### Environment Setup
```bash
# Generate random secret (32 characters)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Set in .env
JWT_SECRET=<generated-value>
REFRESH_TOKEN_SECRET=<generated-value>
```

### Database Operations
```bash
# Connect to PostgreSQL
psql naijabasket

# Run migrations
psql naijabasket < src/migrations/001_init.sql

# Backup database
pg_dump naijabasket > backup.sql

# Restore from backup
psql naijabasket < backup.sql
```

### Security Checks
```bash
# Check for vulnerable dependencies
npm audit

# Fix vulnerabilities
npm audit fix

# Update dependencies
npm update

# Check for outdated packages
npm outdated
```

### Docker & Deployment
```bash
# Start services locally
docker-compose up -d

# Stop services
docker-compose down

# View logs
docker-compose logs -f backend

# Build production image
docker build -t naijabasket-backend:latest .
```

---

## 🛡️ Security Best Practices

### Before Deployment

1. **Secrets Management**
   ```bash
   # NEVER commit .env files
   git status  # Verify .env is in .gitignore
   
   # Rotate secrets before going live
   # Generate new JWT_SECRET, REFRESH_TOKEN_SECRET
   ```

2. **Database Security**
   ```bash
   # Connect with SSL in production
   DATABASE_URL=postgresql://user:pass@host:5432/db?sslmode=require
   ```

3. **Dependencies**
   ```bash
   # Audit all dependencies before deploy
   npm audit
   npm ci --only=production  # Install exact versions
   ```

4. **Environment Variables**
   ```bash
   # Required for production
   NODE_ENV=production
   JWT_SECRET=<strong-random>
   PAYSTACK_SECRET_KEY=<live-key>
   ALLOWED_ORIGINS=https://yourdomain.com
   ```

---

## 🔐 Monitoring Security

### Log Analysis
```bash
# Check for failed logins
grep "Failed login" logs/app.log | wc -l

# Check for validation errors
grep "Validation failed" logs/app.log

# Monitor errors
tail -f logs/errors.log
```

### Security Alerts
```bash
# High failed login rate (possible brute force)
grep "Failed login" logs/app.log | tail -100 | wc -l

# Database connection errors
grep "connection failed" logs/errors.log

# Webhook failures
grep "webhook" logs/errors.log | grep -i error
```

---

## 🚑 Incident Response

### If Secret is Exposed

```bash
# 1. Generate new secrets immediately
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# 2. Update environment
# Edit .env with new values

# 3. Clear database tokens
psql naijabasket
> DELETE FROM refresh_tokens;
> \q

# 4. Restart server
npm run dev

# 5. Monitor for attacks
tail -f logs/errors.log
```

### If Payment Processing Fails

```bash
# Check transaction logs
psql naijabasket
> SELECT * FROM transactions WHERE status = 'failed' ORDER BY created_at DESC;

# Verify Paystack API status
curl https://api.paystack.co/transaction/verify/<ref>

# Check webhook deliveries in Paystack dashboard
# https://dashboard.paystack.com/settings/developers/webhooks
```

### If Brute Force Attack Detected

```bash
# 1. Block IP address (in load balancer/firewall)
# 2. Check login attempts
psql naijabasket
> SELECT email, COUNT(*) FROM login_attempts 
  WHERE success = false 
  GROUP BY email 
  ORDER BY count DESC;

# 3. Force password reset for affected accounts
UPDATE users SET password = NULL WHERE email = 'affected@example.com';
```

---

## 🧪 Testing Security

### Test Password Validation
```bash
# Weak password (should fail)
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{ "password": "weak" }'

# Strong password (should succeed)
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{ "password": "SecurePass123!" }'
```

### Test Rate Limiting
```bash
# Make 6 login attempts (should block on 6th)
for i in {1..6}; do
  curl -X POST http://localhost:3000/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{ "email": "test@example.com", "password": "pass" }'
  echo "Attempt $i"
done
```

### Test JWT Expiration
```bash
# Try with expired/invalid token
curl -H "Authorization: Bearer invalid_token" \
  http://localhost:3000/api/orders

# Should return 401 Unauthorized
```

### Test SQL Injection Prevention
```bash
# Try SQL injection in email
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{ "email": "a@b.com\" OR 1=1; --", "password": "pass" }'

# Should fail gracefully, not execute SQL
```

---

## 📋 Security Audit Checklist

- [ ] All environment variables set (no defaults for secrets)
- [ ] .env file in .gitignore
- [ ] JWT_SECRET and REFRESH_TOKEN_SECRET are 32+ characters
- [ ] Database has SSL enabled in production
- [ ] CORS whitelist contains only trusted origins
- [ ] Rate limiting configured appropriately
- [ ] HTTPS/TLS enabled for all endpoints
- [ ] Error responses don't leak sensitive info
- [ ] Paystack webhook signature secret configured
- [ ] Database backups automated (daily)
- [ ] Logs rotated to prevent disk space issues
- [ ] Monitoring/alerting configured
- [ ] Security headers present in all responses
- [ ] Password policy enforced (8+ chars, complexity)
- [ ] Admin role properly restricted
- [ ] Audit logs configured
- [ ] Dependencies up to date
- [ ] No hardcoded secrets in code
- [ ] HTTPS certificate valid and renewed

---

## 📚 Security Resources

- OWASP Top 10: https://owasp.org/www-project-top-ten/
- Node.js Security: https://nodejs.org/en/docs/guides/security/
- Express Security: https://expressjs.com/en/advanced/best-practice-security.html
- PostgreSQL Security: https://www.postgresql.org/docs/current/sql-syntax.html
- JWT Best Practices: https://tools.ietf.org/html/rfc8725
- Paystack Docs: https://paystack.com/docs/api/

---

## 🆘 Common Issues & Solutions

### Issue: "JWT_SECRET not found"
```bash
# Solution: Check .env file exists and is loaded
cat .env | grep JWT_SECRET
source .env
npm run dev
```

### Issue: "Database connection timeout"
```bash
# Solution: Verify PostgreSQL is running
docker-compose ps
docker-compose logs postgres
docker-compose restart postgres
```

### Issue: "CORS blocked request"
```bash
# Solution: Add origin to ALLOWED_ORIGINS
ALLOWED_ORIGINS=http://localhost:3000,https://yourdomain.com
```

### Issue: "Rate limit exceeded"
```bash
# Solution: Wait 15 minutes or clear rate limiter
# Or configure in environment:
RATE_LIMIT_WINDOW=30  # 30 minutes
RATE_LIMIT_MAX_REQUESTS=200  # 200 requests
```

---

## 💡 Pro Tips

1. **Rotate secrets quarterly** even if not exposed
2. **Review audit logs monthly** for unusual patterns  
3. **Keep dependencies updated** - run `npm audit` weekly
4. **Monitor error logs for spikes** - could indicate attack
5. **Backup database daily** - test restoration quarterly
6. **Test DDoS responses** - implement rate limiting
7. **Document all security changes** - maintain audit trail
8. **Train team on security** - security is everyone's responsibility

---

Last Updated: 2024
For additional help: See SECURITY.md and README.md
