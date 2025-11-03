# VPS Documentation

Documentation for FibreFlow VPS deployment on Hostinger Lithuania server.

**Live URL:** https://app.fibreflow.app
**Server IP:** 72.60.17.245

---

## 📚 Documentation Files

### [DEPLOYMENT.md](./DEPLOYMENT.md)
**Complete deployment guide and reference**
- Server specifications and architecture
- DNS configuration
- Application configuration (environment variables, PM2, Nginx)
- SSL certificate setup
- Management commands (PM2, Nginx, SSH)
- Deployment workflows (initial, updates, manual)
- Monitoring and troubleshooting
- Performance optimization
- Backup strategy
- Security recommendations

### [QUICK_REFERENCE.md](./QUICK_REFERENCE.md)
**Quick access to most common commands**
- One-liner deploy command
- Status checks
- Emergency troubleshooting
- File locations
- Environment differences (Vercel vs VPS)

### [DEPLOYMENT_HISTORY.md](./DEPLOYMENT_HISTORY.md)
**Changelog of all VPS deployments**
- Initial deployment (Nov 3, 2025)
- Issues encountered and solutions
- Performance metrics
- Future deployment template

---

## 🚀 Quick Start

### Access Server
```bash
ssh root@72.60.17.245
```

### Deploy Update
```bash
ssh root@72.60.17.245 "cd /var/www/fibreflow && git pull && npm ci && npm run build && pm2 restart fibreflow"
```

### View Status
```bash
ssh root@72.60.17.245 "pm2 list && pm2 logs fibreflow --lines 20"
```

---

## 📊 Server Status

**Deployment Date:** November 3, 2025
**Current Status:** ✅ Online
**Node.js Version:** v20.19.5
**PM2 Version:** 6.0.13
**Nginx Version:** 1.24.0
**SSL Expires:** February 1, 2026 (auto-renews)

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────┐
│                                                 │
│         https://app.fibreflow.app               │
│                                                 │
└────────────────┬────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────┐
│          DNS (Hostinger)                        │
│          A Record → 72.60.17.245                │
└────────────────┬────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────┐
│   Nginx Reverse Proxy (Port 80/443)            │
│   - SSL Termination                             │
│   - Request Forwarding                          │
└────────────────┬────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────┐
│   PM2 Process Manager                           │
│   - Auto-restart                                │
│   - Log management                              │
│   - Memory limits                               │
└────────────────┬────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────┐
│   Next.js App (Port 3005)                       │
│   - Server-side rendering                       │
│   - API routes                                  │
└────────────────┬────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────┐
│   Neon PostgreSQL (Cloud)                       │
│   - Serverless database                         │
└─────────────────────────────────────────────────┘
```

---

## 🔧 Maintenance

### Daily
- Check PM2 status: `pm2 list`
- Monitor logs: `pm2 logs fibreflow --lines 50`

### Weekly
- Check disk space: `df -h`
- Review error logs
- Monitor memory usage

### Monthly
- Update dependencies (if needed)
- Review SSL certificate status
- Check for security updates
- Review backup strategy

---

## 🆘 Emergency Contacts

**VPS Provider:** Hostinger
- Support: https://hostinger.com/support
- Server Location: Lithuania (Vilnius)
- Plan: KVM 2
- Expires: October 31, 2026

**Developer:** Claude AI + Louis Duplessis
**Deployment:** November 3, 2025

---

## 📝 Notes

### Parallel Deployment Strategy
- **Production (Vercel):** www.fibreflow.app
- **Staging/Testing (VPS):** app.fibreflow.app

Both environments run the same codebase but on different infrastructure. This allows:
- Testing updates before Vercel deployment
- Full server control for debugging
- Cost comparison between managed (Vercel) and self-hosted (VPS)

### When to Use Which

**Use Vercel (www):**
- Production traffic
- Customer-facing application
- Automatic deployments
- Global CDN

**Use VPS (app):**
- Testing new features
- Debugging production issues
- Performance testing
- Server-side configuration changes

---

## 🔐 Security Reminders

- [ ] Change default SSH password (or use key-based auth)
- [ ] Enable firewall (ufw)
- [ ] Install fail2ban for brute-force protection
- [ ] Regularly update system packages
- [ ] Monitor access logs
- [ ] Backup environment variables securely

---

*Documentation maintained by: Claude AI + Development Team*
*Last Updated: November 3, 2025*
