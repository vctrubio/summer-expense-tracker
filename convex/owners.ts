import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const list = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    return await ctx.db
      .query("owners")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
  },
});

export const add = mutation({
  args: { name: v.string() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    // Check if owner already exists
    const existing = await ctx.db
      .query("owners")
      .withIndex("by_user_and_name", (q) => q.eq("userId", userId).eq("name", args.name))
      .unique();

    if (existing) {
      throw new Error("Owner already exists");
    }

    return await ctx.db.insert("owners", {
      name: args.name,
      userId,
    });
  },
});

export const remove = mutation({
  args: { id: v.id("owners") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const owner = await ctx.db.get(args.id);
    if (!owner || owner.userId !== userId) {
      throw new Error("Owner not found or unauthorized");
    }

    await ctx.db.delete(args.id);
  },
});
