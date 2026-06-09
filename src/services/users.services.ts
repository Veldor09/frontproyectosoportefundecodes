// src/services/users.service.ts
import API from './api';

export type UserRole = {
  id: number;
  name: string;
  description?: string | null;
};

export type UserItem = {
  id: number;
  email: string;
  name?: string | null;
  verified: boolean;
  approved: boolean;
  roles: { role: UserRole }[]; // <-- coincide con tu backend
  createdAt: string;
};

export type PaginatedUsers = {
  total: number;
  page: number;
  limit: number;
  items: UserItem[];
};

export async function listUsers(params?: {
  page?: number;
  limit?: number;
  search?: string;
  verified?: boolean;
  role?: string;
}) {
  const res = await API.get<PaginatedUsers>('/admin/users', { params });
  return res.data;
}

export async function getUser(userId: number) {
  const res = await API.get<UserItem>(`/admin/users/${userId}`);
  return res.data;
}

export async function getUserRoles(userId: number) {
  const res = await API.get<UserRole[]>(`/admin/users/${userId}/roles`);
  return res.data;
}

/** Asignar varios roles por ID */
export async function assignRoles(userId: number, roleIds: number[]) {
  const res = await API.post<UserRole[]>(`/admin/users/${userId}/roles`, { roleIds });
  return res.data;
}

/** Quitar un rol por ID */
export async function removeRoleById(userId: number, roleId: number) {
  const res = await API.delete<UserRole[]>(`/admin/users/${userId}/roles/${roleId}`);
  return res.data;
}

/** Agregar rol por NOMBRE (compatibilidad con endpoints existentes) */
export async function addRoleByName(userId: number, roleName: string) {
  const res = await API.post<UserItem>(`/admin/users/${userId}/roles/${encodeURIComponent(roleName)}`);
  return res.data;
}

/** Quitar rol por NOMBRE */
export async function removeRoleByName(userId: number, roleName: string) {
  const res = await API.delete<UserItem>(`/admin/users/${userId}/roles/${encodeURIComponent(roleName)}`);
  return res.data;
}

/** ✅ Aprobar / desaprobar usuario */
export async function approveUser(userId: number, approved: boolean) {
  const res = await API.patch<UserItem>(`/admin/users/${userId}/approve`, { approved });
  return res.data;
}

/** ✅ Verificar / desverificar usuario */
export async function verifyUser(userId: number, verified: boolean) {
  const res = await API.patch<UserItem>(`/admin/users/${userId}/verify`, { verified });
  return res.data;
}

/** Eliminar usuario */
export async function deleteUser(userId: number) {
  const res = await API.delete(`/admin/users/${userId}`);
  return res.data;
}
