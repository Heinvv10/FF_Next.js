# VPS Deployment History

## November 3, 2025 - Initial VPS Deployment

### Summary
Successfully deployed FibreFlow Next.js application to Hostinger VPS (Lithuania) as a parallel deployment alongside Vercel.

### Server Details
- **Provider:** Hostinger
- **Location:** Lithuania (Vilnius)
- **IP:** 72.60.17.245
- **Hostname:** srv1092611.hstgr.cloud
- **Domain:** app.fibreflow.app
- **SSL:** Let's Encrypt (expires Feb 1, 2026)

### Deployment Method
1. ✅ Added DNS A record: app.fibreflow.app → 72.60.17.245
2. ✅ Created directory structure: /var/www/fibreflow/
3. ✅ Created production .env file on server
4. ✅ Cloned GitHub repo: VelocityFibre/FF_Next.js
5. ✅ Installed dependencies: npm ci
6. ✅ Built Next.js app: npm run build
7. ✅ Configured PM2 process manager
8. ✅ Configured Nginx reverse proxy
9. ✅ Set up SSL with Certbot
10. ✅ Tested deployment successfully

### Configuration
- **Stack:** Next.js + PM2 + Nginx + Let's Encrypt
- **Port:** 3005 (internal)
- **Process Manager:** PM2 v6.0.13
- **Web Server:** Nginx v1.24.0
- **Node.js:** v20.19.5
- **Mode:** Production (demo mode enabled, Clerk auth bypassed)

### DNS Configuration
- `app.fibreflow.app` → 72.60.17.245 (VPS)
- `www.fibreflow.app` → Vercel (unchanged)

### Initial Performance
- **Status:** Online
- **Uptime:** 50 minutes
- **Restarts:** 0
- **Memory:** 104 MB
- **Response Time:** < 1s

### Issues Encountered
1. **Large file transfer timeout**
   - Problem: Rsync of 433MB .next folder timed out
   - Solution: Cloned repo directly on server and built there

2. **None after deployment**
   - App started successfully on first try
   - SSL certificate obtained without issues
   - DNS propagated quickly (~15 minutes)

### Testing Results
- ✅ HTTPS working: https://app.fibreflow.app
- ✅ HTTP redirects to HTTPS
- ✅ App renders correctly
- ✅ PM2 running stable (0 restarts)
- ✅ Nginx proxy working
- ✅ SSL certificate valid

### Notes
- Deployment completed in parallel with Vercel (both running)
- Vercel remains primary production (www.fibreflow.app)
- VPS serves as testing/staging environment (app.fibreflow.app)
- Full control over server configuration and deployment
- Manual deployment process (can be automated with CI/CD later)

### Next Steps
- [ ] Monitor performance over next 24-48 hours
- [ ] Consider setting up automated deployments via GitHub Actions
- [ ] Evaluate if VPS should become primary or remain staging
- [ ] Set up monitoring/alerting (UptimeRobot, etc.)
- [ ] Consider implementing PM2 cluster mode for better performance

---

## Future Deployments

*This section will track subsequent deployments and updates.*

### Template for Future Entries:
```
## [Date] - [Title]

**Changes:**
- List of changes deployed

**Deployment Method:**
- Steps taken

**Issues:**
- Any problems encountered and solutions

**Performance Impact:**
- Memory, CPU, response time changes
```

---

*Last Updated: November 3, 2025*
