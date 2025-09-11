# Credentials and Security Guide

This guide explains how credentials are stored and managed in the Cobbler CRM application.

## 🔐 Credential Storage Overview

### Docker Container (Recommended Setup)
- **Database Credentials**: Handled automatically inside container
- **API Authentication**: Environment variables
- **Security**: Container isolation provides protection

### Local Development
- **Database Credentials**: Stored in `backend/.env` file
- **API Authentication**: Environment variables
- **Security**: File-based storage (not committed to Git)

---

## 🗄️ Database Credentials

### Docker Container Setup
```bash
# Location: Inside Docker container only
# Access: Only from within container
# Security: Container isolation

# Default Configuration (Automatic):
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=root
DB_PASSWORD=          # Empty password (secure inside container)
DB_NAME=cobbler_crm   # Auto-created database
```

**How it works:**
1. **MySQL Server** runs inside Docker container
2. **Root User** configured with empty password
3. **Database Access** only possible from within container
4. **Network Isolation** prevents external access
5. **Container Restart** preserves data in container volume

### Local Development Setup
```bash
# Location: backend/.env file
# Access: Local development only
# Security: File permissions, not committed to Git

# Example Configuration:
DB_HOST=localhost
DB_PORT=3306
DB_USER=cobbler_user
DB_PASSWORD=your_secure_password
DB_NAME=cobbler_crm
```

**Security considerations:**
- ✅ **Never commit** `.env` files to Git
- ✅ **Use strong passwords** for local MySQL users
- ✅ **Restrict file permissions**: `chmod 600 backend/.env`
- ✅ **Create dedicated user** instead of using root

---

## 🔑 API Authentication (X-Token)

### How X-Token Authentication Works

The application uses simple token-based authentication:

1. **Client** sends `X-Token` header with requests
2. **Server** validates token against `X_TOKEN_SECRET`
3. **Access granted** if tokens match

### Token Storage Locations

#### Backend (Server-side)
```bash
# Environment Variable
X_TOKEN_SECRET=cobbler_super_secret_token_2024

# Docker Container:
# - Set via environment variable or uses default
# - Stored in container memory only
# - Not persisted in image

# Local Development:
# - Stored in backend/.env file
# - Not committed to Git
```

#### Frontend (Client-side)
```bash
# Environment Variable  
VITE_X_TOKEN=cobbler_super_secret_token_2024

# Docker Container:
# - Built into frontend during Docker build
# - Uses default value if not specified
# - Served to browser as part of JavaScript

# Local Development:
# - Stored in src/.env.local file
# - Not committed to Git
# - Loaded by Vite during development
```

### Default Token
```bash
# Default for all environments:
X_TOKEN_SECRET=cobbler_super_secret_token_2024
```

**⚠️ Security Note**: Change this default token in production!

---

## 🛡️ Security Best Practices

### Production Deployment (Render.com)

#### Database Security
```bash
# Docker Container (Recommended):
- Database runs inside container
- No external network access
- Container isolation provides security
- Empty password secure within container

# External Database (Alternative):
- Use managed database service
- Enable SSL/TLS connections
- Use strong passwords
- Restrict network access
```

#### API Security
```bash
# Custom Token (Recommended):
X_TOKEN_SECRET=your-unique-production-token-here

# Token Requirements:
- Minimum 32 characters
- Mix of letters, numbers, symbols
- Unique per environment
- Rotated periodically
```

### Local Development

#### Database Security
```bash
# MySQL User Setup:
CREATE USER 'cobbler_user'@'localhost' IDENTIFIED BY 'strong_password';
GRANT ALL PRIVILEGES ON cobbler_crm.* TO 'cobbler_user'@'localhost';

# File Permissions:
chmod 600 backend/.env    # Owner read/write only
```

#### Environment Files
```bash
# Never commit these files:
backend/.env
src/.env.local

# Add to .gitignore:
*.env
*.env.local
*.env.production
```

---

## 🔧 Configuration Examples

### Docker Production (Render.com)
```bash
# Environment Variables in Render Dashboard:
NODE_ENV=production
PORT=3001
X_TOKEN_SECRET=your-unique-production-token
DB_NAME=cobbler_crm

# Database credentials handled automatically inside container
```

### Docker Local Development
```bash
# Run with custom token:
docker run -d -p 3001:3001 \
  -e X_TOKEN_SECRET=my-local-development-token \
  -e LOG_LEVEL=debug \
  --name cobbler-crm \
  cobbler-crm
```

