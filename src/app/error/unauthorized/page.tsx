'use client';

import { useRouter } from 'next/navigation';

export default function UnauthorizedPage() {
  const router = useRouter();
  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white shadow rounded-2xl p-8 text-center space-y-4">
        <div className="text-6xl">🔒</div>
        <h1 className="text-2xl font-bold text-gray-800">Acceso no autorizado</h1>
        <p className="text-gray-600">
          No tienes permisos para ver esta página.
        </p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={() => router.back()}
            className="px-4 py-2 rounded border"
          >
            Volver
          </button>
          <button
            onClick={() => router.push('/login')}
            className="px-4 py-2 rounded bg-teal-600 text-white"
          >
            Ir al inicio de sesión
          </button>
        </div>
        <p className="text-xs text-gray-400">
          Si crees que esto es un error, contacta a un administrador.
        </p>
      </div>
    </main>
  );
}
