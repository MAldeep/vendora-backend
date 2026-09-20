import { z } from "zod";

export const checkoutSchema = z.object({
  body: z
    .object({
      shippingAddress: z.object({
        fullName: z.string().min(2, "Full name is required"),
        street: z.string().min(3, "Street address is required"),
        city: z.string().min(2, "City is required"),
        state: z.string().optional(),
        postalCode: z.string().optional(),
        country: z.string().min(2, "Country is required"),
        phone: z.string().min(8, "Valid phone number is required"),
      }),

      paymentGateway: z.string().optional().default("COD"),
      sessionId: z.string().optional(),

      guestName: z.string().optional(),
      guestEmail: z.string().email("Invalid email format").optional(),
      guestPhone: z.string().optional(),
    })
    .refine(
      (data) => {
        return true;
      },
      {
        message: "Guest information is required for guest checkout",
      },
    ),
});
