# Deployment Troubleshooting Guide

## Current Issue
App works locally but fails on Vercel deployment.

## Common Vercel Serverless Function Issues

### 1. Missing Dependencies
✅ **Fixed**: Added all backend dependencies to root `package.json`

### 2. Path Resolution Issues
The backend uses relative imports (`./services/...`) which should work, but Vercel might have issues.

### 3. Environment Variables
Make sure these are set in Vercel Dashboard → Settings → Environment Variables:
- `NODE_ENV=production`
- `GEMINI_API_KEY` (optional)
- `MONGODB_URI` (optional)
- `MOORCHEH_API_KEY` (optional)
- `MOORCHEH_SERVICE_URL` (optional)

### 4. File Structure
Vercel needs to include the `backend/` directory in the deployment.

## Next Steps

1. **Check Vercel Function Logs**:
   - Go to Vercel Dashboard → Your Project → Deployments
   - Click on latest deployment → Functions tab
   - Click on `/api/index.js` to see detailed error logs

2. **Verify Environment Variables**:
   - Settings → Environment Variables
   - Make sure all are set for Production environment

3. **Check Build Logs**:
   - Look for any warnings about missing files or modules

## What We Need From You

Please share:
1. **Exact console error messages** from browser DevTools
2. **Vercel function logs** (from Functions tab)
3. **Any build warnings** from deployment logs

This will help identify the exact issue.
