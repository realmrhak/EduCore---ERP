# Deployment Guide — EduCore ERP

## 1. Production Build Procedures

### Frontend Static Build
1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Build the production application bundle:
   ```bash
   npm run build
   ```
   *This compiles assets into a optimized React bundle inside the `frontend/dist` directory.*

### Backend Production Configuration
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Set the runtime environment:
   ```env
   NODE_ENV=production
   PORT=5000
   ```
3. Build/transpile isn't required as the backend runs natively on Node.js.

## 2. Server Deployment & Hosting Options

### Running Backend with Process Managers (PM2)
To ensure the Express API runs persistently, restart automatically on crashes or reboot:
1. Install PM2 globally:
   ```bash
   npm install -g pm2
   ```
2. Launch the backend process:
   ```bash
   pm2 start server.js --name "educore-api"
   ```
3. Save current PM2 processes:
   ```bash
   pm2 save
   ```

### Reverse Proxy Setup (Nginx)
Configure Nginx to proxy API requests and serve static frontend files.
Example Nginx configuration fragment:
```nginx
server {
    listen 80;
    server_name portal.example.edu;

    # Static frontend files
    location / {
        root /var/www/educore/frontend/dist;
        index index.html;
        try_files $uri /index.html;
    }

    # Proxy API requests to backend
    location /api/ {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```
