# Debugging Vercel Deployment - 500 Error

## Immediate Steps to Debug

### 1. Check Backend URL Configuration

Visit this endpoint on your deployed Vercel app:
```
https://your-app.vercel.app/api/health
```

This will show you:
- What backend URL is configured
- If the environment variable is set
- Current environment

### 2. Check Browser Console

Open browser console (F12) and look for logs starting with:
```
=== DOCTOR LOGIN ATTEMPT ===
```

This will show you:
- The exact backend URL being used
- The request being sent
- The response status and headers
- Full error details

### 3. Verify Environment Variable in Vercel

1. Go to: https://vercel.com/dashboard
2. Select your project
3. Go to **Settings** → **Environment Variables**
4. Check if `NEXT_PUBLIC_API_URL` is set
5. It should be set to your **deployed backend URL** (not localhost!)

Example:
```
NEXT_PUBLIC_API_URL=https://your-backend.railway.app
```

**IMPORTANT**: After adding/changing environment variables, you MUST redeploy!

### 4. Common Issues and Solutions

#### Issue: "Failed to connect to authentication service"
**Solution**: Your backend is not accessible. Either:
- Deploy your backend to Railway/Render/Fly.io
- Use ngrok temporarily to expose localhost

#### Issue: "Backend returned non-JSON response"
**Solution**: The endpoint doesn't exist or backend crashed
- Check if `/doctor/login` endpoint exists in your backend
- Check backend logs for errors
- Verify backend is running

#### Issue: CORS errors
**Solution**: Your backend needs to allow requests from Vercel
- Add your Vercel domain to CORS allowed origins
- Example: `https://your-app.vercel.app`

#### Issue: 404 Not Found
**Solution**: The endpoint path is wrong
- Verify your backend has `/doctor/login` endpoint
- Check if it's `/api/doctor/login` or `/doctor/login`

## Step-by-Step Fix

### If Backend is Still on Localhost:

**Option A: Deploy Backend (Recommended)**

1. **Using Railway (Easiest)**:
   ```bash
   # 1. Install Railway CLI
   npm install -g @railway/cli
   
   # 2. Login
   railway login
   
   # 3. In your backend directory
   railway init
   railway up
   
   # 4. Get the URL
   railway domain
   ```

2. **Add to Vercel**:
   - Go to Vercel → Settings → Environment Variables
   - Add: `NEXT_PUBLIC_API_URL` = `https://your-backend.railway.app`
   - Redeploy

**Option B: Use ngrok (Quick Test)**

1. Start backend on port 8000
2. Run: `ngrok http 8000`
3. Copy the https URL (e.g., `https://abc123.ngrok.io`)
4. Add to Vercel environment variables
5. Redeploy

**Note**: ngrok URL changes on restart (unless paid plan)

### If Backend is Already Deployed:

1. **Verify backend is accessible**:
   ```bash
   curl https://your-backend-url.com/docs
   ```
   (FastAPI usually has `/docs` for Swagger UI)

2. **Test the login endpoint**:
   ```bash
   curl -X POST https://your-backend-url.com/doctor/login \
     -H "Content-Type: application/json" \
     -d '{"email":"test@test.com","password":"test123"}'
   ```

3. **If above works**, add the URL to Vercel:
   - Vercel → Settings → Environment Variables
   - `NEXT_PUBLIC_API_URL` = `https://your-backend-url.com`
   - Redeploy

## Testing After Changes

After deploying/setting environment variables:

1. **Clear your browser cache** (Ctrl+Shift+Delete)
2. **Hard refresh** (Ctrl+F5)
3. **Check the health endpoint** first: `/api/health`
4. **Open browser console** (F12)
5. **Try logging in** and watch console logs
6. **Check Vercel logs**: Vercel Dashboard → Your Project → Deployments → View Function Logs

## Vercel Function Logs

To see server-side logs:
1. Go to Vercel Dashboard
2. Select your project
3. Go to "Deployments"
4. Click on the latest deployment
5. Click "Functions" tab
6. Look for `/api/proxy/doctor/login` function
7. View the console.log output

## Quick Checklist

- [ ] Backend is deployed and accessible from internet
- [ ] `NEXT_PUBLIC_API_URL` is set in Vercel
- [ ] Environment variable points to HTTPS URL (not http://localhost)
- [ ] Redeployed Vercel app after setting env vars
- [ ] Backend CORS allows your Vercel domain
- [ ] Backend endpoint `/doctor/login` exists and works
- [ ] Checked browser console for detailed error logs
- [ ] Visited `/api/health` to verify configuration

## Need More Help?

If you're still stuck:
1. Visit `https://your-app.vercel.app/api/health`
2. Share the output
3. Open browser console, try login, and share the error logs
4. Share Vercel function logs from the deployment

