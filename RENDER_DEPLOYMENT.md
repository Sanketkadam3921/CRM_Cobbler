# Render.com Deployment Guide - Self-Contained Docker

This guide covers deploying the **fully self-contained** Cobbler CRM application to Render.com. The application includes **MySQL database inside the Docker container** - no external database required!

## 🚀 Quick Deploy Summary

- ✅ **No external database needed** - MySQL runs inside container
- ✅ **Single Docker container** - everything included
- ✅ **Auto-schema creation** - database tables created automatically
- ✅ **Production ready** - security, logging, health checks included

## Prerequisites

- **Render.com account** (free tier available)
- **GitHub repository** with your code
- **No MySQL setup required** ✅

## Step 1: Repository Preparation

### 1.1 Required Files (✅ Already Included)
Your repository contains:
- ✅ `Dockerfile` (multi-stage build with MySQL)
- ✅ `start.sh` (MySQL initialization script)
- ✅ `.dockerignore` (optimized build)
- ✅ Frontend and backend source code

### 1.2 Default Configuration
The application works with **built-in defaults**:
- **Database**: MySQL inside container, empty password
- **Authentication**: `cobbler_super_secret_token_2024`
- **Port**: 3001
- **Schema**: Auto-created on startup

## Step 2: Deploy to Render

### 2.1 Create Web Service

1. **Connect Repository:**
   - Go to Render Dashboard
   - Click "New" → "Web Service"
   - Connect your GitHub repository
   - Select the repository

2. **Configure Service:**
   ```
   Name: cobbler-crm
   Environment: Docker
   Region: Choose closest to you
   Branch: main (or your default branch)
   Root Directory: . (leave empty for root)
   ```

3. **Build & Deploy Settings:**
   ```
   Build Command: (leave empty - Docker handles this)
   Start Command: (leave empty - Docker handles this)
   ```

### 2.2 Environment Variables (Optional)

The application works with defaults, but you can customize:

```bash
# Optional Customization
X_TOKEN_SECRET=your-custom-secure-token
DB_NAME=cobbler_crm
NODE_ENV=production
PORT=3001

# Optional Logging
LOG_LEVEL=info
LOG_MAX_SIZE=20m
LOG_MAX_FILES=14d
```

**Note**: Database credentials are handled automatically inside the container!

### 2.3 Advanced Settings

1. **Health Check Path:** `/health` (automatic)
2. **Auto-Deploy:** Enabled (recommended)
3. **Plan:** Free (or paid for better performance)

## Step 3: What Happens During Deployment

### 3.1 Automatic Build Process
1. **Frontend Build**: React app built with Vite
2. **Backend Build**: TypeScript compiled to JavaScript
3. **Docker Image**: Multi-stage build creates optimized container
4. **MySQL Setup**: Database server installed in container

### 3.2 Automatic Startup Process
```bash
🚀 Starting Cobbler CRM with MySQL...
📦 Initializing MySQL data directory...
✅ MySQL data directory initialized
📝 Creating MySQL configuration...
🔄 Starting MySQL server...
✅ MySQL is ready!
🗄️ Setting up database and users...
✅ Database setup complete!
✅ Database connection successful!
🚀 Starting Cobbler CRM application...
🚀 Cobbler Backend API server is running on port 3001
```

### 3.3 Schema Auto-Creation
These tables are created automatically:
- `enquiries` - Main customer enquiry data
- `pickup_details` - Pickup scheduling information
- `service_details` - Service work details
- `service_types` - Available service types
- `photos` - Image storage (base64 in MySQL)
- `delivery_details` - Delivery information
- `billing_details` - Billing and payment info
- `billing_items` - Individual billing line items
- `users` - User management (future use)

## Step 4: Test Your Application

### 4.1 Your URLs
After deployment, you'll get:
- **Frontend**: `https://your-app-name.onrender.com`
- **API**: `https://your-app-name.onrender.com/api`
- **Health**: `https://your-app-name.onrender.com/health`

### 4.2 Test Endpoints
```bash
# Health Check
curl https://your-app-name.onrender.com/health
# Expected: {"success":true,"message":"Cobbler Backend API is running"}

# API Test (with authentication)
curl -H "X-Token: cobbler_super_secret_token_2024" \
     https://your-app-name.onrender.com/api/enquiries
# Expected: {"success":true,"data":{"data":[],"total":0}}
```

