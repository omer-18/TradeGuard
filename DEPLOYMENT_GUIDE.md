# Complete Deployment Guide

This guide will help you deploy the Kalshi Insider Trading Detection app to Vercel (frontend + backend) and Railway (Python service).

## Prerequisites

1. **GitHub Account** - For hosting your repository
2. **Vercel Account** - For frontend and backend deployment
3. **Railway Account** - For Python service deployment
4. **MongoDB Atlas Account** (optional) - For database
5. **API Keys:**
   - Gemini API Key (for AI chat)
   - Moorcheh API Key (for semantic search)
   - MongoDB URI (optional)

## Step 1: Prepare Your Repository

1. **Push your code to GitHub:**
   ```powershell
   git add .
   git commit -m "Prepare for deployment"
   git push origin main
   ```

2. **Verify your repository structure:**
   - `backend/` - Node.js Express server
   - `frontend/` - React/Vite frontend
   - `api/` - Vercel serverless function wrapper
   - `vercel.json` - Vercel configuration
   - `package.json` - Root package.json

## Step 2: Deploy Backend + Frontend to Vercel

### 2.1 Create Vercel Project

1. Go to [vercel.com](https://vercel.com) and sign in with GitHub
2. Click **"Add New..."** → **"Project"**
3. Click **"Import Git Repository"**
4. Select your repository: `YOUR_USERNAME/kalshi-insider-trading`
5. Click **"Import"**

### 2.2 Configure Build Settings

**Project Settings:**
- **Framework Preset:** Other
- **Root Directory:** `./` (root)
- **Build Command:** `cd frontend && npm install && npm run build`
- **Output Directory:** `frontend/dist`
- **Install Command:** `npm install` (leave default)

### 2.3 Add Environment Variables

Go to **Settings** → **Environment Variables** and add:

```env
# Required
NODE_ENV=production

# Gemini AI (for chat feature)
GEMINI_API_KEY=your_gemini_api_key_here

# MongoDB (optional - for data persistence)
MONGODB_URI=your_mongodb_connection_string
MONGODB_DB_NAME=kalshi-detector

# Moorcheh (for semantic search - update after Railway deployment)
MOORCHEH_API_KEY=your_moorcheh_api_key
MOORCHEH_SERVICE_URL=https://your-railway-app.railway.app

# Kalshi API (optional - only needed for authenticated endpoints)
KALSHI_API_KEY_ID=your_kalshi_key_id
KALSHI_PRIVATE_KEY_PEM=your_private_key_pem
```

**Important:** 
- Select **all environments** (Production, Preview, Development) for each variable
- The `MOORCHEH_SERVICE_URL` will be updated in Step 3 after Railway deployment

### 2.4 Deploy

1. Click **"Deploy"**
2. Wait 2-3 minutes for the build to complete
3. Your app will be available at `https://your-app.vercel.app`

### 2.5 Verify Deployment

- Visit: `https://your-app.vercel.app`
- Test API: `https://your-app.vercel.app/api/health`
- Should return: `{"status":"ok",...}`

## Step 3: Deploy Python Service to Railway

### 3.1 Create Railway Project

1. Go to [railway.app](https://railway.app) and sign in with GitHub
2. Click **"New Project"**
3. Select **"Deploy from GitHub repo"**
4. Choose your repository: `YOUR_USERNAME/kalshi-insider-trading`

### 3.2 Configure Service

1. Click on the service → **Settings**
2. **Root Directory:** `backend/services/python-service`
3. **Start Command:** `uvicorn main:app --host 0.0.0.0 --port $PORT`

### 3.3 Add Environment Variables

Go to **Variables** tab and add:

```env
MOORCHEH_API_KEY=your_moorcheh_api_key
PORT=8000
```

### 3.4 Get Public Domain

1. Go to **Settings** → **Networking**
2. Click **"Generate Domain"** or use the provided domain
3. Copy the **Public Domain** (e.g., `https://your-app.railway.app`)

### 3.5 Update Vercel Environment Variable

1. Go back to Vercel
2. **Settings** → **Environment Variables**
3. Update `MOORCHEH_SERVICE_URL` with your Railway domain
4. **Redeploy** the Vercel project

## Step 4: Test Everything

### 4.1 Test Frontend
- Visit: `https://your-app.vercel.app`
- Should load the homepage
- Search should work

### 4.2 Test Backend API
```bash
# Health check
curl https://your-app.vercel.app/api/health

# Search endpoint
curl https://your-app.vercel.app/api/search?limit=10

# Suggestions
curl https://your-app.vercel.app/api/suggestions
```

### 4.3 Test Python Service
```bash
# Health check
curl https://your-railway-app.railway.app/health

# Root endpoint
curl https://your-railway-app.railway.app/
```

## Troubleshooting

### Issue: 404 errors on `/api/*` endpoints

**Solution:**
1. Verify `vercel.json` exists in root
2. Check that `api/index.js` exists
3. Ensure `serverless-http` is in `backend/package.json` dependencies
4. Check Vercel build logs for errors

### Issue: Frontend can't connect to backend

**Solution:**
1. Verify environment variables are set in Vercel
2. Check that `NODE_ENV=production` is set
3. Check Vercel function logs: **Deployments** → **Functions** tab

### Issue: Python service not responding

**Solution:**
1. Check Railway logs: **Deployments** → **View Logs**
2. Verify `MOORCHEH_API_KEY` is set
3. Verify root directory is `backend/services/python-service`
4. Check that `requirements.txt` exists

### Issue: MongoDB connection errors

**Solution:**
1. MongoDB is optional - app works without it
2. If using MongoDB, verify `MONGODB_URI` is correct
3. Check MongoDB Atlas network access settings

### Issue: Chrome extension errors (overlay.js)

**Solution:**
- These are browser extension errors, not your app
- Users can ignore them or disable extensions
- Not fixable in your codebase

## Environment Variables Reference

### Required
- `NODE_ENV=production` - Environment mode

### Optional but Recommended
- `GEMINI_API_KEY` - For AI chat feature
- `MOORCHEH_API_KEY` - For semantic search
- `MOORCHEH_SERVICE_URL` - Railway service URL
- `MONGODB_URI` - Database connection (optional)
- `MONGODB_DB_NAME` - Database name (default: kalshi-detector)

### Optional
- `KALSHI_API_KEY_ID` - Only for authenticated Kalshi endpoints
- `KALSHI_PRIVATE_KEY_PEM` - Only for authenticated Kalshi endpoints

## File Structure for Deployment

```
your-repo/
├── api/
│   └── index.js          # Vercel serverless wrapper
├── backend/
│   ├── server.js         # Express app (exports app)
│   ├── package.json      # Backend dependencies
│   └── ...
├── frontend/
│   ├── dist/            # Build output (generated)
│   ├── package.json      # Frontend dependencies
│   └── ...
├── vercel.json          # Vercel configuration
└── package.json         # Root package.json
```

## Next Steps

1. ✅ Deploy to Vercel
2. ✅ Deploy Python service to Railway
3. ✅ Set environment variables
4. ✅ Test all endpoints
5. ✅ Share your deployed app!

## Support

If you encounter issues:
1. Check Vercel deployment logs
2. Check Railway deployment logs
3. Verify all environment variables are set
4. Test endpoints individually with curl/Postman
