# Quick Setup Guide - Your Own GitHub Repo & Vercel Deployment

## ✅ Step 1: Create Your GitHub Repository

1. Go to [github.com/new](https://github.com/new)
2. Repository name: `kalshi-insider-trading` (or your choice)
3. Choose Public or Private
4. **DO NOT** check "Initialize with README"
5. Click **"Create repository"**
6. **Copy the repository URL** (you'll need it in Step 2)

## ✅ Step 2: Update Git Remote

Open PowerShell in `C:\Users\omers\DH12-clone` and run:

```powershell
# Remove your friend's remote
git remote remove origin

# Add your new repository (REPLACE YOUR_USERNAME with your GitHub username)
git remote add origin https://github.com/YOUR_USERNAME/kalshi-insider-trading.git

# Verify it's correct
git remote -v
```

## ✅ Step 3: Push to Your Repository

```powershell
# Push all code to your repo
git push -u origin main
```

**If you get authentication errors:**
- GitHub no longer accepts passwords
- You'll need a **Personal Access Token**:
  1. Go to: GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
  2. Generate new token with `repo` permission
  3. Use the token as your password when pushing

## ✅ Step 4: Deploy to Vercel

1. **Go to [vercel.com](https://vercel.com)** and sign in with GitHub

2. **Import Project:**
   - Click **"Add New..."** → **"Project"**
   - Click **"Import Git Repository"**
   - Find: **`YOUR_USERNAME/kalshi-insider-trading`**
   - Click **"Import"**

3. **Configure:**
   - **Framework Preset:** Other
   - **Root Directory:** `./` (root)
   - **Build Command**: `cd frontend && npm install && npm run build`
   - **Output Directory**: `frontend/dist`
   - **Install Command:** `npm install` (default)
   
   **Note:** The `vercel.json` file is already configured to handle API routes automatically.

4. **Add Environment Variables** (click "Environment Variables" section):
   ```
   GEMINI_API_KEY = (your key)
   MONGODB_URI = (your MongoDB connection string)
   MONGODB_DB_NAME = kalshi-detector
   MOORCHEH_API_KEY = (your key)
   MOORCHEH_SERVICE_URL = https://placeholder.railway.app
   NODE_ENV = production
   ```
   - Select all environments (Production, Preview, Development) for each

5. **Click "Deploy"** and wait 2-3 minutes

## ✅ Step 5: Deploy Python Service (Railway)

1. **Go to [railway.app](https://railway.app)** and sign in with GitHub

2. **New Project** → **Deploy from GitHub repo**
   - Select: `YOUR_USERNAME/kalshi-insider-trading`

3. **Configure:**
   - Click service → **Settings**
   - **Root Directory**: `backend/services/python-service`
   - **Variables** tab:
     - `MOORCHEH_API_KEY` = (your key)
     - `PORT` = `8000`

4. **Get URL:**
   - Settings → Networking → Copy **Public Domain**

5. **Update Vercel:**
   - Go back to Vercel
   - Settings → Environment Variables
   - Update `MOORCHEH_SERVICE_URL` with Railway URL
   - Redeploy

## ✅ Step 6: Test

- Visit: `https://your-app.vercel.app`
- Test: `https://your-app.vercel.app/api/health`

## 🎉 Done!

Your app is now:
- ✅ In your own GitHub repo
- ✅ Deployed to Vercel
- ✅ Python service on Railway
- ✅ Fully functional!
