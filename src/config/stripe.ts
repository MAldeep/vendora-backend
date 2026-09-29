import Stripe from "stripe";
import { env } from "./env.js";
const stripeSecretKey = env.STRIPE_SECRET_KEY;
if (stripeSecretKey) {
  throw new Error("Secret key of stripe not founded");
}

export const stripe = new Stripe(stripeSecretKey, {
  apiVersion: "2026-08-26.dahlia",
  typescript: true,
});
