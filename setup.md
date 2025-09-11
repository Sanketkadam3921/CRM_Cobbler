# Cobbler CRM Backend Setup Guide

This guide will help you set up the backend server and MySQL database for the Cobbler CRM application. Choose between **Docker** (recommended) or **local development** setup.

## 🚀 Option 1: Docker Setup (Recommended)

### Why Docker?
- ✅ **No MySQL installation needed** - runs inside container
- ✅ **No environment configuration** - works with defaults  
- ✅ **Identical to production** - same as Render.com deployment
- ✅ **Quick setup** - single command to run everything

### Prerequisites
- Docker installed on your system

### Quick Start
```bash
# Build and run
docker build -t cobbler-crm .
docker run -d -p 3001:3001 --name cobbler-crm cobbler-crm

# Verify it works
curl http://localhost:3001/health
curl -H "X-Token: cobbler_super_secret_token_2024" http://localhost:3001/api/enquiries

# Access frontend
open http://localhost:3001
```

### What Happens Automatically
1. **MySQL Server** starts inside container
2. **Database Created**: `cobbler_crm` 
3. **Schema Created**: All tables automatically
4. **Backend Started**: Node.js API on port 3001
5. **Frontend Served**: React app from same port

### Docker Management
```bash
# View logs
docker logs -f cobbler-crm

# Stop/start
docker stop cobbler-crm
docker start cobbler-crm  

# Rebuild after changes
docker stop cobbler-crm && docker rm cobbler-crm
docker build -t cobbler-crm .
docker run -d -p 3001:3001 --name cobbler-crm cobbler-crm

# Access database
docker exec -it cobbler-crm mysql -u root cobbler_crm
```

### Custom Configuration (Optional)
```bash
# Run with custom settings
docker run -d -p 3001:3001 \
  -e X_TOKEN_SECRET=your-custom-token \
  -e DB_NAME=custom_db_name \
  -e LOG_LEVEL=debug \
  --name cobbler-crm \
  cobbler-crm
```

---

## 🛠️ Option 2: Local Development Setup

For developers who want to run MySQL and Node.js locally.

### Prerequisites

- **Node.js** (v16 or higher)
- **MySQL 8.0** (already installed on your system)
- **npm** or **yarn** package manager

## Step 1: Database Setup

### 1.1 Start MySQL Service
```bash
# On macOS (if using Homebrew)
brew services start mysql

# On Linux
sudo systemctl start mysql

# On Windows
net start mysql
```

### 1.2 Access MySQL Command Line
```bash
mysql -u root -p
```
Enter your MySQL root password when prompted.

### 1.3 Create Database and User
```sql
-- Create the database
CREATE DATABASE cobbler_crm;

-- Create a dedicated user (recommended for security)
CREATE USER 'cobbler_user'@'localhost' IDENTIFIED BY 'your_secure_password';

-- Grant privileges to the user
GRANT ALL PRIVILEGES ON cobbler_crm.* TO 'cobbler_user'@'localhost';

-- Apply changes
FLUSH PRIVILEGES;

-- Verify the database was created
SHOW DATABASES;

-- Exit MySQL
EXIT;
```

## Step 2: Backend Setup

### 2.1 Navigate to Backend Directory
```bash
cd backend
```

### 2.2 Install Dependencies
```bash
npm install
```

### 2.3 Environment Configuration

#### 2.3.1 Copy Environment Template
```bash
cp .env.example .env
```

#### 2.3.2 Configure Environment Variables
Edit the `.env` file with your database credentials:

```env
# Server Configuration
PORT=3001
NODE_ENV=development

# Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_USER=cobbler_user
DB_PASSWORD=your_secure_password
DB_NAME=cobbler_crm
DB_CONNECTION_LIMIT=10

# Authentication
X_TOKEN_SECRET=cobbler_super_secret_token_2024
X_TOKEN_EXPIRY=24h

# CORS Configuration
CORS_ORIGIN=http://localhost:8080,http://localhost:8081,http://localhost:8082,http://localhost:8083,http://localhost:8084

# Logging Configuration
LOG_LEVEL=info
LOG_FILE_PATH=logs
LOG_MAX_SIZE=20m
LOG_MAX_FILES=14d
```

**Important Notes:**
- Replace `your_secure_password` with the password you set for `cobbler_user`
- The `X_TOKEN_SECRET` should be kept secure and unique
- Adjust `CORS_ORIGIN` if your frontend runs on different ports

### 2.4 Create Logs Directory
```bash
mkdir -p logs
```

## Step 3: Database Schema Setup

The database tables will be automatically created when you start the backend server. The application includes a database initialization script that creates all necessary tables.

## Step 4: Start the Backend Server

