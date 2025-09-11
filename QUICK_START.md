# Quick Start Guide - Docker Edition

Get your Cobbler CRM up and running in minutes with Docker!

## 🚀 Super Quick Start (Docker)

### Prerequisites
- **Docker** installed on your system
- **Git** for cloning the repository

### One-Command Setup
```bash
# Clone, build, and run
git clone <your-repo-url> cobbler-crm
cd cobbler-crm
docker build -t cobbler-crm .
docker run -d -p 3001:3001 --name cobbler-crm cobbler-crm
```

### Verify Everything Works
```bash
# Check health
curl http://localhost:3001/health

# Test API
curl -H "X-Token: cobbler_super_secret_token_2024" http://localhost:3001/api/enquiries

# Access frontend
open http://localhost:3001
```

**That's it! Your CRM is running with MySQL database included!** ✅

---

## 📋 Detailed Setup Options

## Option 1: Docker (Recommended)

### 1.1 Build and Run
```bash
# Build the container
docker build -t cobbler-crm .

# Run the container
docker run -d -p 3001:3001 --name cobbler-crm cobbler-crm

# View logs
docker logs -f cobbler-crm

# Stop/start container
docker stop cobbler-crm
docker start cobbler-crm
```

### 1.2 What Happens Automatically
- ✅ **MySQL Server** starts inside container
- ✅ **Database Created**: `cobbler_crm`
- ✅ **Tables Created**: All schema automatically
- ✅ **Backend Started**: Node.js API server
- ✅ **Frontend Served**: React app on port 3001

### 1.3 Your URLs
- **Frontend**: http://localhost:3001
- **API**: http://localhost:3001/api
- **Health**: http://localhost:3001/health

### 1.4 Test Endpoints
```bash
# Health check
curl http://localhost:3001/health
# Expected: {"success":true,"message":"Cobbler Backend API is running"}

# Get enquiries (empty initially)
curl -H "X-Token: cobbler_super_secret_token_2024" \
     http://localhost:3001/api/enquiries
# Expected: {"success":true,"data":{"data":[],"total":0}}

# Get stats
curl -H "X-Token: cobbler_super_secret_token_2024" \
     http://localhost:3001/api/enquiries/stats
# Expected: {"success":true,"data":{"totalCurrentMonth":0,...}}
```

### 1.5 Custom Configuration (Optional)
```bash
# Run with custom environment variables
docker run -d -p 3001:3001 \
  -e X_TOKEN_SECRET=your-custom-token \
  -e DB_NAME=custom_db_name \
  --name cobbler-crm \
  cobbler-crm
```

---

## Option 2: Local Development (Traditional)

### Prerequisites
- **Node.js 18+** installed
- **MySQL 8** installed and running

### 2.1 Database Setup
```bash
# Start MySQL
brew services start mysql  # macOS
# OR
sudo systemctl start mysql  # Linux

# Create database
mysql -u root -p
```

```sql
CREATE DATABASE cobbler_crm;
CREATE USER 'cobbler_user'@'localhost' IDENTIFIED BY 'your_password';
GRANT ALL PRIVILEGES ON cobbler_crm.* TO 'cobbler_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

### 2.2 Backend Setup
```bash
cd backend
npm install

# Copy and edit environment file
cp .env.example .env
# Edit .env with your database credentials
```

```bash
# Required in backend/.env
DB_HOST=localhost
DB_PORT=3306
DB_USER=cobbler_user
DB_PASSWORD=your_password
DB_NAME=cobbler_crm
X_TOKEN_SECRET=cobbler_super_secret_token_2024
PORT=3001
NODE_ENV=development
```

```bash
# Start backend
npm run dev  # Development with auto-restart
# OR
npm run build && npm start  # Production
```

### 2.3 Frontend Setup
```bash
# From project root
npm install

# Create frontend environment
cat > src/.env.local << EOF
VITE_API_BASE_URL=http://localhost:3001
VITE_X_TOKEN=cobbler_super_secret_token_2024
EOF

# Start frontend
npm run dev  # Development server on port 5173
```

### 2.4 Access Application
- **Frontend**: http://localhost:5173 (dev) or http://localhost:8080 (preview)
- **Backend API**: http://localhost:3001/api
- **Health Check**: http://localhost:3001/health

---

## 🔧 Common Commands

### Docker Commands
```bash
# View running containers
docker ps

# View all containers
docker ps -a

# View logs
docker logs cobbler-crm

