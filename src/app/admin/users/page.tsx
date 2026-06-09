'use client';

import Link from 'next/link';
import { ArrowLeft, Search, X, Plus } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';

import RequirePermission from '../components/RequirePermission';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import ConfirmModal, { type ConfirmState } from '@/components/ui/ConfirmModal';

import {
  listUsers,
  type UserItem,
  addRoleByName,
  removeRoleByName,
  assignRoles,
  approveUser,
  verifyUser,
  deleteUser,
} from '../../../services/users.services';
import { listRoles, type Role } from '../../../services/roles.service';

const canManageRoles = true;

function useDebouncedValue<T>(value: T, delay = 400) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

export default function UsersPage() {
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<UserItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);

  const [search, setSearch] = useState('');
  const [verified, setVerified] = useState<'all' | 'true' | 'false'>('all');
  const [roleFilter, setRoleFilter] = useState('');

  const [allRoles, setAllRoles] = useState<Role[]>([]);
  const [roleInputs, setRoleInputs] = useState<Record<number, string>>({});
  const [selectValues, setSelectValues] = useState<Record<number, number | ''>>({});

  const [confirm, setConfirm] = useState<ConfirmState | null>(null);

  const debouncedSearch = useDebouncedValue(search, 400);
  useEffect(() => { setPage(1); }, [debouncedSearch]);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await listUsers({
        page,
        limit,
        search: search || undefined,
        verified: verified === 'all' ? undefined : verified === 'true',
        role: roleFilter || undefined,
      });
      setItems(res.items);
      setTotal(res.total);
      if (canManageRoles) {
        const roles = await listRoles();
        setAllRoles(roles);
      }
    } catch {
      setError('No se pudieron cargar los usuarios');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [page, limit, debouncedSearch, verified, roleFilter]);

  async function onRemoveRole(userId: number, roleName: string) {
    try {
      await removeRoleByName(userId, roleName);
      toast.success('Rol quitado');
      await load();
    } catch { toast.error('No se pudo quitar el rol'); }
  }

  async function onAddRoleByName(userId: number) {
    const roleName = (roleInputs[userId] || '').trim();
    if (!roleName) return;
    try {
      await addRoleByName(userId, roleName);
      setRoleInputs((prev) => ({ ...prev, [userId]: '' }));
      toast.success('Rol agregado');
      await load();
    } catch { toast.error('No se pudo agregar el rol'); }
  }

  async function onAddRoleById(userId: number) {
    const roleId = selectValues[userId];
    if (!roleId || typeof roleId !== 'number') return;
    try {
      await assignRoles(userId, [roleId]);
      setSelectValues((prev) => ({ ...prev, [userId]: '' }));
      toast.success('Rol asignado');
      await load();
    } catch { toast.error('No se pudo asignar el rol'); }
  }

  async function onToggleApproved(userId: number, next: boolean) {
    try {
      await approveUser(userId, next);
      toast.success(next ? 'Usuario aprobado' : 'Aprobación removida');
      await load();
    } catch { toast.error('No se pudo actualizar'); }
  }

  async function onToggleVerified(userId: number, next: boolean) {
    try {
      await verifyUser(userId, next);
      toast.success(next ? 'Usuario verificado' : 'Verificación removida');
      await load();
    } catch { toast.error('No se pudo actualizar'); }
  }

  function onConfirmDelete(userId: number, userName: string) {
    setConfirm({
      title: '¿Eliminar usuario?',
      message: `Se eliminará permanentemente a "${userName}". Esta acción no se puede deshacer.`,
      confirmLabel: 'Eliminar',
      variant: 'danger',
      onConfirm: async () => {
        try {
          await deleteUser(userId);
          toast.success('Usuario eliminado');
          await load();
        } catch { toast.error('No se pudo eliminar el usuario'); }
      },
    });
  }

  function availableRolesFor(user: UserItem): Role[] {
    const assigned = new Set(user.roles?.map((r) => r.role.name) ?? []);
    return allRoles.filter((r) => !assigned.has(r.name));
  }

  const totalPages = Math.max(1, Math.ceil(total / limit));
  const canPrev = page > 1;
  const canNext = page < totalPages;

  return (
    <RequirePermission requireRoles={['admin']}>
      <div className="p-0">
        {/* Nav bar */}
        <div className="w-full bg-white border-b border-slate-200">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center py-4 sm:py-6">
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 tracking-tight">
                Gestión de Usuarios
              </h1>
              <p className="text-sm text-slate-500 mt-1">
                Administra cuentas, roles y permisos de los usuarios del sistema.
              </p>
            </div>
            <div className="hidden md:block">
              <div className="relative flex items-center justify-center h-14 pb-3">
                <Link href="/admin/Collaborators" className="absolute left-0">
                  <button className="bg-white text-slate-700 border border-slate-300 hover:bg-slate-50 hover:border-slate-400 shadow-sm transition-all duration-200 px-4 py-2 font-medium rounded-md text-sm flex items-center gap-2">
                    <ArrowLeft className="w-4 h-4" />
                    Volver a Colaboradores
                  </button>
                </Link>
              </div>
            </div>
            <div className="md:hidden pb-4">
              <Link href="/admin/Collaborators">
                <button className="w-full bg-white text-slate-700 border border-slate-300 hover:bg-slate-50 shadow-sm transition-all duration-200 px-4 py-2.5 font-medium rounded-md text-sm flex items-center justify-center gap-2">
                  <ArrowLeft className="w-4 h-4" />
                  Volver a Colaboradores
                </button>
              </Link>
            </div>
          </div>
        </div>

        {/* Contenido */}
        <div className="p-4 sm:p-6 max-w-7xl mx-auto">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-md p-4 sm:p-6 space-y-5">

            {/* Filtros */}
            <div className="flex flex-col sm:flex-row sm:items-end gap-3">
              <div className="flex-1">
                <label className="block text-sm font-medium text-slate-700 mb-1">Buscar</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    placeholder="Email o nombre…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="w-full sm:w-40">
                <label className="block text-sm font-medium text-slate-700 mb-1">Verificado</label>
                <select
                  value={verified}
                  onChange={(e) => { setVerified(e.target.value as any); setPage(1); }}
                  className="block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">Todos</option>
                  <option value="true">Sí</option>
                  <option value="false">No</option>
                </select>
              </div>
              <div className="w-full sm:w-44">
                <label className="block text-sm font-medium text-slate-700 mb-1">Rol</label>
                <select
                  value={roleFilter}
                  onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}
                  className="block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Todos</option>
                  {allRoles.map((r) => (
                    <option key={r.id} value={r.name}>{r.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Estado */}
            {loading && <p className="text-sm text-slate-500 py-4 text-center">Cargando usuarios…</p>}
            {error && <p className="text-sm text-red-500 py-4 text-center">{error}</p>}
            {!loading && !error && items.length === 0 && (
              <p className="text-sm text-slate-500 py-4 text-center">No se encontraron usuarios.</p>
            )}

            {/* Tabla desktop */}
            {!loading && !error && items.length > 0 && (
              <div className="hidden md:block overflow-x-auto">
                <table className="min-w-full text-sm border border-slate-200 rounded-lg">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold text-slate-700">ID</th>
                      <th className="px-4 py-3 text-left font-semibold text-slate-700">Email</th>
                      <th className="px-4 py-3 text-left font-semibold text-slate-700">Nombre</th>
                      <th className="px-4 py-3 text-left font-semibold text-slate-700">Estado</th>
                      <th className="px-4 py-3 text-left font-semibold text-slate-700">Roles</th>
                      <th className="px-4 py-3 text-left font-semibold text-slate-700">Agregar rol</th>
                      <th className="px-4 py-3 text-left font-semibold text-slate-700">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((u) => (
                      <tr key={u.id} className="border-b hover:bg-slate-50 transition align-top">
                        <td className="px-4 py-4 text-slate-500 text-xs">{u.id}</td>
                        <td className="px-4 py-4 text-slate-800 font-medium whitespace-nowrap">{u.email}</td>
                        <td className="px-4 py-4 text-slate-600 whitespace-nowrap">{u.name ?? '—'}</td>

                        {/* Estado: Aprobado + Verificado */}
                        <td className="px-4 py-4">
                          <div className="flex flex-col gap-1.5">
                            <button
                              onClick={() => onToggleApproved(u.id, !u.approved)}
                              className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold transition cursor-pointer ${
                                u.approved
                                  ? 'bg-green-100 text-green-700 hover:bg-green-200'
                                  : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                              }`}
                            >
                              {u.approved ? '✓ Aprobado' : '✗ No aprobado'}
                            </button>
                            <button
                              onClick={() => onToggleVerified(u.id, !u.verified)}
                              className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold transition cursor-pointer ${
                                u.verified
                                  ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                                  : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                              }`}
                            >
                              {u.verified ? '✓ Verificado' : '✗ No verificado'}
                            </button>
                          </div>
                        </td>

                        {/* Roles actuales */}
                        <td className="px-4 py-4">
                          <div className="flex flex-wrap gap-1">
                            {u.roles?.length ? (
                              u.roles.map((rel) => (
                                <span
                                  key={rel.role.name}
                                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-blue-100 text-blue-700 text-xs font-medium"
                                >
                                  {rel.role.name}
                                  <button
                                    type="button"
                                    onClick={() => onRemoveRole(u.id, rel.role.name)}
                                    className="hover:text-red-600 transition-colors"
                                    title="Quitar rol"
                                  >
                                    <X className="w-3 h-3" />
                                  </button>
                                </span>
                              ))
                            ) : (
                              <span className="text-slate-400 text-xs">Sin roles</span>
                            )}
                          </div>
                        </td>

                        {/* Agregar rol */}
                        <td className="px-4 py-4">
                          <div className="flex flex-col gap-2">
                            {/* Por nombre */}
                            <div className="flex gap-1">
                              <Input
                                placeholder="nombre del rol"
                                className="h-7 text-xs px-2 w-36"
                                value={roleInputs[u.id] ?? ''}
                                onChange={(e) =>
                                  setRoleInputs((prev) => ({ ...prev, [u.id]: e.target.value }))
                                }
                                onKeyDown={(e) => { if (e.key === 'Enter') onAddRoleByName(u.id); }}
                              />
                              <Button
                                size="sm"
                                onClick={() => onAddRoleByName(u.id)}
                                className="h-7 px-2 bg-teal-600 hover:bg-teal-700 text-white text-xs"
                              >
                                <Plus className="w-3 h-3" />
                              </Button>
                            </div>
                            {/* Por selector */}
                            {canManageRoles && availableRolesFor(u).length > 0 && (
                              <div className="flex gap-1">
                                <select
                                  className="block rounded-md border border-slate-300 bg-white px-2 py-1 text-xs text-slate-900 shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 w-36"
                                  value={selectValues[u.id] ?? ''}
                                  onChange={(e) =>
                                    setSelectValues((prev) => ({
                                      ...prev,
                                      [u.id]: e.target.value ? Number(e.target.value) : '',
                                    }))
                                  }
                                >
                                  <option value="">Selecciona…</option>
                                  {availableRolesFor(u).map((r) => (
                                    <option key={r.id} value={r.id}>{r.name}</option>
                                  ))}
                                </select>
                                <Button
                                  size="sm"
                                  onClick={() => onAddRoleById(u.id)}
                                  className="h-7 px-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs"
                                >
                                  <Plus className="w-3 h-3" />
                                </Button>
                              </div>
                            )}
                          </div>
                        </td>

                        {/* Acciones */}
                        <td className="px-4 py-4 whitespace-nowrap">
                          <Button
                            variant="destructive"
                            onClick={() => onConfirmDelete(u.id, u.name ?? u.email)}
                            className="bg-red-600 hover:bg-red-700 text-white text-xs px-3 py-1 h-auto"
                          >
                            Eliminar
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Tarjetas mobile */}
            {!loading && !error && items.length > 0 && (
              <div className="md:hidden space-y-3">
                {items.map((u) => (
                  <div key={u.id} className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-3">
                    <div className="flex justify-between items-start gap-2">
                      <div className="min-w-0">
                        <p className="font-semibold text-slate-800 truncate">{u.name ?? u.email}</p>
                        <p className="text-sm text-slate-500 truncate">{u.email}</p>
                      </div>
                      <div className="flex flex-col gap-1 shrink-0">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${u.approved ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                          {u.approved ? 'Aprobado' : 'No aprobado'}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${u.verified ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'}`}>
                          {u.verified ? 'Verificado' : 'No verificado'}
                        </span>
                      </div>
                    </div>

                    {u.roles?.length ? (
                      <div className="flex flex-wrap gap-1">
                        {u.roles.map((rel) => (
                          <span key={rel.role.name} className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-blue-100 text-blue-700 text-xs font-medium">
                            {rel.role.name}
                            <button onClick={() => onRemoveRole(u.id, rel.role.name)} className="hover:text-red-600">
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400">Sin roles</p>
                    )}

                    <div className="flex gap-2 pt-1 border-t border-slate-200">
                      <button
                        onClick={() => onToggleApproved(u.id, !u.approved)}
                        className="flex-1 rounded-md py-2 text-xs font-medium text-green-600 border border-green-200 hover:bg-green-50 transition-colors"
                      >
                        {u.approved ? 'Desaprobar' : 'Aprobar'}
                      </button>
                      <button
                        onClick={() => onToggleVerified(u.id, !u.verified)}
                        className="flex-1 rounded-md py-2 text-xs font-medium text-blue-600 border border-blue-200 hover:bg-blue-50 transition-colors"
                      >
                        {u.verified ? 'Desverificar' : 'Verificar'}
                      </button>
                      <button
                        onClick={() => onConfirmDelete(u.id, u.name ?? u.email)}
                        className="flex-1 rounded-md py-2 text-xs font-medium text-red-600 border border-red-200 hover:bg-red-50 transition-colors"
                      >
                        Eliminar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Paginación */}
            {!loading && total > 0 && (
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-0 sm:justify-between sm:items-center text-sm text-slate-600">
                <span>Mostrando {items.length} de {total} usuarios</span>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500 text-xs">Por página</span>
                    <select
                      value={String(limit)}
                      onChange={(e) => { setLimit(Number(e.target.value)); setPage(1); }}
                      className="block w-16 rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="5">5</option>
                      <option value="10">10</option>
                      <option value="20">20</option>
                      <option value="50">50</option>
                    </select>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" disabled={!canPrev} onClick={() => setPage(page - 1)}>Anterior</Button>
                    <span className="flex items-center text-xs text-slate-500">
                      {page} / {totalPages}
                    </span>
                    <Button size="sm" disabled={!canNext} onClick={() => setPage(page + 1)}>Siguiente</Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <ConfirmModal state={confirm} onClose={() => setConfirm(null)} />
      </div>
    </RequirePermission>
  );
}
