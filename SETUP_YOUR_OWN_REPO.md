# Set Up Your Own GitHub Repository and Deploy to Vercel

Follow these steps to create your own GitHub repo and deploy to Vercel.

## Step 1: Create Your Own GitHub Repository

1. **Go to GitHub**
   - Visit [github.com](https://github.com)
   - Sign in or create an account

2. **Create New Repository**
   - Click the **"+"** icon → **"New repository"**
   - **Repository name**: `kalshi-insider-trading` (or your choice)
   - **Description**: "Kalshi Insider Trading Detection App"
   - **Visibility**: Choose Public or Private
   - **DO NOT** initialize with README, .gitignore, or license (we already have these)
   - Click **"Create repository"**

3. **Copy the Repository URL**
   - GitHub will show you the URL, something like:
   - `https://github.com/YOUR_USERNAME/kalshi-insider-trading.git`
   - Copy this URL

## Step 2: Update Remote in Your Local Repository

Open PowerShell in the cloned directory and run:

```powershell
cd C:\Users\omers\DH12-clone

# Remove the old remote (your friend's repo)
git remote remove origin

# Add your new repository as origin
git remote add origin https://github.com/YOUR_USERNAME/kalshi-insider-trading.git

# Verify it's set correctly
git remote -v
```

Replace `YOUR_USERNAME` with your actual GitHub username.

## Step 3: Push to Your Repository

```powershell
# Make sure you're on the main branch
git checkout main

# Push all code to your repository
git push -u origin main
```

If you get authentication errors, you may need to:
- Use a Personal Access Token instead of password
- Or set up SSH keys

## Step 4: Deploy to Vercel

1. **Go to Vercel**
   - Visit [vercel.com](https://vercel.com)
   - Sign up or log in (use GitHub to sign in)

2. **Import Your Repository**
   - Click **"Add New..."** → **"Project"**
   - Click **"Import Git Repository"**
   - Select **"GitHub"** and authorize if needed
   - Find and select: **`YOUR_USERNAME/kalshi-insider-trading`**
   - Click **"Import"**

3. **Configure Project**
   - **Project Name**: `kalshi-insider-trading` (or your choice)
   - **Root Directory**: Leave as `.` (root)
   - **Framework Preset**: Vercel will auto-detect (React/Vite)
   - **Build Command**: `cd frontend && npm install && npm run build`
   - **Output Directory**: `frontend/dist`
   - **Install Command**: Leave empty

4. **Add Environment Variables** (BEFORE clicking Deploy)
   - Click **"Environment Variables"** section
   - Add each variable:

   ```
   GEMINI_API_KEY = your_gemini_api_key
   MONGODB_URI = your_mongodb_uri
   MONGODB_DB_NAME = kalshi-detector
   MOORCHEH_API_KEY = your_moorcheh_key
   MOORCHEH_SERVICE_URL = https://placeholder.railway.app (update after Python service)
   NODE_ENV = production
   ```

   Select all environments (Production, Preview, Development) for each.

5. **Deploy**
   - Click **"Deploy"**
   - Wait for deployment to complete (2-3 minutes)

## Step 5: Deploy Python Service

### Option A: Railway (Recommended)

1. **Go to Railway**
   - Visit [railway.app](https://railway.app)
   - Sign up with GitHub

2. **Create New Project**
   - Click **"New Project"**
   - Select **"Deploy from GitHub repo"**
   - Choose your repository: `YOUR_USERNAME/kalshi-insider-trading`

3. **Configure Service**
   - Click on the service
   - Go to **Settings** tab
   - Set **Root Directory**: `backend/services/python-service`
   - Go to **Variables** tab
   - Add: `MOORCHEH_API_KEY` = your key
   - Add: `PORT` = `8000`

4. **Deploy**
   - Railway will auto-detect Python
   - Wait for deployment

5. **Get Service URL**
   - Go to **Settings** → **Networking**
   - Copy the **Public Domain**

6. **Update Vercel**
   - Go back to Vercel dashboard
   - Settings → Environment Variables
   - Update `MOORCHEH_SERVICE_URL` with Railway URL
   - Go to Deployments → Click latest → Redeploy

## Step 6: Test Everything

1. Visit your Vercel URL: `https://your-app.vercel.app`
2. Test health endpoint: `https://your-app.vercel.app/api/health`
3. Test full flow: Try analyzing a market

## Troubleshooting

### Git Push Authentication Issues

If you get authentication errors:

**Option 1: Use Personal Access Token**
1. GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Generate new token with `repo` permissions
3. Use token as password when pushing

**Option 2: Use SSH**
1. Generate SSH key: `ssh-keygen -t ed25519 -C "your_email@example.com"`
2. Add to GitHub: Settings → SSH and GPG keys → New SSH key
3. Change remote: `git remote set-url origin git@github.com:YOUR_USERNAME/kalshi-insider-trading.git`

### Vercel Build Fails

- Check build logs in Vercel dashboard
- Verify all environment variables are set
- Check that `vercel.json` exists in root

### API Not Working

- Check Vercel function logs
- Verify `api/index.js` exists
- Test health endpoint first

## Quick Commands Reference

```powershell
# Navigate to your cloned repo
cd C:\Users\omers\DH12-clone

# Check current remote
git remote -v

# Remove old remote
git remote remove origin

# Add your new remote (replace with your username)
git remote add origin https://github.com/YOUR_USERNAME/kalshi-insider-trading.git

# Push to your repo
git push -u origin main
```

## Next Steps After Deployment

1. ✅ Code is in your own GitHub repo
2. ✅ Deployed to Vercel
3. ✅ Python service on Railway/Render
4. ✅ All environment variables set
5. ✅ Test everything works

Your app is now live and you have full control! 🚀
