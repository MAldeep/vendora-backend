import Stripe from "stripe";
import { env } from "./env.js";

if (!env.STRIPE_SECRET_KEY) {
  throw new Error("STRIPE_SECRET_KEY is missing in environment variables");
}

export const stripe = new Stripe(env.STRIPE_SECRET_KEY, {
  apiVersion: "2026-08-26.dahlia",
  typescript: true,
});
