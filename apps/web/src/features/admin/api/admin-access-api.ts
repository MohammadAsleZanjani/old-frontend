import { adminApiBlobRequest, adminApiRequest } from "./admin-api-request";

export type UserStatus = "ACTIVE" | "INACTIVE" | "PENDING_VERIFICATION" | "SUSPENDED";
export type UserKycStatus = "APPROVED" | "NOT_STARTED" | "PENDING" | "REJECTED";

export interface AccessQuery {
  deleted?: "with" | "only" | "without";
  page?: number;
  pageSize?: number;
  kycStatus?: UserKycStatus;
  registeredFrom?: string;
  registeredTo?: string;
  role?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  status?: UserStatus;
}

export interface PermissionItem {
  action: string;
  createdAt: string;
  description?: string | null;
  id: string;
  key: string;
  module: string;
  updatedAt: string;
}

export type PermissionGroups = Record<string, PermissionItem[]>;

export interface RoleItem {
  _count?: { users: number };
  createdAt: string;
  deletedAt?: string | null;
  description?: string | null;
  id: string;
  isSystem: boolean;
  name: string;
  permissions?: Array<{ permission: PermissionItem; permissionId: string; roleId: string }>;
  updatedAt: string;
}

export interface UserItem {
  _count: {
    orders: number;
    silverOrders: number;
    walletTransactions: number;
  };
  createdAt: string;
  deletedAt?: string | null;
  email?: string | null;
  emailVerifiedAt?: string | null;
  failedLoginCount: number;
  id: string;
  kycProfile?: {
    status: "APPROVED" | "NOT_STARTED" | "PENDING" | "REJECTED";
    verifiedAt?: string | null;
  } | null;
  lastLoginAt?: string | null;
  lockedUntil?: string | null;
  mobile?: string | null;
  mobileVerifiedAt?: string | null;
  profile?: {
    displayName?: string | null;
    firstName?: string | null;
    idCardNo?: string | null;
    lastName?: string | null;
    locale?: string | null;
    timezone?: string | null;
  } | null;
  roleMappings: Array<{ role: RoleItem; roleId: string; userId: string }>;
  shoppingCreditAccount?: { balance: string } | null;
  status: UserStatus;
  updatedAt: string;
  wallets: Array<{
    balance: string;
    currency: "SILVER_GRAM" | "TOMAN";
    locked: string;
  }>;
}

export interface AccessPage<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface UserStats {
  active: number;
  deleted: number;
  inactive: number;
  kycApproved: number;
  kycNotStarted: number;
  kycPending: number;
  kycRejected: number;
  pendingVerification: number;
  suspended: number;
  total: number;
}

export interface UserAccessPage extends AccessPage<UserItem> {
  stats: UserStats;
}

export interface CreateAdminStaffInput {
  email: string;
  firstName?: string;
  lastName?: string;
  mobile?: string;
  password: string;
  roleIds: string[];
}

export function getAdminUsers(query: AccessQuery = {}) {
  return accessRequest<UserAccessPage>("/admin/users", query);
}

export function exportAdminUsers(query: AccessQuery = {}) {
  return adminApiBlobRequest("/admin/users/export", { query });
}

export function getAdminStaff(query: AccessQuery = {}) {
  return accessRequest<UserAccessPage>("/admin/staff", query);
}

export function getAdminUser(id: string) {
  return accessRequest<UserItem>(`/admin/users/${id}`);
}

export function getAdminRoles(query: AccessQuery = {}) {
  return accessRequest<AccessPage<RoleItem>>("/admin/access/roles", query);
}

export function getAdminPermissions() {
  return accessRequest<PermissionGroups>("/admin/access/permissions");
}

export function createAdminStaff(input: CreateAdminStaffInput) {
  return accessRequest<UserItem>("/admin/staff", undefined, { body: input, method: "POST" });
}

export function createAdminRole(input: { description?: string; name: string; permissionKeys?: string[] }) {
  return accessRequest<RoleItem>("/admin/access/roles", undefined, { body: input, method: "POST" });
}

export function updateAdminRole(id: string, input: { description?: string; isSystem?: boolean }) {
  return accessRequest<RoleItem>(`/admin/access/roles/${id}`, undefined, { body: input, method: "PATCH" });
}

export function assignAdminRolePermissions(id: string, permissionKeys: string[]) {
  return accessRequest<RoleItem>(`/admin/access/roles/${id}/permissions`, undefined, { body: { permissionKeys }, method: "PATCH" });
}

export function deleteAdminRole(id: string) {
  return accessRequest<{ deleted: boolean }>(`/admin/access/roles/${id}`, undefined, { method: "DELETE" });
}

export function restoreAdminRole(id: string) {
  return accessRequest<RoleItem>(`/admin/access/roles/${id}/restore`, undefined, { method: "PATCH" });
}

export function updateAdminUserStatus(id: string, status: UserStatus) {
  return accessRequest<UserItem>(`/admin/users/${id}/status`, undefined, { body: { status }, method: "PATCH" });
}

export function updateAdminUserProfile(id: string, input: { firstName?: string; idCardNo?: string; lastName?: string; mobile?: string }) {
  return accessRequest<UserItem>(`/admin/users/${id}/profile`, undefined, { body: input, method: "PATCH" });
}

export function assignAdminUserRoles(id: string, roleIds: string[]) {
  return accessRequest<UserItem>(`/admin/users/${id}/roles`, undefined, { body: { roleIds }, method: "PATCH" });
}

export function deleteAdminUser(id: string) {
  return accessRequest<UserItem>(`/admin/users/${id}`, undefined, { method: "DELETE" });
}

export function restoreAdminUser(id: string) {
  return accessRequest<UserItem>(`/admin/users/${id}/restore`, undefined, { method: "PATCH" });
}

export function revokeAdminUserSessions(id: string) {
  return accessRequest<{ revokedSessions: number }>(`/admin/users/${id}/revoke-sessions`, undefined, { method: "PATCH" });
}

async function accessRequest<T>(path: string, query?: AccessQuery, init: { body?: unknown; method?: string } = {}) {
  return adminApiRequest<T>(path, { body: init.body, method: init.method, query });
}
