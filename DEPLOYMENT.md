# EduCore ERP — Deployment Guide

## Deployment Architecture

This project supports two deployment strategies:

| Strategy | Frontend | Backend | Best For |
|----------|----------|---------|----------|
| **Split Deploy** | Vercel | Render | Easy cloud hosting, free tiers available |
| **Single Server** | Built into backend | PM2 + Nginx | VPS, full control, custom domains |

---

## Strategy 1: Vercel (Frontend) + Render (Backend)

### Prerequisites
- GitHub account with the repository pushed
- [Vercel account](https://vercel.com) (free tier works)
- [Render account](https://render.com) (free tier works)
- [MongoDB Atlas](https://www.mongodb.com/atlas) cluster (free M0 tier works)

### Step 1: Set Up MongoDB Atlas

1. Create a free MongoDB Atlas cluster
2. Under **Database Access**, create a user with read/write permissions
3. Under **Network Access**, add `0.0.0.0/0` (allow all — required for Render/Heroku)
4. Click **Connect → Drivers**, copy the connection string
5. Replace `<password>` with your database user's password
6. Your `MONGODB_URI` should look like:
   ```
   mongodb+srv://educore_user:yourPassword@cluster0.xxxxx.mongodb.net/educore?retryWrites=true&w=majority
   ```

### Step 2: Deploy Backend to Render

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click **New → Web Service**
3. Connect your GitHub repository
4. Configure:
   - **Root Directory**: `backend`
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`
   - **Plan**: Free (or paid for better performance)
5. Add **Environment Variables**:

   | Key | Value | Required |
   |-----|-------|----------|
   | `NODE_ENV` | `production` | Yes |
   | `MONGODB_URI` | Your Atlas connection string | Yes |
   | `JWT_SECRET` | A long random string | Yes |
   | `JWT_REFRESH_SECRET` | Another long random string | Yes |
   | `CORS_ORIGIN` | Your Vercel frontend URL | Yes |
   | `SPLIT_DEPLOYMENT` | `true` | Yes |
   | `JWT_EXPIRY` | `24h` | No |
   | `JWT_REFRESH_EXPIRY` | `7d` | No |
   | `SUPER_ADMIN_EMAIL` | `admin@educore.edu` | No |
   | `SUPER_ADMIN_PASSWORD` | A strong password | No |
   | `CLOUDINARY_CLOUD_NAME` | Your Cloudinary cloud name | No |
   | `CLOUDINARY_API_KEY` | Your Cloudinary API key | No |
   | `CLOUDINARY_API_SECRET` | Your Cloudinary API secret | No |

   Generate JWT secrets with:
   ```bash
   node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
   ```

6. Click **Create Web Service**
7. Wait for the build and deployment to complete
8. Note your backend URL (e.g., `https://educore-erp.onrender.com`)

**Important**: Render free tier has cold starts — the first request after idle may take 30-60 seconds.

### Step 3: Deploy Frontend to Vercel

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click **Add New → Project**
3. Import your GitHub repository
4. Configure:
   - **Framework Preset**: Vite
   - **Root Directory**: `frontend`
   - **Build Command**: `npm install && npm run build`
   - **Output Directory**: `dist`
5. Add **Environment Variables**:

   | Key | Value | Required |
   |-----|-------|----------|
   | `VITE_API_URL` | `https://your-backend.onrender.com/api` | Yes |

   Set this to your Render backend URL + `/api` suffix.

6. Click **Deploy**
7. After deployment, copy your Vercel URL (e.g., `https://edu-core-erp.vercel.app`)

### Step 4: Connect the Dots

1. Go back to your **Render** dashboard
2. Update the `CORS_ORIGIN` environment variable to your Vercel URL:
   ```
   https://edu-core-erp.vercel.app
   ```
3. If you have multiple Vercel deployment URLs (e.g., branch previews), add them comma-separated:
   ```
   https://edu-core-erp.vercel.app,https://edu-core-erp-git-main.vercel.app
   ```
4. Render will automatically redeploy with the new CORS settings

### Step 5: Verify

1. Visit your Vercel URL
2. You should see the login page
3. Try logging in with the seeded credentials
4. Check the browser console (F12) for any errors
5. Check the backend health: `https://your-backend.onrender.com/health`

### Troubleshooting Split Deploy

| Issue | Solution |
|-------|----------|
| CORS error in browser | Verify `CORS_ORIGIN` on Render matches your Vercel URL exactly (including https://) |
| 500 error on login | Check Render logs — likely missing `MONGODB_URI` or `JWT_SECRET` |
| Timeout on first request | Normal for Render free tier (cold start) — wait 30-60s and retry |
| "Network error" in frontend | Verify `VITE_API_URL` is set correctly and includes `/api` |
| WebSocket not connecting | Render free tier doesn't support WebSocket — upgrade to paid plan |

---

## Strategy 2: Single Server (VPS) with PM2

### Prerequisites
- Ubuntu 20.04+ or similar Linux
- Node.js 18+
- MongoDB 6+ (or MongoDB Atlas)
- Nginx
- PM2 (`npm install -g pm2`)
- Certbot for SSL (`sudo apt install certbot python3-certbot-nginx`)

### Step 1: Server Setup

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install PM2 globally
sudo npm install -g pm2

# Install Nginx
sudo apt install -y nginx
```

### Step 2: Deploy Application

```bash
# Clone / upload project
cd /var/www
sudo mkdir educore
sudo chown $USER:$USER educore
cd educore

# Upload your files or clone from git

# Install backend dependencies
cd backend
npm install --production

# Install frontend dependencies and build
cd ../frontend
npm install
npm run build

# Return to project root
cd ..
```

### Step 3: Configure Environment

```bash
# Backend .env
cp backend/.env.example backend/.env
nano backend/.env
# Fill in ALL values — especially JWT_SECRET, MONGODB_URI, CORS_ORIGIN

# For single server, CORS_ORIGIN should be your domain:
# CORS_ORIGIN=https://yourdomain.com
# SPLIT_DEPLOYMENT=   (leave empty — backend serves frontend)
```

### Step 4: Start with PM2

```bash
# From project root
pm2 start ecosystem.config.js --env production

# Save PM2 process list (auto-restart on reboot)
pm2 save
pm2 startup
```

### Step 5: Configure Nginx

```bash
# Copy Nginx config
sudo cp nginx.conf /etc/nginx/sites-available/educore
sudo ln -s /etc/nginx/sites-available/educore /etc/nginx/sites-enabled/

# Edit the config — replace 'yourdomain.com' with your actual domain
sudo nano /etc/nginx/sites-available/educore

# Test Nginx config
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
```

### Step 6: SSL Certificate

```bash
# Get Let's Encrypt certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Auto-renewal is set up by certbot, verify:
sudo certbot renew --dry-run
```

### Step 7: Verify

```bash
# Check backend health
curl http://localhost:5000/health

# Check PM2 status
pm2 status

# Check logs
pm2 logs educore-api
```

---

## Environment Variables Quick Reference

### Backend (Required in Production)

| Variable | Description | Example |
|----------|-------------|---------|
| `MONGODB_URI` | MongoDB connection string | `mongodb+srv://user:pass@cluster.mongodb.net/educore` |
| `JWT_SECRET` | Secret for signing access tokens | 64-char random hex string |
| `JWT_REFRESH_SECRET` | Secret for signing refresh tokens | Different 64-char random hex string |
| `CORS_ORIGIN` | Allowed frontend origins (comma-separated) | `https://your-app.vercel.app` |
| `NODE_ENV` | Environment mode | `production` |

### Backend (Optional)

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | `5000` |
| `JWT_EXPIRY` | Access token expiry | `24h` |
| `JWT_REFRESH_EXPIRY` | Refresh token expiry | `7d` |
| `SPLIT_DEPLOYMENT` | Set `true` for Vercel+Render | empty |
| `SUPER_ADMIN_EMAIL` | Admin email for auto-seed | `admin@educore.edu` |
| `SUPER_ADMIN_PASSWORD` | Admin password for auto-seed | `admin123` |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name | empty |
| `CLOUDINARY_API_KEY` | Cloudinary API key | empty |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret | empty |

### Frontend

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_API_URL` | Backend API URL | `https://educore-erp.onrender.com/api` |

---

## Maintenance

```bash
# View logs (single server)
pm2 logs educore-api

# Restart backend
pm2 restart educore-api

# Update application
cd /var/www/educore
cd frontend && npm run build
pm2 restart educore-api

# MongoDB backup
mongodump --db educore --out /backup/$(date +%Y%m%d)
```

---

## Security Checklist

- [ ] `JWT_SECRET` and `JWT_REFRESH_SECRET` are strong, unique random strings
- [ ] `MONGODB_URI` uses a strong password and is not committed to Git
- [ ] `CORS_ORIGIN` only allows your actual frontend URL(s)
- [ ] `SUPER_ADMIN_PASSWORD` is changed from the default
- [ ] `.env` files are in `.gitignore` and never committed
- [ ] MongoDB Atlas network access is restricted (or `0.0.0.0/0` for cloud deploy)
- [ ] HTTPS is enforced (automatic on Vercel/Render, use Certbot for VPS)
- [ ] Rate limiting is enabled (built into the application)
- [ ] Helmet security headers are enabled (built into the application)
