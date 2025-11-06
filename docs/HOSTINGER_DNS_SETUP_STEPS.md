# Hostinger DNS Setup for fibreflow.app - Step by Step

Your domain **fibreflow.app** is hosted on **Hostinger**.

## 🚀 Quick Setup (5 minutes)

### Step 1: Login to Hostinger

1. Go to: https://hpanel.hostinger.com/
2. Login with your credentials
3. Click on **Domains** in the left menu
4. Find **fibreflow.app** and click **Manage**

---

## Step 2: Add DNS Records

Click on **DNS / Name Servers** tab, then scroll down to **DNS Records** section.

### Record 1: Domain Verification (DKIM)

Click **Add Record** and enter:

```
Type:    TXT
Name:    resend._domainkey
Content: p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQDDswQxDo3bNH+ByhjlaOxZpQ5Vx8+r5tl47fgjqtDFnxBTObPpfHJDVtkfXcskfsVnWt23slahvx5QMS9QE4FscuZh9PSO1YXYYZT1JBhvp5eMQ+hXHi6KZ0mSJrr3Z81bmJ7aouYWOU/niZWj9TENPwd1syuKzJXdtsQrEDkxNQIDAQAB
TTL:     3600 (or leave default)
```

**Important**:
- Make sure to copy the ENTIRE content (starts with `p=MIGfMA0...` and ends with `...AQAB`)
- Do NOT add quotes around the content
- Name should be exactly: `resend._domainkey` (no domain suffix needed)

Click **Add Record** ✅

---

### Record 2: SPF Record

Click **Add Record** and enter:

```
Type:    TXT
Name:    send
Content: v=spf1 include:amazonses.com ~all
TTL:     3600 (or leave default)
```

Click **Add Record** ✅

---

### Record 3: Sending MX Record

Click **Add Record** and enter:

```
Type:     MX
Name:     send
Points to: feedback-smtp.eu-west-1.amazonses.com
TTL:      3600 (or leave default)
Priority: 10
```

Click **Add Record** ✅

---

### Record 4: DMARC (Optional but Recommended)

Click **Add Record** and enter:

```
Type:    TXT
Name:    _dmarc
Content: v=DMARC1; p=none;
TTL:     3600 (or leave default)
```

Click **Add Record** ✅

---

## Step 3: Save Changes

Your DNS records should now look like this in Hostinger:

| Type | Name | Value/Points To | Priority | TTL |
|------|------|----------------|----------|-----|
| TXT | resend._domainkey | p=MIGfMA0GCSqGSIb3DQEBAQUAA4... | - | 3600 |
| TXT | send | v=spf1 include:amazonses.com ~all | - | 3600 |
| MX | send | feedback-smtp.eu-west-1.amazonses.com | 10 | 3600 |
| TXT | _dmarc | v=DMARC1; p=none; | - | 3600 |

---

## Step 4: Wait for Propagation

⏰ **DNS propagation takes 5-30 minutes** (sometimes up to a few hours)

While waiting, you can check propagation:
```bash
bash scripts/cron/check-domain-verification.sh
```

Or online: https://dnschecker.org
- Search: `resend._domainkey.fibreflow.app`
- Type: TXT
- Should show the DKIM key

---

## Step 5: Verify in Resend

Once DNS has propagated:

1. Go to: https://resend.com/domains
2. Find **fibreflow.app** in the list
3. Click the **Verify** button
4. Status should change to ✅ **Verified**

If verification fails:
- Wait a bit longer (DNS can take time)
- Double-check all 3 required records are added correctly
- Check the Name field doesn't have extra `.fibreflow.app` suffix

---

## Step 6: Test Email

Once verified, test sending an email:

```bash
cd /home/louisdup/VF/Apps/FF_React

# Edit the test script to use your email
nano scripts/cron/test-email.ts
# Change the 'to' field to: louisrdup@gmail.com

# Run the test
npx tsx scripts/cron/test-email.ts
```

You should receive an email at louisrdup@gmail.com! 🎉

---

## Troubleshooting

### "Record already exists"
- You may already have a TXT or MX record with that name
- Edit the existing record instead of adding a new one
- Or delete the old one and add the new one

### Can't find DNS Records section
- Make sure you're in: **Domains → fibreflow.app → DNS / Name Servers**
- Scroll down past the nameservers section
- Look for "Manage DNS Records" or similar

### Verification fails in Resend
- Wait longer (DNS propagation can take time)
- Run: `bash scripts/cron/check-domain-verification.sh` to check what's missing
- Make sure you copied the full DKIM key (it's very long!)

### Need more help?
- Hostinger support: https://www.hostinger.com/tutorials/how-to-use-hostinger-dns
- Resend docs: https://resend.com/docs/dashboard/domains/introduction

---

## What Happens After Verification?

✅ **Emails work for all addresses** (louisrdup@gmail.com, any email)
✅ **Daily reminders automatically send** at 8 AM via cron job
✅ **Professional sender**: `FibreFlow Reminders <reminders@fibreflow.app>`
✅ **No code changes needed** - system is ready!

Users just need to:
1. Go to Settings → Reminders tab
2. Enable daily emails
3. Create reminders
4. Receive daily emails ✨
