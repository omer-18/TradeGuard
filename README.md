# Kalshi Insider Trading Detection

A full-stack application for analyzing Kalshi market data and detecting potential insider trading patterns using AI-powered analysis.

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18 or higher) - [Download](https://nodejs.org/)
- **Python** (v3.8 or higher) - [Download](https://www.python.org/downloads/)
- **MongoDB** - Either:
  - MongoDB Atlas account (cloud) - [Sign up](https://www.mongodb.com/cloud/atlas)
  - Local MongoDB installation
- **npm** (comes with Node.js)

## Quick Start

### 1. Clone the Repository

```bash
git clone <repository-url>
cd DH12
```

### 2. Install Dependencies

#### Backend (Node.js)
```bash
cd backend
npm install
cd ..
```

#### Frontend (React + Vite)
```bash
cd frontend
npm install
cd ..
```

#### Moorcheh Python Service
```bash
cd backend/services/python-service
pip install -r requirements.txt
cd ../../..
```

**Note:** It's recommended to use a Python virtual environment:
```bash
cd backend/services/python-service
python -m venv venv

# On Windows (PowerShell):
.\venv\Scripts\Activate.ps1

# On macOS/Linux:
source venv/bin/activate

pip install -r requirements.txt
cd ../../..
```

### 3. Set Up Environment Variables

Create a `.env` file in the `backend` directory with the following variables:

```env
# Required: Gemini AI API Key
GEMINI_API_KEY=your_gemini_api_key_here

# Required: MongoDB Connection
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/kalshi-detector?appName=YourApp
MONGODB_DB_NAME=kalshi-detector

# Required: Moorcheh API Key
MOORCHEH_API_KEY=your_moorcheh_api_key_here

# Optional: Kalshi API (for live trading data)
KALSHI_API_KEY_ID=your_kalshi_key
KALSHI_PRIVATE_KEY_PATH=path/to/private_key.pem
# OR
KALSHI_PRIVATE_KEY_PEM=-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----

# Optional: Service Ports (defaults shown)
PORT=3001
MOORCHEH_SERVICE_URL=http://localhost:8000
```

**Where to get API keys:**
- **Gemini API Key**: [Google AI Studio](https://makersuite.google.com/app/apikey)
- **MongoDB URI**: Create a free cluster at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
- **Moorcheh API Key**: Sign up at [Moorcheh](https://moorcheh.com) (or your Moorcheh provider)
- **Kalshi API**: [Kalshi Developer Portal](https://trading-api.kalshi.com/) (optional, for live trading)

### 4. Verify Environment Setup

Check that your environment variables are set correctly:

```bash
cd backend
node check-env.js
```

This will verify that `MONGODB_URI` and `MONGODB_DB_NAME` are configured.

## Running the Application

You need **3 separate terminals** to run all services:

### Terminal 1: Backend Server

```bash
cd backend
npm start
```

The backend will start on `http://localhost:3001` (or the port specified in your `.env` file).

**Expected output:**
```
✅ MongoDB connected successfully
🚀 Server running on port 3001
```

### Terminal 2: Frontend Development Server

```bash
cd frontend
npm run dev
```

The frontend will start on `http://localhost:3000` and automatically open in your browser.

**Expected output:**
```
  VITE v5.x.x  ready in xxx ms

  ➜  Local:   http://localhost:3000/
  ➜  Network: use --host to expose
```

### Terminal 3: Moorcheh Python Service

#### Option A: Using the startup script (Recommended)

**Windows (PowerShell):**
```bash
cd backend/services/python-service
.\start.ps1
```

**macOS/Linux:**
```bash
cd backend/services/python-service
chmod +x start.sh
./start.sh
```

#### Option B: Manual startup

**If using a virtual environment:**
```bash
cd backend/services/python-service

# Activate virtual environment
# Windows:
.\venv\Scripts\Activate.ps1
# macOS/Linux:
source venv/bin/activate

# Start the service
python main.py
```

**If not using a virtual environment:**
```bash
cd backend/services/python-service
python main.py
```

The Moorcheh service will start on `http://localhost:8000`.

**Expected output:**
```
[OK] Moorcheh client initialized successfully
INFO:     Started server process
INFO:     Uvicorn running on http://0.0.0.0:8000
```

## Accessing the Application

1. Open your browser and navigate to: **http://localhost:3000**
2. Click the **"🤖 AI Assistant"** button in the header to open the chat interface
3. Start analyzing markets!

## Service Ports

- **Frontend**: `http://localhost:3000`
- **Backend API**: `http://localhost:3001`
- **Moorcheh Service**: `http://localhost:8000`

## Troubleshooting

### Backend won't start
- Check that MongoDB connection string is correct in `.env`
- Verify `GEMINI_API_KEY` is set
- Ensure port 3001 is not in use by another application

### Frontend won't connect to backend
- Verify backend is running on port 3001
- Check browser console for CORS errors
- Ensure `vite.config.js` proxy settings are correct

### Moorcheh service fails
- Verify `MOORCHEH_API_KEY` is set in `.env` file (in `backend` directory)
- Check that Python dependencies are installed: `pip install -r requirements.txt`
- Ensure port 8000 is not in use

### MongoDB connection issues
- Verify your MongoDB URI is correct
- Check that your IP is whitelisted in MongoDB Atlas (if using cloud)
- Test connection with: `node backend/check-env.js`

## Project Structure

```
DH12/
├── backend/                 # Node.js Express API
│   ├── db/                 # MongoDB connection
│   ├── models/             # Database models
│   ├── services/           # Business logic
│   │   └── python-service/ # Moorcheh Python microservice
│   ├── server.js           # Main server file
│   └── .env               # Environment variables (create this)
├── frontend/               # React + Vite frontend
│   ├── src/
│   │   ├── components/     # React components
│   │   └── utils/         # Utility functions
│   └── vite.config.js     # Vite configuration
└── README.md              # This file
```

## Development

### Backend Development Mode (with auto-reload)
```bash
cd backend
npm run dev
```

### Frontend Build for Production
```bash
cd frontend
npm run build
npm run preview  # Preview production build
```

## Additional Resources

- [MongoDB Setup Guide](./MONGODB_EXPLANATION.md)
- [Moorcheh Integration Guide](./MOORCHEH_EXPLANATION.md)
- [Testing Guide](./TESTING_GUIDE_COMPLETE.md)

## License

[Your License Here]
