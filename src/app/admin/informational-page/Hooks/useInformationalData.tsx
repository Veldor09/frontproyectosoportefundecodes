"use client";

import { useCallback, useEffect, useState } from "react";
import type { InformationalPage } from "../types/informational";
import { getInformationalPage, updateInformationalPage } from "../services/informational.service";

const DEFAULTS: InformationalPage = {
  vision: { title: "Nuestra Visión", content: "", imageUrl: "/imagenes/vision.jpg" },
  mission:{ title: "Nuestra Misión", content: "", imageUrl: "/imagenes/mision.jpg" },
  collaborators: [],
  comments: [],
};

export function useInformationalData() {
  const [data, setData] = useState<InformationalPage>(DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getInformationalPage();
      setData({ ...DEFAULTS, ...res });
    } catch (e: any) {
      setError(e?.message || "Error al cargar");
    } finally {
      setLoading(false);
    }
  }, []);

  const save = useCallback(async (payload: InformationalPage) => {
    setSaving(true);
    setError(null);
    try {
      const res = await updateInformationalPage(payload);
      setData({ ...DEFAULTS, ...res });
      return res;
    } catch (e: any) {
      setError(e?.message || "Error al guardar");
      throw e;
    } finally {
      setSaving(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { data, setData, loading, saving, error, refresh, save };
}
