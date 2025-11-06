import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

/**
 * Project queries - Natural language TypeScript!
 */

// List all projects
export const list = query({
  handler: async (ctx) => {
    return await ctx.db.query("projects").collect();
  },
});

// Get project by ID
export const get = query({
  args: { id: v.id("projects") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

// Search projects by name
export const search = query({
  args: { query: v.string() },
  handler: async (ctx, args) => {
    const projects = await ctx.db.query("projects").collect();
    return projects.filter((p) =>
      p.name.toLowerCase().includes(args.query.toLowerCase())
    );
  },
});

// Get projects by status
export const getByStatus = query({
  args: { status: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("projects")
      .withIndex("by_status", (q) => q.eq("status", args.status))
      .collect();
  },
});

// Count projects
export const count = query({
  handler: async (ctx) => {
    const projects = await ctx.db.query("projects").collect();
    return {
      total: projects.length,
    };
  },
});

// Add a new project (for sync) - PUBLIC for sync script
export const create = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    status: v.string(),
    neon_id: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Check if already synced
    const existing = await ctx.db
      .query("projects")
      .withIndex("by_neon_id", (q) => q.eq("neon_id", args.neon_id || ""))
      .first();

    if (existing) {
      return existing._id; // Already synced
    }

    return await ctx.db.insert("projects", {
      ...args,
      synced_at: new Date().toISOString(),
    });
  },
});
