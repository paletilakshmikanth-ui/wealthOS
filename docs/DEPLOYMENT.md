# 🚀 WealthOS Infinity — Deployment Guide

Step-by-step guide to run WealthOS Infinity in **development** and **production** environments. Covers local dev, Vercel, Docker, VPS, and static hosting.

---

## 📑 Table of Contents

- [Prerequisites](#prerequisites)
- [Quick Start (Dev)](#quick-start-dev)
- [Quick Start (Production)](#quick-start-production)
- [Development Mode — Detailed](#development-mode--detailed)
- [Production Mode — Detailed](#production-mode--detailed)
- [Deployment Platforms](#deployment-platforms)
- [Environment Variables](#environment-variables)
- [Performance Optimization](#performance-optimization)
- [Troubleshooting](#troubleshooting)
- [Maintenance & Updates](#maintenance--updates)

---

## Prerequisites

### Required
| Tool | Version | Purpose |
|------|---------|---------|
| **Node.js** | 18.17+ (20+ recommended) | JavaScript runtime |
| **npm** / **bun** / **pnpm** | latest | Package manager |
| **Git** | 2.20+ | Version control |

### Recommended
| Tool | Version | Purpose |
|------|---------|---------|
| **Bun** | 1.0+ | Faster package manager + runtime |
| **Docker** | 24+ | Containerized deployment (optional) |
| **VS Code** | latest | IDE with TypeScript support |

### Verify Installation

```bash
# Check Node.js
node --version
# Expected: v18.17.0 or higher

# Check npm
npm --version

# (Optional) Check Bun
bun --version

# Check Git
git --version
```

### System Requirements

| Resource | Minimum | Recommended |
|----------|---------|-------------|
| RAM | 512 MB | 2 GB+ |
| Disk | 200 MB | 1 GB+ |
| CPU | 1 core | 2+ cores |
| Browser | Chrome 90+ / Firefox 90+ / Safari 15+ | Latest version |

---

## Quick Start (Dev)

**3 commands to get running:**

```bash
# 1. Clone the repository
git clone <your-repo-url> wealthos-infinity
cd wealthos-infinity

# 2. Install dependencies
bun install   # or: npm install

# 3. Start the dev server
bun run dev   # or: npm run dev
```

Open **http://localhost:3000** in your browser. Done! 🎉

---

## Quick Start (Production)

**5 commands to build and serve:**

```bash
# 1. Clone and enter the directory
git clone <your-repo-url> wealthos-infinity
cd wealthos-infinity

# 2. Install dependencies
bun install

# 3. Build the production bundle
bun run build

# 4. Start the production server
bun run start

# 5. Open http://localhost:3000
```

The production server runs on **port 3000** by default.

---

## Development Mode — Detailed

### Step 1: Clone the Repository

```bash
git clone <your-repo-url> wealthos-infinity
cd wealthos-infinity
```

If you have a ZIP file instead:
```bash
unzip wealthos-infinity.zip
cd wealthos-infinity
```

### Step 2: Install Dependencies

WealthOS Infinity supports **npm**, **bun**, and **pnpm**. Bun is recommended (faster).

```bash
# Option A: Bun (recommended — 10x faster)
bun install

# Option B: npm (default)
npm install

# Option C: pnpm
pnpm install
```

This installs:
- Next.js 16 + React 19
- Tailwind CSS 4 + shadcn/ui (40+ components)
- Zustand 5 (state management)
- Recharts 2 (charts)
- Framer Motion 12 (animations)
- Lucide React (icons)
- Web Crypto API (native — no install needed)

### Step 3: Environment Setup (Optional)

Create a `.env` file in the project root (optional — WealthOS is offline-first):

```bash
# .env (optional — only needed if you enable Prisma/database features)
DATABASE_URL="file:./db/custom.db"
```

> **Note**: WealthOS Infinity is **offline-first**. The database (Prisma/SQLite) is configured but **unused** in the default setup. All user data persists to browser `localStorage`. You can safely skip this step.

### Step 4: Start the Dev Server

```bash
# Using Bun (recommended)
bun run dev

# Using npm
npm run dev

# Using pnpm
pnpm dev
```

**What happens:**
- Next.js 16 starts with Turbopack (fast refresh)
- Server runs on **http://localhost:3000**
- Hot Module Replacement (HMR) enabled — changes reflect instantly
- Dev log is written to `dev.log` for debugging

**First launch takes ~3-5 seconds** (TypeScript compilation + Turbopack warmup).

### Step 5: Verify the Dev Server

```bash
# Check if the server is running
curl http://localhost:3000
# Expected: HTML response with "WealthOS Infinity"

# Check the dev log
tail -f dev.log
```

### Step 6: First Launch Experience

1. **Open** http://localhost:3000 in your browser
2. **Set up PIN** — create a 4-8 digit PIN (used for encryption)
3. **Welcome screen** appears — choose:
   - **"Load Sample Data"** — explore with a demo profile (32-year-old tech professional)
   - **"Start Adding Assets"** — begin entering your own data

### Dev Scripts Reference

| Command | Description |
|---------|-------------|
| `bun run dev` | Start dev server on port 3000 |
| `bun run lint` | Run ESLint to check code quality |
| `bun run db:push` | Push Prisma schema to database (unused in offline mode) |
| `bun run db:generate` | Generate Prisma client |
| `bun run db:migrate` | Run database migrations |
| `bun run db:reset` | Reset database (⚠️ destructive) |

### Dev Server Features

- **Hot Module Replacement (HMR)** — instant updates on code changes
- **TypeScript checking** — real-time type errors in console
- **ESLint integration** — code quality warnings in console
- **React DevTools** — install browser extension for debugging
- **Error overlay** — friendly error messages with stack traces
- **Fast Refresh** — preserves component state on edits

### Common Dev Tasks

#### Adding a New Module

```bash
# 1. Create the view component
touch src/components/wealthos/views/MyNewView.tsx

# 2. Add to types.ts (ViewId union type)
# 3. Add to Sidebar.tsx (NAV array)
# 4. Add to page.tsx (VIEW_TITLES + render condition)
# 5. The dev server auto-recompiles — navigate to your new view
```

#### Running Lint

```bash
bun run lint
# Fix errors before committing
```

#### Viewing Dev Logs

```bash
# Real-time log streaming
tail -f dev.log

# Search for errors
grep -i "error" dev.log
```

---

## Production Mode — Detailed

### Step 1: Prepare the Build

Before building, ensure:
- All code is committed to Git
- `bun run lint` passes with no errors
- No `console.log` statements in production code (optional)
- Environment variables are set (if any)

### Step 2: Build the Production Bundle

```bash
# Using Bun
bun run build

# Using npm
npm run build
```

**What happens:**
- Next.js compiles all pages with production optimizations
- TypeScript is type-checked (note: `ignoreBuildErrors: true` is set in `next.config.ts` — you can change this to `false` for stricter builds)
- Code is minified and tree-shaken
- Static pages are pre-rendered
- Output is generated in `.next/` directory
- **Standalone server** is created at `.next/standalone/server.js`
- Static assets are copied to `.next/standalone/`

**Build time**: ~30-60 seconds (depending on hardware)

### Step 3: Understand the Build Output

```bash
.next/
├── standalone/           # Self-contained server (no node_modules needed)
│   ├── server.js         # Production server entry point
│   ├── .next/            # Compiled pages + static chunks
│   └── public/           # Static assets (logo, robots.txt)
├── static/               # Static assets (CSS, JS, images)
└── ...                   # Other build artifacts
```

The `standalone` output is **portable** — you can copy just the `.next/standalone/` folder to a server and run it without `node_modules`.

### Step 4: Start the Production Server

```bash
# Using Bun (recommended — faster startup)
bun run start

# Using npm
npm run start

# Using Node directly
NODE_ENV=production node .next/standalone/server.js
```

**What happens:**
- Server starts on **port 3000** (configurable via `PORT` env var)
- `NODE_ENV=production` is set (enables React production mode)
- Server log is written to `server.log`

### Step 5: Verify Production

```bash
# Check if server is running
curl http://localhost:3000
# Expected: HTML response (no "WealthOS Infinity" in dev mode)

# Check server log
tail -f server.log

# Test in browser
open http://localhost:3000
```

### Step 6: Configure the Port (Optional)

To run on a different port:

```bash
# Method 1: Environment variable
PORT=8080 bun run start

# Method 2: Direct Node
NODE_ENV=production PORT=8080 node .next/standalone/server.js
```

### Production Scripts Reference

| Command | Description |
|---------|-------------|
| `bun run build` | Build production bundle (creates `.next/standalone/`) |
| `bun run start` | Start production server on port 3000 |

### Production Checklist

Before going live, verify:

- [ ] `bun run lint` passes clean
- [ ] `bun run build` succeeds without errors
- [ ] Production server starts (`bun run start`)
- [ ] All 21 views load without errors
- [ ] PIN setup works
- [ ] Backup download works
- [ ] Restore from backup works
- [ ] CSV import works (all 5 entity types)
- [ ] Edit functionality works (all 9 modules)
- [ ] HTTPS is configured (if hosting on a server)
- [ ] Firewall allows port 3000 (or your chosen port)

---

## Deployment Platforms

### Option 1: Vercel (Recommended — Easiest)

WealthOS Infinity is built on Next.js, which is Vercel's framework. Deployment takes 2 minutes.

#### Step 1: Push to GitHub

```bash
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/yourusername/wealthos-infinity.git
git push -u origin main
```

#### Step 2: Connect to Vercel

1. Go to [vercel.com](https://vercel.com) and sign in with GitHub
2. Click **"New Project"**
3. Import your `wealthos-infinity` repository
4. Vercel auto-detects Next.js — keep default settings:
   - **Framework Preset**: Next.js
   - **Build Command**: `next build` (or `bun run build`)
   - **Output Directory**: `.next`
   - **Install Command**: `bun install` (or `npm install`)
5. Click **"Deploy"**

#### Step 3: Wait for Build

Vercel builds your app (~1-2 minutes). Once done, you get a URL like:
```
https://wealthos-infinity-abc123.vercel.app
```

#### Step 4: Custom Domain (Optional)

1. Go to **Settings → Domains**
2. Add your custom domain (e.g., `wealthos.yourdomain.com`)
3. Follow DNS configuration instructions

**Pros**: Zero config, automatic HTTPS, global CDN, instant deploys on git push
**Cost**: Free for personal projects

---

### Option 2: Docker (Containerized)

Best for self-hosting, consistent environments, and scalability.

#### Step 1: Create a Dockerfile

Create `Dockerfile` in the project root:

```dockerfile
# Stage 1: Dependencies
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci --only=production

# Stage 2: Build
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# Stage 3: Runner
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
USER nextjs
EXPOSE 3000
ENV PORT=3000
CMD ["node", "server.js"]
```

#### Step 2: Create `.dockerignore`

```
node_modules
.next
.git
*.md
dev.log
server.log
```

#### Step 3: Build the Image

```bash
docker build -t wealthos-infinity .
```

#### Step 4: Run the Container

```bash
# Run on port 3000
docker run -p 3000:3000 wealthos-infinity

# Run on port 80
docker run -p 80:3000 wealthos-infinity

# Run in background
docker run -d -p 3000:3000 --name wealthos wealthos-infinity
```

#### Step 5: Verify

```bash
curl http://localhost:3000
docker logs wealthos
```

---

### Option 3: Docker Compose (With Reverse Proxy)

Best for production self-hosting with SSL.

#### Step 1: Create `docker-compose.yml`

```yaml
version: '3.8'
services:
  wealthos:
    build: .
    ports:
      - "3000:3000"
    restart: unless-stopped
    environment:
      - NODE_ENV=production
    volumes:
      - ./data:/app/data  # Persistent storage (if needed)

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - ./certs:/etc/nginx/certs:ro
    depends_on:
      - wealthos
    restart: unless-stopped
```

#### Step 2: Create `nginx.conf`

```nginx
events {
    worker_connections 1024;
}

http {
    upstream wealthos {
        server wealthos:3000;
    }

    server {
        listen 80;
        server_name wealthos.yourdomain.com;
        return 301 https://$host$request_uri;
    }

    server {
        listen 443 ssl;
        server_name wealthos.yourdomain.com;

        ssl_certificate /etc/nginx/certs/fullchain.pem;
        ssl_certificate_key /etc/nginx/certs/privkey.pem;

        location / {
            proxy_pass http://wealthos;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
    }
}
```

#### Step 3: Start Everything

```bash
docker-compose up -d
```

---

### Option 4: VPS (Virtual Private Server)

Best for full control on a Linux server (DigitalOcean, Linode, AWS EC2, etc.).

#### Step 1: Provision a VPS

```bash
# SSH into your server
ssh root@your-server-ip

# Update system
apt update && apt upgrade -y

# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs git

# Install Bun (optional, faster)
curl -fsSL https://bun.sh/install | bash
source ~/.bashrc
```

#### Step 2: Clone and Build

```bash
# Clone the repo
cd /var/www
git clone <your-repo-url> wealthos-infinity
cd wealthos-infinity

# Install dependencies
bun install  # or: npm install

# Build
bun run build
```

#### Step 3: Test the Server

```bash
# Test manually
bun run start
# Open http://your-server-ip:3000 — should work
# Press Ctrl+C to stop
```

#### Step 4: Set Up PM2 (Process Manager)

```bash
# Install PM2
npm install -g pm2

# Start the app
cd /var/www/wealthos-infinity
pm2 start "bun run start" --name wealthos

# Save PM2 config (auto-restart on reboot)
pm2 save
pm2 startup
# Follow the instructions PM2 prints
```

#### Step 5: Set Up Nginx (Reverse Proxy + SSL)

```bash
# Install Nginx
apt install -y nginx

# Create config
cat > /etc/nginx/sites-available/wealthos << 'EOF'
server {
    listen 80;
    server_name wealthos.yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
EOF

# Enable the site
ln -s /etc/nginx/sites-available/wealthos /etc/nginx/sites-enabled/
nginx -t  # test config
systemctl reload nginx

# Install SSL with Let's Encrypt
apt install -y certbot python3-certbot-nginx
certbot --nginx -d wealthos.yourdomain.com
```

#### Step 6: Firewall Configuration

```bash
ufw allow 22/tcp    # SSH
ufw allow 80/tcp    # HTTP
ufw allow 443/tcp   # HTTPS
ufw enable
```

---

### Option 5: Static Export (Limited)

> ⚠️ **Warning**: WealthOS Infinity uses Next.js API features that may not work with static export. This option is **not recommended** unless you only need the client-side features.

If you want to try static export:

#### Step 1: Modify `next.config.ts`

```typescript
const nextConfig: NextConfig = {
  output: "export",  // Changed from "standalone"
  images: {
    unoptimized: true,
  },
};
```

#### Step 2: Build

```bash
bun run build
# Output goes to `out/` directory
```

#### Step 3: Serve Static Files

```bash
# Using a static server
npx serve out

# Or copy to any static host (GitHub Pages, Netlify, S3)
```

**Limitations**: No server-side rendering, no API routes. All features work client-side (offline-first design makes this viable).

---

## Environment Variables

WealthOS Infinity is **offline-first** — it requires **no environment variables** for basic operation.

### Optional Variables

| Variable | Default | Purpose |
|----------|---------|---------|
| `DATABASE_URL` | `file:./db/custom.db` | Prisma database URL (unused in offline mode) |
| `PORT` | `3000` | Server port |
| `NODE_ENV` | `production` | Environment mode |

### Creating a `.env` File

```bash
# .env (optional)
DATABASE_URL=file:./db/custom.db
PORT=3000
NODE_ENV=production
```

> **Note**: The `.env` file is gitignored by default. Never commit secrets.

---

## Performance Optimization

### Production Performance Tips

1. **Enable gzip/brotli compression** (Nginx):
   ```nginx
   gzip on;
   gzip_types text/plain text/css application/json application/javascript;
   ```

2. **Set cache headers** for static assets:
   ```nginx
   location /_next/static/ {
       expires 1y;
       add_header Cache-Control "public, immutable";
   }
   ```

3. **Use a CDN** (Cloudflare, CloudFront) for global distribution

4. **Monitor memory usage**:
   ```bash
   pm2 monit
   ```

### Bundle Size

WealthOS Infinity production bundle:
- **Initial JS**: ~250KB (gzipped)
- **Initial CSS**: ~30KB (gzipped)
- **Total**: ~280KB (loads in <1s on 3G)

### Lighthouse Score

Expected Lighthouse metrics:
| Metric | Score |
|--------|-------|
| Performance | 90-95 |
| Accessibility | 85-90 |
| Best Practices | 95-100 |
| SEO | 90-95 |

---

## Troubleshooting

### Common Issues

#### 1. "Port 3000 is already in use"

```bash
# Find what's using port 3000
lsof -i :3000   # Mac/Linux
netstat -ano | findstr :3000   # Windows

# Kill the process
kill -9 <PID>

# Or use a different port
PORT=3001 bun run dev
```

#### 2. "Module not found" errors

```bash
# Clear node_modules and reinstall
rm -rf node_modules
rm package-lock.json
bun install  # or: npm install
```

#### 3. Build fails with TypeScript errors

```bash
# Check types
npx tsc --noEmit

# If you want to bypass (not recommended)
# next.config.ts already has: typescript: { ignoreBuildErrors: true }
# Change to false for stricter builds
```

#### 4. Hydration mismatch errors

This is usually caused by `Math.random()` or `Date.now()` in render. WealthOS Infinity handles this via:
- Deterministic IDs in seed data
- `useHydrated()` hook
- `partialize` in Zustand (excludes `activeView`)

If you see hydration errors after adding new code, check for non-deterministic values in render.

#### 5. localStorage quota exceeded

```bash
# Check localStorage size in browser console:
JSON.stringify(localStorage).length

# WealthOS typical usage: 50-100KB (well within 5MB limit)
# If exceeded, clear old data:
localStorage.clear()
```

#### 6. Web Crypto API not available

WealthOS requires a secure context (HTTPS or localhost) for Web Crypto API.

```
Error: crypto.subtle is undefined
```

**Fix**: Serve over HTTPS in production, or use localhost for development.

#### 7. Backup file won't decrypt

```
Error: Incorrect PIN or corrupted file (decryption failed)
```

**Causes**:
- Wrong PIN entered
- File was modified/corrupted
- File was created with a different app version

**Fix**: Use the correct PIN, or create a new backup.

### Dev Server Won't Start

```bash
# Check Node version (must be 18+)
node --version

# Check if port is available
curl http://localhost:3000

# Check dev log
cat dev.log | tail -50

# Clear Next.js cache
rm -rf .next
bun run dev
```

### Production Build Fails

```bash
# Clean everything and rebuild
rm -rf .next node_modules
bun install
bun run build

# Check for TypeScript errors
npx tsc --noEmit

# Check for lint errors
bun run lint
```

---

## Maintenance & Updates

### Updating WealthOS Infinity

```bash
# Pull the latest changes
git pull origin main

# Install any new dependencies
bun install

# Rebuild
bun run build

# Restart the production server
pm2 restart wealthos  # if using PM2
# OR
docker-compose restart  # if using Docker
```

### Backup Strategy

WealthOS Infinity stores all data in browser localStorage. To back up:

1. **User-level backup**: Use the in-app "Backup" button (downloads encrypted `.wealthos` file)
2. **Server-level backup**: Not needed — all data is client-side
3. **Code backup**: Use Git (`git push` to remote repository)

### Monitoring

#### PM2 Monitoring

```bash
# Real-time monitoring
pm2 monit

# View logs
pm2 logs wealthos

# Restart on crash
pm2 restart wealthos
```

#### Docker Monitoring

```bash
# View running containers
docker ps

# View logs
docker logs wealthos

# Resource usage
docker stats
```

### Health Checks

```bash
# Simple health check
curl -f http://localhost:3000 || exit 1

# Add to crontab for automated checks
*/5 * * * * curl -f http://localhost:3000 > /dev/null || pm2 restart wealthos
```

---

## Quick Reference

### Development Commands

```bash
bun install          # Install dependencies
bun run dev          # Start dev server (http://localhost:3000)
bun run lint         # Check code quality
```

### Production Commands

```bash
bun run build        # Build production bundle
bun run start        # Start production server
```

### Deployment Quick Reference

| Platform | Command | Time |
|----------|---------|------|
| Vercel | `vercel --prod` | 2 min |
| Docker | `docker build -t wealthos . && docker run -p 3000:3000 wealthos` | 5 min |
| VPS | `pm2 start "bun run start" --name wealthos` | 10 min |
| Static | `bun run build && npx serve out` | 3 min |

---

## Need Help?

- 📖 **[README.md](../README.md)** — Project overview
- 🏗️ **[ARCHITECTURE.md](../ARCHITECTURE.md)** — Technical deep-dive
- 🔐 **[docs/SECURITY.md](./SECURITY.md)** — Security model
- 📊 **[docs/MODULES.md](./MODULES.md)** — Module guide
- 📥 **[docs/CSV_IMPORT.md](./CSV_IMPORT.md)** — CSV import reference
- 📋 **[CHANGELOG.md](../CHANGELOG.md)** — Version history

---

*Last updated: v2.3*
