import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

const applicationTables = {
  expenses: defineTable({
    timestamp: v.number(),
    amount: v.number(),
    desc: v.string(),
    dst: v.optional(v.string()), // destination owner (can be empty string)
  })
    .index("by_timestamp", ["timestamp"]),

  deposits: defineTable({
    timestamp: v.number(),
    amount: v.number(),
    desc: v.string(),
    by: v.optional(v.string()), // owner who made the deposit (can be empty string)
  })
    .index("by_timestamp", ["timestamp"]),

  owners: defineTable({
    name: v.string(),
  })
    .index("by_name", ["name"]),
};

export default defineSchema({
  ...authTables,
  ...applicationTables,
});
