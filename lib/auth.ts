import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { nextCookies } from "better-auth/next-js";
import { MongoClient } from "mongodb";

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  throw new Error("MONGODB_URI is not defined in environment variables");
}

// Dedicated MongoClient for Better Auth's collections (user, session, account,
// verification). Shares the same database as the Mongoose models. The driver
// connects lazily on first operation, so no top-level await is required.
// Cached on globalThis so dev hot-reload / serverless reuse doesn't open a new
// client on every module evaluation.
const globalForAuth = globalThis as unknown as { authMongoClient?: MongoClient };
const client = globalForAuth.authMongoClient ?? new MongoClient(MONGODB_URI);
if (!globalForAuth.authMongoClient) globalForAuth.authMongoClient = client;

export const auth = betterAuth({
  database: mongodbAdapter(client.db()),
  emailAndPassword: {
    enabled: true,
    autoSignIn: true,
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // refresh daily
  },
  // Keeps set-cookie headers working from server actions / route handlers.
  plugins: [nextCookies()],
});
