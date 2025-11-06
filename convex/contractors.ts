import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

/**
 * Contractor queries - Natural language TypeScript!
 */

// List all contractors
export const list = query({
  handler: async (ctx) => {
    return await ctx.db.query("contractors").collect();
  },
});

// Get active contractors only
export const listActive = query({
  handler: async (ctx) => {
    return await ctx.db
      .query("contractors")
      .filter((q) => q.eq(q.field("is_active"), true))
      .collect();
  },
});

// Get contractor by ID
export const get = query({
  args: { id: v.id("contractors") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

// Search contractors by name
export const search = query({
  args: { query: v.string() },
  handler: async (ctx, args) => {
    const contractors = await ctx.db.query("contractors").collect();
    return contractors.filter((c) =>
      c.company_name.toLowerCase().includes(args.query.toLowerCase())
    );
  },
});

// Get contractors by status
export const getByStatus = query({
  args: { status: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("contractors")
      .withIndex("by_status", (q) => q.eq("status", args.status))
      .collect();
  },
});

// Count contractors
export const count = query({
  handler: async (ctx) => {
    const contractors = await ctx.db.query("contractors").collect();
    return {
      total: contractors.length,
      active: contractors.filter((c) => c.is_active).length,
      inactive: contractors.filter((c) => !c.is_active).length,
    };
  },
});

// Add a new contractor (for sync) - PUBLIC for sync script
export const create = mutation({
  args: {
    company_name: v.string(),
    status: v.string(),
    is_active: v.boolean(),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    neon_id: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Check if already synced
    const existing = await ctx.db
      .query("contractors")
      .withIndex("by_neon_id", (q) => q.eq("neon_id", args.neon_id || ""))
      .first();

    if (existing) {
      return existing._id; // Already synced
    }

    return await ctx.db.insert("contractors", {
      ...args,
      synced_at: new Date().toISOString(),
    });
  },
});
