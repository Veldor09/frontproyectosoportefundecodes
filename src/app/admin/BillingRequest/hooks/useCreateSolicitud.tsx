// src/app/admin/Billing/hooks/useCreateSolicitud.tsx
"use client";

import { useCallback, useState } from "react";
import {
  createSolicitud,
  type CreateSolicitudPayload,
  type Solicitud,
} from "../services/solicitudes.api";

type Opts = {
  onSuccess?: (data: Solicitud) => void;
  onError?: (err: unknown) => void;
};

export function useCreateSolicitud(opts?: Opts) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<unknown>(null);

  const create = useCallback(async (payload: CreateSolicitudPayload) => {
    setLoading(true);
    setError(null);
    try {
      const data = await createSolicitud(payload); // 👉 POST /solicitudes (multipart con 'archivos')
      opts?.onSuccess?.(data);
      return data;
    } catch (e) {
      setError(e);
      opts?.onError?.(e);
      throw e;
    } finally {
      setLoading(false);
    }
  }, [opts]);

  return { create, loading, error };
}

export default useCreateSolicitud;
