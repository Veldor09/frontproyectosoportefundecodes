"use client";

import { useCallback, useEffect, useState } from "react";
import type { InformationalPage } from "@/app/admin/informational-page/types/informational";
import { getInformationalPagePublic } from "./informational.service";

const DEFAULTS: InformationalPage = {
  vision:  { title: "Nuestra Visión",  content: "", imageUrl: "/imagenes/vision.jpg" },
  mission: { title: "Nuestra Misión",   content: "", imageUrl: "/imagenes/mision.jpg" },
  collaborators: [],
  comments: [],
};

export function useInformationalPublic() {
  const [data, setData] = useState<InformationalPage>(DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getInformationalPagePublic();
      setData({ ...DEFAULTS, ...res });
    } catch (e: any) {
      setError(e?.message || "Error al cargar");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  return { data, loading, error, refresh };
}
