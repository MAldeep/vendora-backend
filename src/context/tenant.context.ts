import { AsyncLocalStorage } from "node:async_hooks";

export interface TenantStore {
  tenantId: string;
}

export const tenantStorage = new AsyncLocalStorage<TenantStore>();

export function getTenantId(): string | undefined {
  const store = tenantStorage.getStore();
  return store?.tenantId;
}