### Local Development
```bash
# backend/.env
NODE_ENV=development
PORT=3001
DB_HOST=localhost
DB_PORT=3306
DB_USER=cobbler_user
DB_PASSWORD=your_secure_password
DB_NAME=cobbler_crm
X_TOKEN_SECRET=cobbler_super_secret_token_2024

# src/.env.local  
VITE_API_BASE_URL=http://localhost:3001
VITE_X_TOKEN=cobbler_super_secret_token_2024
```

---

## 🔍 How to Check Current Credentials

### Docker Container
```bash
# Check environment variables
docker exec -it cobbler-crm env | grep -E "(DB_|X_TOKEN)"

# Test database connection
docker exec -it cobbler-crm mysql -u root cobbler_crm -e "SELECT 1;"

# Test API authentication
curl -H "X-Token: cobbler_super_secret_token_2024" \
     http://localhost:3001/api/enquiries
```

### Local Development
```bash
# Check backend environment
cd backend && cat .env

# Check frontend environment  
cat src/.env.local

# Test database connection
mysql -u cobbler_user -p cobbler_crm -e "SELECT 1;"

# Test API authentication
curl -H "X-Token: $(grep VITE_X_TOKEN src/.env.local | cut -d= -f2)" \
     http://localhost:3001/api/enquiries
```

---

## 🚨 Security Troubleshooting

### Common Issues

#### "Invalid token" Error
```bash
# Check if tokens match between frontend and backend
# Frontend token (browser network tab):
X-Token: cobbler_super_secret_token_2024

# Backend token (environment):
X_TOKEN_SECRET=cobbler_super_secret_token_2024

# Solution: Ensure both tokens are identical
```

#### Database Connection Failed
```bash
# Docker Container:
# - Check if MySQL is running inside container
docker exec -it cobbler-crm ps aux | grep mysql

# - Check database exists
docker exec -it cobbler-crm mysql -u root -e "SHOW DATABASES;"

# Local Development:
# - Check MySQL service is running
brew services list | grep mysql

# - Test connection with stored credentials
mysql -u cobbler_user -p cobbler_crm -e "SELECT 1;"
```

#### CORS Errors
```bash
# Check if frontend origin is allowed
# Backend CORS configuration should include your frontend URL

# Docker: http://localhost:3001 (frontend served by backend)
# Local Dev: http://localhost:5173 (Vite dev server)
```

---

## 🔄 Credential Rotation

### Changing API Token

#### Docker Production
```bash
# Update environment variable in Render dashboard:
X_TOKEN_SECRET=new-secure-token-here

# Redeploy application
```

#### Docker Local
```bash
# Stop container
docker stop cobbler-crm && docker rm cobbler-crm

# Run with new token
docker run -d -p 3001:3001 \
  -e X_TOKEN_SECRET=new-local-token \
  --name cobbler-crm \
  cobbler-crm
```

#### Local Development
```bash
# Update backend/.env
X_TOKEN_SECRET=new-secure-token

# Update src/.env.local
VITE_X_TOKEN=new-secure-token

# Restart both frontend and backend servers
```

### Changing Database Password (Local Only)

```bash
# Connect to MySQL
mysql -u root -p

# Change user password
ALTER USER 'cobbler_user'@'localhost' IDENTIFIED BY 'new_secure_password';
FLUSH PRIVILEGES;
EXIT;

# Update backend/.env
DB_PASSWORD=new_secure_password

# Restart backend server
```

---

## 📋 Security Checklist

### Before Production Deployment
- [ ] Changed default `X_TOKEN_SECRET` to unique value
- [ ] Using Docker container (recommended) or secured external database
- [ ] Environment variables not committed to Git
- [ ] HTTPS enabled (automatic on Render.com)
- [ ] CORS configured for production domain
- [ ] Rate limiting enabled (already configured)
- [ ] Security headers enabled (already configured)

### Regular Maintenance
- [ ] Rotate API tokens periodically
- [ ] Monitor access logs for suspicious activity
- [ ] Keep Docker images updated
- [ ] Review and update dependencies
- [ ] Backup database data regularly

---

## 📞 Support

If you encounter credential or security issues:

1. **Check logs**: `docker logs cobbler-crm` or backend console
2. **Verify configuration**: Compare environment variables
3. **Test connections**: Use curl commands provided above
4. **Review documentation**: Re-read relevant sections
5. **Reset credentials**: Follow rotation procedures above

**Remember**: Never share production credentials or commit them to version control!
