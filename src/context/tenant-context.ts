export interface TenantContext {
  tenantId: string;
  userId: string;
  roles: string[];
}

export function ensureTenantIsolation(
  tenantContext: TenantContext,
  expectedTenantId: string
) {
  if (tenantContext.tenantId !== expectedTenantId) {
    throw new Error('Tenant isolation violation');
  }
}
