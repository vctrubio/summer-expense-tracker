import { query } from "./_generated/server";

export const checkJwtKey = query({
  handler: async () => {
    const jwtKey = process.env.JWT_PRIVATE_KEY;
    if (jwtKey) {
      return "SUCCESS: JWT_PRIVATE_KEY is set.";
    } else {
      return "ERROR: JWT_PRIVATE_KEY is NOT set.";
    }
  },
});
