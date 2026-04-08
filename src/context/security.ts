import { TenantContext } from './tenant-context';

export function authorize(tenantContext: TenantContext, requiredRole: string) {
  if (!tenantContext.roles.includes(requiredRole)) {
    throw new Error(`Forbidden: role ${requiredRole} required`);
  }
}
