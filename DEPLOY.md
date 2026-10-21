# BookNest cPanel/WHM Deployment Guide

## Overview
BookNest is a Node.js/Express backend with SQLite storage and a React frontend. This guide covers deployment to a cPanel/WHM server.

---

## 1. Server Requirements

- **cPanel/WHM** with Node.js support (Easy Apache + Passenger or custom setup)
- **Node.js 20+** installed
- **SQLite 3** (usually pre-installed on Linux)
- **Git** or SSH/rsync access for deployment
- **Ports**: 80 (HTTP), 443 (HTTPS), 3000+ (Node app, if not using Passenger)

---

## 2. File Transfer (SSH/rsync or cPanel File Manager)

### Option A: SSH/rsync (Recommended)

```bash
# From your local machine
rsync -avz --delete \
  --exclude='.git' \
  --exclude='node_modules' \
  --exclude='*.log' \
  ./ server@your-cpanel-host:/home/youruser/booknest/
```

### Option B: cPanel File Manager

1. Log into cPanel → **File Manager**
2. Navigate to `/home/youruser/public_html/` (or a subdomain directory)
3. Upload the contents of your `server/` directory
4. Also upload the `client/` build files to a `public/` or `client/` folder

---

## 3. Environment Variables

Create a `.env` file in `/home/youruser/booknest/server/` with:

```env
# Server configuration
PORT=5000

# Security
JWT_SECRET=your-super-secret-jwt-key-change-in-production

# Frontend URL (for CORS)
FRONTEND_URL=https://booknest.pagecraft.website

# Database path (SQLite absolute path)
DB_PATH=/home/youruser/booknest/server/database.sqlite
```

### Important Notes:

- **Never commit `.env` to Git** — it's listed in `.gitignore` (check existing `.gitignore`)
- **Set file permissions**: `chmod 600 .env` so only the owner can read it
- **cPanel Dashboard**: You can also set env vars via **cPanel → Select PHP Version → Switch PHP Version → Environment Variables** (if using PHP proxy), but for Node/Passenger, the `.env` file is best

---

## 4. SQLite File Permissions

SQLite requires write access to the database file and its directory:

```bash
# Set ownership to your cPanel user
chown youruser:youruser /home/youruser/booknest/server/database.sqlite

# Set permissions: owner read/write, no group/world write
chmod 600 /home/youruser/booknest/server/database.sqlite

# Set directory permissions (parent folder)
chmod 755 /home/youruser/booknest/server/
```

### Why this matters:

- cPanel jail shells may restrict access to `/home/` paths
- The web server process (Apache/Passenger) must be able to **read and write** the `.sqlite` file
- If using a subdomain like `booknest.pagecraft.website`, ensure the path is within `/home/youruser/` or a writable directory

---

## 5. Process Manager: PM2 (or cPanel Passenger)

### Option A: PM2 (standalone, not natively cPanel-integrated)

1. **Install PM2 globally** (via SSH):
   ```bash
   npm install -g pm2
   ```

2. **Start the app**:
   ```bash
   cd /home/youruser/booknest/server
   pm2 start server.js --name "booknest-api" \
     --env production \
     --var PORT=5000 \
     --var JWT_SECRET="$JWT_SECRET" \
     --var FRONTEND_URL="$FRONTEND_URL" \
     --var DB_PATH="$DB_PATH"
   ```

3. **Save PM2 process list for restart**:
   ```bash
   pm2 save
   pm2 startup systemd
   ```

4. **Set up systemd service** (runs on boot):
   ```bash
   pm2 startup systemd --user youruser
   cp ~/.config/systemd/user/pm2-youruser.service /etc/systemd/system/pm2-youruser.service
   systemctl enable pm2-youruser.service
   ```

### Option B: cPanel Passenger (recommended for cPanel/WHM)

1. **In cPanel → Setup Node.js App**:
   - Choose the domain/subdomain (e.g., `api.booknest.pagecraft.website`)
   - Node App Root: `/home/youruser/booknest/server`
   - Application Entry File: `server.js`
   - Application URL: Leave blank (Passenger handles routing)

2. **Passenger will automatically**:
   - Detect the `.env` file
   - Start the Node app on a internal port
   - Handle process restarts on code changes

3. **Set environment variables** in the cPanel UI or via the `.env` file

---

## 6. Reverse Proxy: Apache/Nginx via cPanel

