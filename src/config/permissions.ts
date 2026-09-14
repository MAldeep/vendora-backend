import { Permission, TenantRole } from "@prisma/client";

export const DEFAULT_ROLE_PERMISSIONS: Record<
  Exclude<TenantRole, "CUSTOM">,
  Permission[]
> = {
  OWNER: [
    Permission.MANAGE_TENANT_SETTINGS,
    Permission.VIEW_ANALYTICS,
    Permission.CREATE_PRODUCT,
    Permission.UPDATE_PRODUCT,
    Permission.DELETE_PRODUCT,
    Permission.VIEW_PRODUCTS,
    Permission.MANAGE_ORDERS,
    Permission.VIEW_ORDERS,
    Permission.INVITE_USER,
    Permission.DELETE_USER,
  ],
  MANAGER: [
    Permission.VIEW_ANALYTICS,
    Permission.CREATE_PRODUCT,
    Permission.UPDATE_PRODUCT,
    Permission.DELETE_PRODUCT,
    Permission.VIEW_PRODUCTS,
    Permission.MANAGE_ORDERS,
    Permission.VIEW_ORDERS,
    Permission.INVITE_USER,
    Permission.DELETE_USER,
  ],
  INVENTORY_STAFF: [
    Permission.CREATE_PRODUCT,
    Permission.UPDATE_PRODUCT,
    Permission.VIEW_PRODUCTS,
  ],
  CUSTOMER_SERVICE: [
    Permission.VIEW_ORDERS,
    Permission.MANAGE_ORDERS,
    Permission.VIEW_PRODUCTS,
  ],
};
