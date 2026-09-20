import { OrderStatus } from "@prisma/client";
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

export const getTenantOrdersSchema = z.object({
  query: z
    .object({
      orderStatus: z.nativeEnum(OrderStatus).optional(),
      search: z.string().optional(),
      sort: z.string().optional(),
      page: z.string().optional(),
      limit: z.string().optional(),
    })
    .passthrough(),
});

export const updateOrderStatusSchema = z.object({
  params: z.object({
    orderId: z.string().uuid("Invalid Tenant Order ID format"),
  }),
  body: z.object({
    status: z.nativeEnum(OrderStatus, {
      error: "Order status is required",
    }),
  }),
});
