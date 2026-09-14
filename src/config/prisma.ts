import { PrismaClient } from "@prisma/client";
import { env } from "./env.js";
import { getTenantId } from "../context/tenant.context.js";

declare global {
  var prismaGlobal: PrismaClient | undefined;
}

const basePrisma =
  globalThis.prismaGlobal ??
  new PrismaClient({
    log:
      env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });

if (env.NODE_ENV !== "production") {
  globalThis.prismaGlobal = basePrisma;
}

const TENANT_SCOPED_MODELS = [
  "Product",
  "Order",
  "Category",
  "Customer",
  "InventoryItem",
];

export const prisma = basePrisma.$extends({
  query: {
    $allModels: {
      async $allOperations({ model, operation, args, query }) {
        if (model && TENANT_SCOPED_MODELS.includes(model)) {
          const tenantId = getTenantId();

          if (!tenantId) {
            throw new Error(
              `[Tenant Security Error]: Tenant context is missing for model execution: ${model}`,
            );
          }

          const queryArgs = args as any;

          if (
            operation.startsWith("find") ||
            operation.startsWith("update") ||
            operation.startsWith("delete") ||
            operation === "count" ||
            operation === "aggregate"
          ) {
            queryArgs.where = {
              ...(queryArgs.where || {}),
              tenantId,
            };
          }

          if (operation === "create") {
            queryArgs.data = {
              ...(queryArgs.data || {}),
              tenantId,
            };
          }

          if (operation === "createMany" && Array.isArray(queryArgs.data)) {
            queryArgs.data = queryArgs.data.map((item: any) => ({
              ...item,
              tenantId,
            }));
          }
        }

        return query(args);
      },
    },
  },
});

export default prisma;
