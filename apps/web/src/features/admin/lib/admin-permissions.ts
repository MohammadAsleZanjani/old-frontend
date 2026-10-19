export interface AdminAccessSnapshot {
  isSuperAdmin: boolean;
  permissions: string[];
}

const legacyPermissionByPrefix: Record<string, string> = {
  "acquisition.": "referrals.manage",
  "localization.": "translations.manage",
  "notifications.": "notifications.manage",
  "promotions.": "promotions.manage",
  "referrals.": "referrals.manage",
  "reports.": "system.health.view",
  "roles.": "roles.manage",
  "seo.": "settings.manage",
  "settings.": "settings.manage",
  "users.": "users.manage",
  "wheel.": "wheel.manage",
};

export function hasAdminPermission(
  access: AdminAccessSnapshot | null | undefined,
  permission: string,
) {
  if (!access) return false;
  if (access.isSuperAdmin || access.permissions.includes(permission)) return true;

  const legacyPermission = Object.entries(legacyPermissionByPrefix)
    .find(([prefix]) => permission.startsWith(prefix))?.[1];
  return Boolean(legacyPermission && access.permissions.includes(legacyPermission));
}

export function hasAnyAdminPermission(
  access: AdminAccessSnapshot | null | undefined,
  permissions: string[],
) {
  return permissions.some((permission) => hasAdminPermission(access, permission));
}
