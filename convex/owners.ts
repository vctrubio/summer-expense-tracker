import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("owners")
      .withIndex("by_name")
      .collect();
  },
});

export const add = mutation({
  args: { name: v.string() },
  handler: async (ctx, args) => {
    // Check if owner already exists
    const existing = await ctx.db
      .query("owners")
      .withIndex("by_name", (q) => q.eq("name", args.name))
      .unique();

    if (existing) {
      throw new Error("Owner already exists");
    }

    return await ctx.db.insert("owners", {
      name: args.name,
    });
  },
});

export const remove = mutation({
  args: { id: v.id("owners") },
  handler: async (ctx, args) => {
    const owner = await ctx.db.get(args.id);
    if (!owner) {
      throw new Error("Owner not found");
    }

    await ctx.db.delete(args.id);
  },
});
