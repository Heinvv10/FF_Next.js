# 🚀 QUICKSTART - FibreFlow Server

## ✅ THE ONLY WAY TO START THE SERVER:

```bash
# 1. BUILD FIRST (REQUIRED!)
npm run build

# 2. START SERVER
PORT=3005 npm start
```

**URL: http://localhost:3005**

---

## ❌ DO NOT USE:
```bash
npm run dev  # BROKEN - Watchpack bug
```

---

## 📝 After Code Changes:
1. Stop server (Ctrl+C)
2. `npm run build`
3. `PORT=3005 npm start`

---

## 🔧 Why Production Mode?
- Development mode has a **Watchpack bug** (nested package.json in neon/)
- Production mode **bypasses the bug entirely**
- **100% stable** for local development

---

## 💡 Quick Tips:
- Always build before starting
- Use port 3005 to avoid conflicts
- Production mode = Stable development
- This affects Next.js 14 & 15

---

## 📚 More Info:
- See `CLAUDE.md` for detailed explanation
- See `README.md` for full documentation

---

**Remember: BUILD → START (Always in that order!)**