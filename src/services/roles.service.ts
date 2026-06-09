// src/services/roles.service.ts
import API from './api';

export type Role = {
  id: number;
  name: string;
  description?: string | null;
};

export async function listRoles() {
  const res = await API.get<Role[]>('/roles'); // protegido por permiso "roles.manage"
  return res.data;
}
