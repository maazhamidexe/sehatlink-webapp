# Deployment Setup Guide

## Issue: Backend Connection on Vercel

Your Next.js app is deployed on Vercel, but it cannot connect to your local backend running on `localhost:8000` because Vercel's servers cannot access your local machine.

## Solution Options

### Option 1: Deploy Your Backend (Recommended)

Deploy your backend to a cloud service:

#### Free/Easy Options:
- **Railway**: https://railway.app (Easiest, generous free tier)
- **Render**: https://render.com (Free tier available)
- **Fly.io**: https://fly.io (Free tier)

#### Steps:
1. Deploy your backend to one of these services
2. Get the public URL (e.g., `https://your-app.railway.app`)
3. Add environment variable in Vercel:
   - Go to your Vercel project → Settings → Environment Variables
   - Add: `NEXT_PUBLIC_API_URL` = `https://your-backend-url.com`
4. Redeploy your Vercel app

### Option 2: Use ngrok for Testing (Temporary)

If you want to test quickly without deploying:

1. Install ngrok: https://ngrok.com/download
2. Start your backend on port 8000
3. Run: `ngrok http 8000`
4. Copy the ngrok URL (e.g., `https://abc123.ngrok.io`)
5. Add to Vercel environment variables:
   - `NEXT_PUBLIC_API_URL` = `https://abc123.ngrok.io`
6. Redeploy

**Note**: ngrok URLs change each time you restart (unless you have a paid plan)

### Option 3: Full Local Development

Keep both frontend and backend running locally:
- Frontend: `npm run dev` (http://localhost:3000)
- Backend: running on http://localhost:8000
- This works perfectly for development

## Setting Environment Variables in Vercel

1. Go to: https://vercel.com/dashboard
2. Select your project
3. Go to **Settings** → **Environment Variables**
4. Add the following:

```
NEXT_PUBLIC_API_URL=https://your-backend-url.com
```

5. Select which environments (Production, Preview, Development)
6. Click **Save**
7. Redeploy your app (Vercel will automatically trigger a redeploy, or go to Deployments → Redeploy)

## Environment Variables Template

Create a `.env.local` file in your project root:

```env
# Backend API URL
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000

# Supabase Configuration (if using)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Current Configuration

Your app uses this environment variable:
- `NEXT_PUBLIC_API_URL` - Backend API base URL
- Default: `http://127.0.0.1:8000` (only works locally)
- Used in: `lib/axios.ts` and various API proxy routes

## Quick Test

After setting up the environment variable:

1. Check if it's working by visiting: `https://your-vercel-app.vercel.app/api/proxy/doctor/login`
2. You should see a proper error message (not connection refused)
3. Test the login page

## Recommended: Railway Deployment

Railway is the easiest option:

1. Go to https://railway.app
2. Sign up with GitHub
3. Click "New Project" → "Deploy from GitHub repo"
4. Select your backend repository
5. Railway will auto-detect Python/FastAPI and deploy
6. Copy the public URL
7. Add to Vercel environment variables

That's it! Your backend will be live and accessible.