## Step 5: Monitoring and Logs

### 5.1 View Logs
- Go to your Render service
- Click "Logs" tab
- Look for success indicators:
  ```
  ✅ MySQL is ready!
  ✅ Database connection successful!
  🚀 Cobbler Backend API server is running on port 3001
  ```

### 5.2 Health Monitoring
- Render automatically monitors your `/health` endpoint
- Service will restart if health checks fail
- Built-in Docker health check included

## Step 6: Local Testing

### 6.1 Test Before Deploy
```bash
# Build locally
docker build -t cobbler-crm .

# Run locally
docker run -d -p 3001:3001 --name test-cobbler cobbler-crm

# Test endpoints
curl http://localhost:3001/health
curl -H "X-Token: cobbler_super_secret_token_2024" http://localhost:3001/api/enquiries

# View logs
docker logs test-cobbler

# Cleanup
docker stop test-cobbler && docker rm test-cobbler
```

## Troubleshooting

### Common Issues

#### Build Failures
```bash
# Test Docker build locally first
docker build -t cobbler-crm .

# Check for missing files
git status
```

#### Startup Issues
- Check logs for MySQL initialization errors
- Ensure sufficient memory (upgrade from free tier if needed)
- Verify Docker health check is passing

#### Connection Issues
- Everything runs inside container - no external connections needed
- Check if health endpoint responds
- Monitor startup logs for database initialization

### Success Patterns in Logs
```bash
✅ MySQL is ready!
✅ Database setup complete!
✅ Database connection successful!
🚀 Starting Cobbler CRM application...
🚀 Cobbler Backend API server is running on port 3001
```

## Advanced Configuration

### Custom Domain
1. Add custom domain in Render dashboard
2. Configure DNS as instructed
3. SSL automatically provided
4. Update `X_TOKEN_SECRET` if desired

### Performance Optimization
- **Free Tier**: 512MB RAM, may sleep after inactivity
- **Paid Tier**: Always-on, more RAM, better performance
- **Database**: Local MySQL = fast access, no network latency

## Security & Credentials

### 🔐 How Credentials Are Stored

#### Database Credentials
- **Location**: Inside Docker container only
- **Root Password**: Empty (secure inside container)
- **Database**: `cobbler_crm` (auto-created)
- **Access**: Only from within container
- **Security**: Container isolation provides security

#### API Authentication
- **Default Token**: `cobbler_super_secret_token_2024`
- **Location**: Environment variable in container
- **Customization**: Set `X_TOKEN_SECRET` in Render environment variables
- **Usage**: Frontend sends as `X-Token` header

#### Frontend Environment
- **API URL**: Automatically configured for Render domain
- **Token**: Matches backend token
- **Storage**: Environment variables, not in code

### Security Features
- **Container Isolation**: Database only accessible from within container
- **HTTPS**: Automatic SSL on Render
- **CORS**: Configured for your domain
- **Rate Limiting**: Built-in protection
- **Security Headers**: Helmet.js protection

## Cost & Performance

### Render Pricing
- **Free Tier**: 750 hours/month (sleeps after inactivity)
- **Production**: $7/month (always-on, better performance)
- **No database costs** - everything included in container!

### Performance Benefits
- **Local Database**: No network latency
- **Single Container**: Simplified deployment
- **Optimized Build**: Multi-stage Docker build

## Deployment Checklist

- [ ] Code pushed to GitHub
- [ ] Render Web Service created
- [ ] Docker environment selected
- [ ] Optional: Custom `X_TOKEN_SECRET` environment variable set
- [ ] Deploy button clicked
- [ ] Build logs show success
- [ ] Health check passing at `/health`
- [ ] Frontend accessible at your Render URL
- [ ] API endpoints working with authentication

## 🎉 Success!

Your fully self-contained Cobbler CRM is now running on Render with:
- ✅ **MySQL database** inside container
- ✅ **Automatic schema creation**
- ✅ **Frontend serving** on your Render URL
- ✅ **API endpoints** with authentication
- ✅ **Health monitoring** and auto-restart
- ✅ **Production security** and logging

**No external dependencies, no complex setup - just deploy and use!**

---

## Support Resources

- **Render Documentation**: https://render.com/docs
- **Docker Best Practices**: https://docs.docker.com/develop/best-practices/
- **Application Logs**: Available in Render dashboard
- **Health Check**: Monitor at `https://your-app.onrender.com/health`