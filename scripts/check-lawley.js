#!/usr/bin/env node
// Check lawley records structure

(async () => {
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

  const loginCookies = loginResp.headers.get("set-cookie") || "";
  const newSid = loginCookies.match(/connect\.sid=([^;]+)/)?.[1];
  const origSid = c.match(/connect\.sid=([^;]+)/)?.[1];
  const sid = newSid || origSid;

  // Get sample
  const r2 = await fetch("https://www.1map.co.za/api/apps/app/getattributes", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded", "Cookie": "connect.sid="+sid },
    body: "ungeocoded=false&left=0&bottom=0&right=0&top=0&selfilter=&action=get&email=hein@velocityfibre.co.za&layerid=5121&sort=prop_id&templateExpression=&q=lawley&page=1&start=0&limit=100",
  });
  const d2 = await r2.json();

  // Find records without valid DR
  const noDR = d2.result.filter(r => !r.drp || !/^DR\d+$/.test(r.drp));
  console.log("Records without valid DR:", noDR.length, "out of", d2.result.length);

  if (noDR.length > 0) {
    console.log("\nSample record WITHOUT DR number:");
    const sample = noDR[0];
    console.log("  drp:", sample.drp || "(empty)");
    console.log("  prop_id:", sample.prop_id);
    console.log("  jobid:", sample.jobid);
    console.log("  address:", sample.address?.substring(0, 60));
    console.log("  pole:", sample.pole);
    console.log("  status:", sample.status);
    console.log("  latitude:", sample.latitude);
    console.log("  longitude:", sample.longitude);
  }

  // What can uniquely identify records without DR?
  console.log("\nUnique identifiers in records without DR:");
  const hasPropId = noDR.filter(r => r.prop_id).length;
  const hasJobId = noDR.filter(r => r.jobid).length;
  const hasCoords = noDR.filter(r => r.latitude && r.longitude).length;
  console.log("  With prop_id:", hasPropId);
  console.log("  With jobid:", hasJobId);
  console.log("  With coordinates:", hasCoords);

  // Sample prop_ids to see format
  const propIds = noDR.filter(r => r.prop_id).slice(0, 5).map(r => r.prop_id);
  console.log("\nSample prop_ids:", propIds.join(", "));

})().catch(e => console.error(e));
