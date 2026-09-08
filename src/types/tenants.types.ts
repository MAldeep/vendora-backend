export interface UpdateTenantInput {
  id: string;
  name?: string;
  slug?: string;
}

export interface ToggleTenantStatusInput {
  id: string;
}

export interface DeleteTenantInput {
  id: string;
}
