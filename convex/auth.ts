import { convexAuth, getAuthUserId } from "@convex-dev/auth/server";
import { Password } from "@convex-dev/auth/providers/Password";
import { Anonymous } from "@convex-dev/auth/providers/Anonymous";
import { query } from "./_generated/server";

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [Password, Anonymous],
});

export const loggedInUser = query({
  handler: async (ctx) => {
    console.log("Checking for logged in user...");
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      console.log("No user ID found, user is not logged in.");
      return null;
    }
    console.log(`User ID found: ${userId}. Fetching user data...`);
    const user = await ctx.db.get(userId);
    if (!user) {
      console.log(`Could not find user data for ID: ${userId}.`);
      return null;
    }
    console.log(`User found and logged in: ${user.email}`);
    return user;
  },
});
