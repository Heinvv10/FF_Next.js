# FibreFlow Next.js Application

A modern Next.js application for fiber network project management.

## 🚀 Quick Start

### 🚨 IMPORTANT: Always Use Production Mode for Local Development

**DO NOT USE `npm run dev` - It has a known Watchpack bug that will cause it to fail!**

### ✅ Correct Way to Start the Server:

```bash
# Step 1: Install dependencies (if not already done)
npm install

# Step 2: Build the application (REQUIRED - Must do this first!)
npm run build

# Step 3: Start the production server on port 3005
PORT=3005 npm start
```

**Access the application at: http://localhost:3005**

### ❌ What NOT to Do:

```bash
npm run dev  # ⚠️ THIS WILL FAIL - Known Watchpack bug
```

### 📝 Making Code Changes:

When you need to update code:
1. Make your changes
2. Stop the server (Ctrl+C)
3. Rebuild: `npm run build`
4. Restart: `PORT=3005 npm start`

## 📦 Available Scripts

```bash
npm run build        # Build for production
npm start            # Start production server
npm run dev          # ⚠️ Development server (has known issues)
npm run lint         # Run ESLint
npm run type-check   # TypeScript type checking
npm test             # Run tests
```

## 🗄️ Database

The application uses Neon PostgreSQL. Database operations:

```bash
npm run db:migrate   # Run migrations
npm run db:seed      # Seed database
npm run db:validate  # Validate database schema
```

### 📊 SOW Data Import (After Project Creation)

After creating a new project, import Statement of Work (SOW) data using the proven scripts:

```bash
# For Fibre data import (edit script to set PROJECT_ID and file path):
node scripts/sow-import/import-fibre-louissep15.cjs

# Verify the import:
node scripts/sow-import/verify-fibre-louissep15.cjs

# Similar scripts available for:
# - Poles: scripts/sow-import/run-import.cjs
# - Drops: scripts/sow-import/run-import-drops.cjs
```

**Import Performance**: ~260 segments/second using `pg` library with batch processing

**View imported data at**:
- `/sow` - SOW Dashboard
- `/fiber-stringing` - Fiber Stringing Dashboard
- API: `/api/sow/fibre?projectId={PROJECT_ID}`

See `/SOW/docs/importlog.md` for detailed import history.

## ⚠️ Known Issues

### Development Server Watchpack Bug
The development server (`npm run dev`) has a known issue with Next.js's Watchpack module due to nested package.json files in the project structure. This affects both Next.js 14 and 15.

**Workaround**: Use production mode for local development as shown above.

## 🛠️ Tech Stack

- **Framework**: Next.js 14.2.18
- **Frontend**: React 18, TypeScript, TailwindCSS
- **Authentication**: Clerk
- **Database**: Neon PostgreSQL
- **Testing**: Vitest, Playwright

## 📚 Documentation

- `CLAUDE.md` - AI assistant context and detailed project information
- `docs/` - Additional documentation

## 🚀 Deployment

For production deployment:

```bash
# Build the application
npm run build

# The output will be in .next/ directory
# Deploy to your hosting platform (Vercel, etc.)
```

## 📝 License

Proprietary - VelocityFibre# Force cache purge Wed Oct 29 04:14:31 PM SAST 2025
<\!-- Auto-deploy test at Tue Jan  6 02:04:59 PM SAST 2026 -->
