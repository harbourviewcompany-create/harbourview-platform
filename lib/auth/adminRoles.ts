export const APP_ROLES = ['admin', 'operator', 'analyst', 'viewer'] as const;
export type AppRole = (typeof APP_ROLES)[number];

export const ADMIN_ALLOWED_ROLES = ['admin', 'operator'] as const;
export type AdminAllowedRole = (typeof ADMIN_ALLOWED_ROLES)[number];

export function isAppRole(role: string): role is AppRole {
  return (APP_ROLES as readonly string[]).includes(role);
}

export function isAdminAllowedRole(role: string): role is AdminAllowedRole {
  return (ADMIN_ALLOWED_ROLES as readonly string[]).includes(role);
}

export function hasAdminRole(roles: readonly string[] | null | undefined): boolean {
  if (!roles?.length) return false;
  return roles.some((role) => isAdminAllowedRole(role));
}
