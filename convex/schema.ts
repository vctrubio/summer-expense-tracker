import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

const applicationTables = {
  expenses: defineTable({
    timestamp: v.number(),
    amount: v.number(),
    desc: v.string(),
    dst: v.optional(v.string()), // destination owner (can be empty string)
    userId: v.id("users"),
  })
    .index("by_user", ["userId"])
    .index("by_user_and_timestamp", ["userId", "timestamp"]),

  deposits: defineTable({
    timestamp: v.number(),
    amount: v.number(),
    desc: v.string(),
    by: v.optional(v.string()), // owner who made the deposit (can be empty string)
    userId: v.id("users"),
  })
    .index("by_user", ["userId"])
    .index("by_user_and_timestamp", ["userId", "timestamp"]),


  owners: defineTable({
    name: v.string(),
    userId: v.id("users"),
  })
    .index("by_user", ["userId"])
    .index("by_user_and_name", ["userId", "name"]),
};

export default defineSchema({
  ...authTables,
  ...applicationTables,
});
