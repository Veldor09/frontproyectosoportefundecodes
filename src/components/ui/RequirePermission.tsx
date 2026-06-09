'use client';

import { ReactNode, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getToken, hasPermissions } from '@/lib/auth';

type Props = {
  require: string[];      // permisos requeridos (AND lógico)
  fallbackHref?: string;  // a dónde redirigir si no cumple (default: /admin)
  children: ReactNode;
};

export default function RequirePermission({ require, fallbackHref = '/admin', children }: Props) {
  const router = useRouter();
  const [ok, setOk] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const token = getToken();
    if (!token || !hasPermissions(require, token)) {
      router.replace(fallbackHref);
      return;
    }
    setOk(true);
    setChecking(false);
  }, [router, require]);

  if (checking) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center text-gray-600">
        Verificando permisos…
      </div>
    );
  }

  if (!ok) return null; // por si acaso, aunque redirigimos arriba
  return <>{children}</>;
}
