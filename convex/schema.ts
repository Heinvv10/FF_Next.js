import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

/**
 * Convex Schema for FibreFlow Database
 * Synced from Neon PostgreSQL
 */

export default defineSchema({
  // Contractors table - synced from Neon
  contractors: defineTable({
    // Original Neon fields
    company_name: v.string(),
    status: v.string(),
    is_active: v.boolean(),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),

    // Sync metadata
    neon_id: v.optional(v.string()),
    synced_at: v.optional(v.string()),
  })
    .index("by_status", ["status"])
    .index("by_active", ["is_active"])
    .index("by_neon_id", ["neon_id"]),

  // Projects table - synced from Neon
  projects: defineTable({
    name: v.string(),
    description: v.optional(v.string()),
    status: v.string(),

    // Sync metadata
    neon_id: v.optional(v.string()),
    synced_at: v.optional(v.string()),
  })
    .index("by_status", ["status"])
    .index("by_neon_id", ["neon_id"]),

  // Sync mappings - track what's been synced
  sync_mappings: defineTable({
    neon_table: v.string(),
    neon_id: v.string(),
    convex_id: v.id("contractors" as any), // Can be any table
    synced_at: v.string(),
  })
    .index("by_neon_table", ["neon_table"])
    .index("by_neon_id", ["neon_table", "neon_id"]),
});
