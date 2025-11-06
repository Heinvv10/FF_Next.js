/**
 * Sync Neon PostgreSQL data to Convex
 *
 * Usage: npx tsx scripts/sync-neon-to-convex.ts
 */

import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api";
import pg from "pg";

const { Client } = pg;

// Load environment variables
const NEON_URL = process.env.DATABASE_URL!;
const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL!;

if (!NEON_URL || !CONVEX_URL) {
  console.error("❌ Missing environment variables!");
  console.error("   Need: DATABASE_URL and NEXT_PUBLIC_CONVEX_URL");
  process.exit(1);
}

const convex = new ConvexHttpClient(CONVEX_URL);
const neon = new Client({ connectionString: NEON_URL });

async function syncContractors() {
  console.log("\n📋 Syncing Contractors...");

  // Get contractors from Neon
  const result = await neon.query(`
    SELECT
      id,
      company_name,
      status,
      is_active,
      email,
      phone
    FROM contractors
    WHERE is_active = true
    ORDER BY company_name
  `);

  console.log(`   Found ${result.rows.length} active contractors in Neon`);

  // Insert into Convex
  let synced = 0;
  for (const contractor of result.rows) {
    try {
      await convex.mutation(api.contractors.create, {
        company_name: contractor.company_name,
        status: contractor.status,
        is_active: contractor.is_active,
        email: contractor.email || undefined,
        phone: contractor.phone || undefined,
        neon_id: contractor.id.toString(),
      });
      synced++;
      process.stdout.write(`\r   Synced: ${synced}/${result.rows.length}`);
    } catch (error: any) {
      console.error(`\n   ❌ Failed to sync ${contractor.company_name}:`, error.message);
    }
  }

  console.log(`\n   ✅ Synced ${synced} contractors`);
}

async function syncProjects() {
  console.log("\n📁 Syncing Projects...");

  // Get projects from Neon (using correct column names)
  const result = await neon.query(`
    SELECT
      id,
      project_name,
      description,
      status
    FROM projects
    WHERE status = 'active'
    ORDER BY project_name
  `);

  console.log(`   Found ${result.rows.length} projects in Neon`);

  // Insert into Convex
  let synced = 0;
  for (const project of result.rows) {
    try {
      await convex.mutation(api.projects.create, {
        name: project.project_name,
        description: project.description || undefined,
        status: project.status,
        neon_id: project.id.toString(),
      });
      synced++;
      process.stdout.write(`\r   Synced: ${synced}/${result.rows.length}`);
    } catch (error: any) {
      console.error(`\n   ❌ Failed to sync ${project.project_name}:`, error.message);
    }
  }

  console.log(`\n   ✅ Synced ${synced} projects`);
}

async function main() {
  console.log("=".repeat(60));
  console.log("🔄 Neon → Convex Sync");
  console.log("=".repeat(60));
  console.log(`\n📊 Neon:   ${NEON_URL.split("@")[1]?.split("/")[0]}`);
  console.log(`🌐 Convex: ${CONVEX_URL}`);

  try {
    // Connect to Neon
    await neon.connect();
    console.log("\n✅ Connected to Neon");

    // Sync data
    await syncContractors();
    await syncProjects();

    console.log("\n" + "=".repeat(60));
    console.log("✅ Sync Complete!");
    console.log("=".repeat(60));
  } catch (error) {
    console.error("\n❌ Sync failed:", error);
    process.exit(1);
  } finally {
    await neon.end();
  }
}

main();
