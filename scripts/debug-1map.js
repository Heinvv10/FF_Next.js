#!/usr/bin/env node
// Debug 1Map API to find Lawley identifiers

console.log("Starting...");

(async () => {
  console.log("Fetching login page...");
  const r1 = await fetch("https://www.1map.co.za/login");
  const c = r1.headers.get("set-cookie") || "";
  const h = await r1.text();
  const csrf = h.match(/name="_csrf"[^>]*value="([^"]+)"/)?.[1];

  const loginResp = await fetch("https://www.1map.co.za/login", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded", "Cookie": c.split(",").map(x=>x.split(";")[0]).join("; ") },
    body: `email=hein@velocityfibre.co.za&password=VeloF@2025&_csrf=${encodeURIComponent(csrf)}`,
    redirect: "manual",
  });
  console.log("Login status:", loginResp.status);

  // Use session from login response, fallback to original
  const loginCookies = loginResp.headers.get("set-cookie") || "";
  const newSid = loginCookies.match(/connect\.sid=([^;]+)/)?.[1];
  const origSid = c.match(/connect\.sid=([^;]+)/)?.[1];
  const sid = newSid || origSid;
  console.log("Session ID:", sid ? "OK" : "NONE");

  // Search for Lawley
  console.log("Searching for 'lawley'...");
  const r3 = await fetch("https://www.1map.co.za/api/apps/app/getattributes", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded", "Cookie": "connect.sid="+sid },
    body: "ungeocoded=false&left=0&bottom=0&right=0&top=0&selfilter=&action=get&email=hein@velocityfibre.co.za&layerid=5121&sort=prop_id&templateExpression=&q=lawley&page=1&start=0&limit=5",
  });
  const d = await r3.json();
  console.log("API success:", d.success, "Results:", d.result?.length || 0);
  if (!d.success) {
    console.log("Full response:", JSON.stringify(d).substring(0, 500));
  }

  if (d.result && d.result.length > 0) {
    console.log("\nLawley records found:");
    d.result.forEach((r, i) => {
      console.log(`\n[${i+1}] ${r.drp}`);
      console.log(`    site: ${r.site}`);
      console.log(`    pole: ${r.pole}`);
      console.log(`    address: ${r.address?.substring(0, 50)}`);
      console.log(`    prop_id: ${r.prop_id}`);
      console.log(`    jobid: ${r.jobid}`);
    });
  }
})().catch(e => console.error(e));