# Follow logs in real-time
docker logs -f cobbler-crm

# Execute commands inside container
docker exec -it cobbler-crm bash

# Remove container
docker stop cobbler-crm && docker rm cobbler-crm

# Remove image
docker rmi cobbler-crm

# Rebuild and restart
docker stop cobbler-crm && docker rm cobbler-crm
docker build -t cobbler-crm .
docker run -d -p 3001:3001 --name cobbler-crm cobbler-crm
```

### Development Commands
```bash
# Backend development
cd backend
npm run dev      # Start with auto-restart
npm run build    # Build TypeScript
npm run start    # Start production build

# Frontend development
npm run dev      # Development server
npm run build    # Production build
npm run preview  # Preview production build
```

### Database Commands (Docker)
```bash
# Access MySQL inside container
docker exec -it cobbler-crm mysql -u root cobbler_crm

# View tables
docker exec -it cobbler-crm mysql -u root cobbler_crm -e "SHOW TABLES;"

# View enquiries
docker exec -it cobbler-crm mysql -u root cobbler_crm -e "SELECT * FROM enquiries LIMIT 10;"
```

---

## 🛠️ Troubleshooting

### Docker Issues
```bash
# Container won't start
docker logs cobbler-crm  # Check logs for errors

# Port already in use
docker ps  # Find conflicting container
docker stop <container-name>

# Build fails
docker system prune  # Clean up Docker cache
docker build --no-cache -t cobbler-crm .
```

### Application Issues
```bash
# Health check fails
curl http://localhost:3001/health

# API authentication fails
# Check X-Token header matches X_TOKEN_SECRET

# Frontend won't load
# Ensure port 3001 is accessible
# Check Docker container is running
```

### Database Issues (Docker)
```bash
# Check if MySQL is running inside container
docker exec -it cobbler-crm ps aux | grep mysql

# Check MySQL logs
docker exec -it cobbler-crm tail -f /var/lib/mysql/*.err

# Reset database (careful!)
docker stop cobbler-crm && docker rm cobbler-crm
docker build -t cobbler-crm .
docker run -d -p 3001:3001 --name cobbler-crm cobbler-crm
```

---

## 🚀 Production Deployment

### Local Testing
```bash
# Test production build locally
docker build -t cobbler-crm .
docker run -d -p 3001:3001 --name cobbler-test cobbler-crm

# Test all endpoints
curl http://localhost:3001/health
curl -H "X-Token: cobbler_super_secret_token_2024" http://localhost:3001/api/enquiries

# Cleanup
docker stop cobbler-test && docker rm cobbler-test
```

### Deploy to Render.com
1. **Push to GitHub**: Commit and push your code
2. **Create Web Service**: Connect GitHub repo
3. **Select Docker**: Choose Docker environment
4. **Deploy**: Render builds and deploys automatically
5. **Access**: Your app at `https://your-app.onrender.com`

See `RENDER_DEPLOYMENT.md` for detailed deployment instructions.

---

## 📊 Application Features

### What's Included
- ✅ **Customer Enquiry Management**
- ✅ **Workflow Stages**: enquiry → pickup → service → billing → delivery → completed
- ✅ **Image Storage**: Photos stored in database
- ✅ **Search and Filter**: Find enquiries easily
- ✅ **Statistics Dashboard**: Track performance
- ✅ **Authentication**: X-Token security
- ✅ **Real-time Updates**: 30-second polling

### Default Credentials
- **API Token**: `cobbler_super_secret_token_2024`
- **Database**: Empty password (secure inside container)

### Customization
- **Change Token**: Set `X_TOKEN_SECRET` environment variable
- **Database Name**: Set `DB_NAME` environment variable
- **Logging**: Configure `LOG_LEVEL`, `LOG_MAX_SIZE`

---

## 🎯 Next Steps

1. **Start Adding Data**: Use the frontend to add enquiries
2. **Customize Authentication**: Change `X_TOKEN_SECRET` for security
3. **Test All Features**: Try all workflow stages
4. **Deploy to Production**: Use Render.com or your preferred platform
5. **Monitor Performance**: Check health endpoint and logs
6. **Backup Strategy**: Consider data export/import for backups

## 📞 Support

- **Documentation**: Check `setup.md` for detailed instructions
- **Deployment**: See `RENDER_DEPLOYMENT.md` for production deployment
- **Logs**: Use `docker logs cobbler-crm` to troubleshoot
- **Health Check**: Monitor `http://localhost:3001/health`