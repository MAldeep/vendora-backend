import { AsyncLocalStorage } from "node:async_hooks";
export const tenantStorage = new AsyncLocalStorage();
export function getTenantId() {
    const store = tenantStorage.getStore();
    return store?.tenantId;
}