### 4.1 Development Mode (with auto-restart)
```bash
npm run dev
```

### 4.2 Production Mode
```bash
npm run build
npm start
```

### 4.3 Verify Server is Running
The server should start and display:
```
🚀 Cobbler Backend API Server started on port 3001
📊 Database connected successfully
🗄️  Database tables created/verified
📝 Logging initialized
🔒 Authentication middleware loaded
🌐 CORS configured for: http://localhost:8080,http://localhost:8081,http://localhost:8082,http://localhost:8083,http://localhost:8084
```

## Step 5: Test the Backend

### 5.1 Health Check
```bash
curl http://localhost:3001/health
```
Expected response:
```json
{
  "success": true,
  "message": "Cobbler Backend API is running",
  "timestamp": "2025-08-31T20:47:19.610Z",
  "version": "1.0.0"
}
```

### 5.2 Test API Endpoint (with authentication)
```bash
curl -X GET 'http://localhost:3001/api/enquiries' \
  -H 'Content-Type: application/json' \
  -H 'X-Token: cobbler_super_secret_token_2024'
```

Expected response:
```json
{
  "success": true,
  "data": {
    "data": [],
    "total": 0,
    "page": 1,
    "limit": 50,
    "totalPages": 1
  }
}
```

## Step 6: Frontend Configuration

### 6.1 Navigate to Frontend Directory
```bash
cd ../
```

### 6.2 Create Frontend Environment File
```bash
cp src/.env.example src/.env.local
```

### 6.3 Configure Frontend Environment
Edit `src/.env.local`:

```env
VITE_API_BASE_URL=http://localhost:3001
VITE_X_TOKEN=cobbler_super_secret_token_2024
```

### 6.4 Start Frontend
```bash
npm run dev
```

## Troubleshooting

### Database Connection Issues

1. **MySQL Service Not Running**
   ```bash
   # Check MySQL status
   brew services list | grep mysql
   
   # Start MySQL if not running
   brew services start mysql
   ```

2. **Wrong Credentials**
   - Verify username and password in `.env`
   - Test connection manually:
   ```bash
   mysql -u cobbler_user -p cobbler_crm
   ```

3. **Database Doesn't Exist**
   ```sql
   -- Connect to MySQL as root
   mysql -u root -p
   
   -- Create database if missing
   CREATE DATABASE cobbler_crm;
   ```

### Port Conflicts

1. **Port 3001 Already in Use**
   ```bash
   # Find process using port 3001
   lsof -i :3001
   
   # Kill the process
   kill -9 <PID>
   ```

2. **Change Backend Port**
   - Edit `.env` file
   - Change `PORT=3001` to `PORT=3002`
   - Update frontend `.env.local` accordingly

### Authentication Issues

1. **Invalid X-Token**
   - Ensure `X_TOKEN_SECRET` in backend `.env` matches `VITE_X_TOKEN` in frontend `.env.local`
   - Restart both frontend and backend after changing tokens

2. **CORS Errors**
   - Verify `CORS_ORIGIN` in backend `.env` includes your frontend URL
   - Check browser console for specific CORS error messages

## Database Schema Overview

The application automatically creates these tables:

- **enquiries** - Main enquiry records
- **pickup_details** - Pickup stage information
- **service_details** - Service stage information
- **service_types** - Available service types
- **photos** - Photo storage (LONGTEXT for base64)
- **delivery_details** - Delivery stage information
- **billing_details** - Billing information
- **billing_items** - Individual billing items
- **users** - User management (for future use)

## Logging

Logs are stored in the `logs/` directory:
- `application.log` - General application logs
- `error.log` - Error logs
- `database.log` - Database operation logs
- `api.log` - API request/response logs

## Security Notes

1. **Change Default Passwords**
   - Update MySQL user password
   - Change `X_TOKEN_SECRET` to a unique value
   - Use strong, unique passwords

2. **Environment Variables**
   - Never commit `.env` files to version control
   - Use different credentials for development and production

3. **Database Access**
   - Limit database user privileges to only necessary operations
   - Use dedicated database user instead of root

## Production Deployment

For production deployment:

1. **Environment Variables**
   - Set `NODE_ENV=production`
   - Use production database credentials
   - Configure proper CORS origins

2. **Database**
   - Use production MySQL instance
   - Configure proper backup strategies
   - Set up monitoring and alerting

3. **Security**
   - Use HTTPS
   - Implement rate limiting
   - Set up proper firewall rules
   - Use environment-specific secrets

## Support

If you encounter issues:

1. Check the logs in `logs/` directory
2. Verify all environment variables are set correctly
3. Ensure MySQL service is running
4. Test database connection manually
5. Check browser console for frontend errors

For additional help, refer to the application logs or check the troubleshooting section above.