Since cPanel uses Apache by default, we need a reverse proxy to forward `api.booknest.pagecraft.website` → the Node app (via Passenger or PM2).

### If using **Passenger** (automatic):

- Passenger handles the reverse proxy internally
- No additional Apache config needed
- Just ensure **SSL** is installed (see Section 7)

### If using **PM2** (manual Apache proxy):

1. **Create an Apache Virtual Host** (via WHM → Apache Configuration → Include Editor):

   ```apache
   <VirtualHost *:80>
     ServerName api.booknest.pagecraft.website
     DocumentRoot /home/youruser/booknest/public

     # Proxy to PM2
     ProxyRequests Off
     ProxyPass / http://localhost:3000/
     ProxyPassReverse / http://localhost:3000/

     # Allow headers
     <Proxy *>
       Require all granted
     </Proxy>
   </VirtualHost>
   ```

2. **Enable the module**:
   ```bash
   a2enmod proxy proxy_http
   ```

3. **Restart Apache**:
   ```bash
   /usr/local/cpanel/scripts/restartsrv_apache
   ```

### Recommended: Use **Passenger** over manual Apache proxy for simplicity.

---

## 7. SSL/TLS (Let's Encrypt via cPanel)

1. **In cPanel → SSL/TLS → Let's Encrypt**:
   - Select the domain: `api.booknest.pagecraft.website` (or `booknest.pagecraft.website`)
   - Click **Issue**

2. **For custom ports** (if PM2 on 3000):
   - The Let's Encrypt client will handle port 80 validation
   - Ensure no other web server is on port 80 during issuance

3. **HTTP-to-HTTPS redirect** (if using Passenger):
   - Passenger auto-configures this
   - Verify by visiting `https://api.booknest.pagecraft.website`

---

## 8. Build Commands for Production

### Frontend (React/Vite) — deploy to static folder

```bash
# From /workspace/booknest/client/
npm run build   # creates /workspace/booknest/client/dist/
# Upload dist/ contents to cPanel public_html/ or a subfolder
```

### Backend (Node/Express)

```bash
# No build step — JS runs directly
# But run lint + type check:
npm run lint
npm run type-check

# Initialize SQLite DB on first run (if not present):
npm run init-db
```

### Full deployment checklist:

```bash
1. rsync files to /home/youruser/booknest/
2. Set .env with JWT_SECRET, PORT, FRONTEND_URL, DB_PATH
3. chmod 600 .env && chmod 600 database.sqlite
4. Set up Node.js App in cPanel (Passenger) OR PM2 + Apache proxy
5. Issue Let's Encrypt SSL for the domain
6. Test: curl https://api.booknest.pagecraft.website/api/health
7. Monitor: WHM → Track Visitors, or pm2 logs booknest-api
```

---

## 9. Post-Deployment Checklist

- [ ] **SSH/rsync** files to server
- [ ] **`.env`** created with all vars (JWT_SECRET, PORT, FRONTEND_URL, DB_PATH)
- [ ] **SQLite permissions**: `chmod 600 database.sqlite`
- [ ] **cPanel Node.js App** configured (Passenger recommended)
- [ ] **SSL** issued via Let's Encrypt
- [ ] **Reverse proxy** working (Apache → Node, or Passenger handles it)
- [ ] **Health check**: `curl https://api.booknest.pagecraft.website/api/health` returns `{status: "ok"}`
- [ ] **PM2 logs** (if using PM2): `pm2 logs booknest-api`
- [ ] **Cron job** (optional): `npm run init-db` on first run, or backup script

---

## 10. Troubleshooting

| Symptom | Likely Cause | Fix |
|---------|:---|-----|
| 502 Bad Gateway | Passenger/PM2 not running | `pm2 restart booknest-api` or check cPanel Node.js App status |
| 403 Forbidden | `.env` readable by others | `chmod 600 .env` |
| SQLite `database is locked` | Concurrent writes | Set `PRAGMA journal_mode=WAL;` in init script, ensure `chmod 600`
| SSL not green | Cert not issued | Ensure domain points to server IP, wait 15m for DNS propagation |
| CORS error | FRONTEND_URL mismatch | Update `.env` FRONTEND_URL to match actual frontend URL |

---

**Need help?** Contact DevOps (Alex Turner) for CI/CD pipeline integration, or CTO (Priya Sharma) for architecture questions.