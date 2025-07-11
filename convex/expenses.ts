import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const list = query({
  args: {
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    let expensesQuery = ctx.db
      .query("expenses")
      .withIndex("by_user_and_timestamp", (q) => q.eq("userId", userId));

    let depositsQuery = ctx.db
      .query("deposits")
      .withIndex("by_user_and_timestamp", (q) => q.eq("userId", userId));

    if (args.startDate && args.endDate) {
      expensesQuery = expensesQuery.filter((q) =>
        q.and(
          q.gte(q.field("timestamp"), args.startDate!),
          q.lte(q.field("timestamp"), args.endDate!)
        )
      );
      depositsQuery = depositsQuery.filter((q) =>
        q.and(
          q.gte(q.field("timestamp"), args.startDate!),
          q.lte(q.field("timestamp"), args.endDate!)
        )
      );
    }

    const expenses = await expensesQuery.collect();
    const deposits = await depositsQuery.collect();

    return {
      expenses,
      deposits,
      totalExpenses: expenses.reduce((sum, exp) => sum + exp.amount, 0),
      totalDeposits: deposits.reduce((sum, dep) => sum + dep.amount, 0),
    };
  },
});

export const getDateRange = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const expenses = await ctx.db
      .query("expenses")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    const deposits = await ctx.db
      .query("deposits")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    const allTransactions = [...expenses, ...deposits];
    
    if (allTransactions.length === 0) {
      return null;
    }

    const timestamps = allTransactions.map(t => t.timestamp);
    return {
      earliest: Math.min(...timestamps),
      latest: Math.max(...timestamps),
    };
  },
});

export const addExpense = mutation({
  args: {
    amount: v.number(),
    desc: v.string(),
    dst: v.optional(v.string()),
    timestamp: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    return await ctx.db.insert("expenses", {
      ...args,
      timestamp: args.timestamp || Date.now(),
      userId,
    });
  },
});

export const addDeposit = mutation({
  args: {
    amount: v.number(),
    desc: v.string(),
    by: v.optional(v.string()),
    timestamp: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    return await ctx.db.insert("deposits", {
      ...args,
      timestamp: args.timestamp || Date.now(),
      userId,
    });
  },
});

export const deleteExpense = mutation({
  args: { id: v.id("expenses") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const expense = await ctx.db.get(args.id);
    if (!expense || expense.userId !== userId) {
      throw new Error("Expense not found or unauthorized");
    }

    await ctx.db.delete(args.id);
  },
});

export const deleteDeposit = mutation({
  args: { id: v.id("deposits") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const deposit = await ctx.db.get(args.id);
    if (!deposit || deposit.userId !== userId) {
      throw new Error("Deposit not found or unauthorized");
    }

    await ctx.db.delete(args.id);
  },
});

export const updateExpense = mutation({
  args: {
    id: v.id("expenses"),
    amount: v.number(),
    desc: v.string(),
    dst: v.optional(v.string()),
    timestamp: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const expense = await ctx.db.get(args.id);
    if (!expense || expense.userId !== userId) {
      throw new Error("Expense not found or unauthorized");
    }

    const { id, ...updateData } = args;
    await ctx.db.patch(id, updateData);
  },
});

export const updateDeposit = mutation({
  args: {
    id: v.id("deposits"),
    amount: v.number(),
    desc: v.string(),
    by: v.optional(v.string()),
    timestamp: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const deposit = await ctx.db.get(args.id);
    if (!deposit || deposit.userId !== userId) {
      throw new Error("Deposit not found or unauthorized");
    }

    const { id, ...updateData } = args;
    await ctx.db.patch(id, updateData);
  },
});
