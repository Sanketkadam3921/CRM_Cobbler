# Render Environment Variables Setup

## Required Environment Variables for Render Deployment

Set these environment variables in your Render service dashboard:

### Backend Environment Variables

```bash
# Database Configuration (if using external MySQL)
DB_HOST=your-mysql-host
DB_PORT=3306
DB_USER=your-mysql-user
DB_PASSWORD=your-mysql-password
DB_NAME=cobbler_db

# Authentication
X_TOKEN_SECRET=cobbler_super_secret_token_2024

# Application Settings
NODE_ENV=production
PORT=3001

# Logging
LOG_LEVEL=info
```

### Frontend Environment Variables (if needed)

```bash
# API Configuration (optional - auto-detected)
VITE_API_BASE_URL=https://your-app-name.onrender.com/api

# Authentication Token (should match X_TOKEN_SECRET)
VITE_X_TOKEN=cobbler_super_secret_token_2024
```

## How to Set Environment Variables in Render

1. Go to your Render dashboard
2. Select your web service
3. Go to the "Environment" tab
4. Click "Add Environment Variable"
5. Add each variable from the list above

## Default Values

If you don't set these variables, the app will use these defaults:

- `X_TOKEN_SECRET`: `cobbler_super_secret_token_2024`
- `VITE_X_TOKEN`: `cobbler_super_secret_token_2024`
- `API_BASE_URL`: Auto-detected based on current domain

## Security Note

For production deployment, you should change the default token to a secure, unique value:

```bash
X_TOKEN_SECRET=your-unique-secure-token-here
VITE_X_TOKEN=your-unique-secure-token-here
```

## Testing the Deployment

After setting up the environment variables and deploying:

1. Test health endpoint:
   ```bash
   curl https://your-app-name.onrender.com/health
   ```

2. Test API health endpoint:
   ```bash
   curl https://your-app-name.onrender.com/api/health
   ```

3. Test API with authentication:
   ```bash
   curl -H "X-Token: cobbler_super_secret_token_2024" \
        https://your-app-name.onrender.com/api/enquiries/stats
   ```

All endpoints should return successful responses.
