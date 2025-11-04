# Resend Domain Setup - fibreflow.app

## DNS Records to Add

Add these DNS records to your domain provider (where you manage fibreflow.app DNS).

### 1. Domain Verification (Required)

| Type | Name | Content | TTL |
|------|------|---------|-----|
| TXT | `resend._domainkey` | `p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQDDswQxDo3bNH+ByhjlaOxZpQ5Vx8+r5tl47fgjqtDFnxBTObPpfHJDVtkfXcskfsVnWt23slahvx5QMS9QE4FscuZh9PSO1YXYYZT1JBhvp5eMQ+hXHi6KZ0mSJrr3Z81bmJ7aouYWOU/niZWj9TENPwd1syuKzJXdtsQrEDkxNQIDAQAB` | Auto |

### 2. Enable Sending (Required for sending emails)

| Type | Name | Content | TTL | Priority |
|------|------|---------|-----|----------|
| MX | `send` | `feedback-smtp.eu-west-1.amazonses.com` | Auto | 10 |
| TXT | `send` | `v=spf1 include:amazonses.com ~all` | Auto | - |
| TXT | `_dmarc` | `v=DMARC1; p=none;` | Auto | - |

### 3. Enable Receiving (Optional - only if you want to receive emails)

| Type | Name | Content | TTL | Priority |
|------|------|---------|-----|----------|
| MX | `@` | `inbound-smtp.eu-west-1.amazonaws.com` | Auto | 10 |

---

## Where to Add These Records

### If using Cloudflare:
1. Go to https://dash.cloudflare.com
2. Select `fibreflow.app` domain
3. Click **DNS** → **Records**
4. Click **Add record** for each DNS record above
5. Click **Save**

### If using Hostinger:
1. Login to Hostinger panel
2. Go to **Domains** → **fibreflow.app**
3. Click **DNS / Name Servers**
4. Click **Add Record**
5. Add each DNS record above
6. Click **Save**

### If using GoDaddy:
1. Login to GoDaddy
2. Go to **My Products** → **Domains**
3. Click **DNS** next to fibreflow.app
4. Click **Add** for each record
5. Save changes

### If using Namecheap:
1. Login to Namecheap
2. Go to **Domain List** → Click **Manage** for fibreflow.app
3. Go to **Advanced DNS**
4. Click **Add New Record**
5. Add each record above

---

## Important Notes

### Name Field Format
Different DNS providers have different formats:

- **Cloudflare/Hostinger**: Enter exactly as shown (e.g., `resend._domainkey`, `send`, `_dmarc`)
- **GoDaddy/Namecheap**: May need to add domain suffix (e.g., `resend._domainkey.fibreflow.app`)
- **If unsure**: Try without the domain suffix first. If it doesn't work, add `.fibreflow.app` at the end

### TTL (Time To Live)
- Use **Auto** or **3600** (1 hour)
- Lower TTL = faster propagation but more DNS queries
- Higher TTL = slower propagation but better performance

### Verification Time
- DNS propagation takes **5-30 minutes** on average
- Can take up to **48 hours** in rare cases
- Use https://dnschecker.org to check if DNS has propagated

---

## How to Add Each Record Type

### Adding TXT Records

**Example: Domain Verification Record**
```
Type:     TXT
Name:     resend._domainkey
Content:  p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQDDswQxDo3bNH+ByhjlaOxZpQ5Vx8+r5tl47fgjqtDFnxBTObPpfHJDVtkfXcskfsVnWt23slahvx5QMS9QE4FscuZh9PSO1YXYYZT1JBhvp5eMQ+hXHi6KZ0mSJrr3Z81bmJ7aouYWOU/niZWj9TENPwd1syuKzJXdtsQrEDkxNQIDAQAB
TTL:      Auto (or 3600)
```

**Example: SPF Record**
```
Type:     TXT
Name:     send
Content:  v=spf1 include:amazonses.com ~all
TTL:      Auto
```

**Example: DMARC Record (Optional)**
```
Type:     TXT
Name:     _dmarc
Content:  v=DMARC1; p=none;
TTL:      Auto
```

### Adding MX Records

**Example: Sending MX Record**
```
Type:     MX
Name:     send
Content:  feedback-smtp.eu-west-1.amazonses.com
TTL:      Auto
Priority: 10
```

**Example: Receiving MX Record (Optional)**
```
Type:     MX
Name:     @
Content:  inbound-smtp.eu-west-1.amazonaws.com
TTL:      Auto
Priority: 10
```

---

## Verification Steps

### 1. Add DNS Records
Add all the records listed above to your DNS provider

### 2. Wait for Propagation
Wait 5-30 minutes for DNS to propagate

### 3. Check DNS Propagation
Use https://dnschecker.org to verify:
- Search: `resend._domainkey.fibreflow.app`
- Type: TXT
- Should see the DKIM key in results

### 4. Verify in Resend
1. Go to https://resend.com/domains
2. Click **Verify** next to fibreflow.app
3. If successful, status changes to **Verified** ✅

### 5. Test Email
Once verified, run:
```bash
cd /var/www/fibreflow
npx tsx scripts/cron/test-email.ts
```

---

## Troubleshooting

### DNS Records Not Found
- **Wait longer**: DNS can take up to 48 hours
- **Check format**: Try adding `.fibreflow.app` to the Name field
- **Clear cache**: Some DNS providers cache records

### Verification Failed
- **Check all records**: All 3 records must be added (TXT for domainkey, MX + TXT for send)
- **Check content**: Make sure you copied the full TXT record content (it's very long!)
- **No quotes**: Don't add quotes around the TXT content (some providers add them automatically)

### Test Email Failed
- **Domain not verified**: Check Resend dashboard - must show "Verified"
- **Wrong from address**: Must use `@fibreflow.app` in the from address
- **API key**: Make sure RESEND_API_KEY is correct in .env.production

---

## After Verification

Once your domain is verified:

1. **Emails will work for ALL addresses** (not just ai@velocityfibre.co.za)
2. **Cron job will automatically work** (no code changes needed)
3. **Professional from address**: `FibreFlow Reminders <reminders@fibreflow.app>`

---

## Quick Reference Commands

```bash
# Check DNS propagation
nslookup -type=TXT resend._domainkey.fibreflow.app 8.8.8.8

# Test email after verification
cd /var/www/fibreflow
npx tsx scripts/cron/test-email.ts

# Check cron logs
tail -f /var/log/reminders-cron.log
```

---

## Need Help?

1. Check Resend docs: https://resend.com/docs/dashboard/domains/introduction
2. Check DNS with: https://dnschecker.org
3. Contact your DNS provider if unsure about adding records
