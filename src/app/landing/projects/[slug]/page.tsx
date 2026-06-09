"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { getProjectBySlug } from "@/services/projects.service";
import type { Project } from "@/lib/projects.types";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function ProjectDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const [item, setItem] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        if (typeof slug === "string" && slug.trim() !== "") {
          const p = await getProjectBySlug(slug);
          setItem(p);
        } else {
          setItem(null);
        }
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [slug]);

  if (loading) return <div className="container mx-auto p-6">Cargando…</div>;
  if (!item) return <div className="container mx-auto p-6">Proyecto no encontrado</div>;

  return (
    <div className="container mx-auto p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">{item.title}</h1>
        <Button asChild variant="secondary">
          <Link href="/landing/projects">Volver</Link>
        </Button>
      </div>

      {item.coverUrl && (
        <img
          src={item.coverUrl}
          alt={item.title}
          className="w-full max-h-[420px] object-cover rounded"
        />
      )}

      <div className="flex gap-2 flex-wrap">
        {item.place && <Badge>{item.place}</Badge>}
        {item.category && <Badge variant="secondary">{item.category}</Badge>}
        {item.area && <Badge variant="outline">{item.area}</Badge>}
        {item.status && <Badge variant="outline">{item.status}</Badge>}
        {item.published && <Badge variant="outline">Publicado</Badge>}
      </div>

      {item.summary && (
        <Card className="p-4">
          <h2 className="font-medium mb-2">Resumen</h2>
          <p className="text-sm text-muted-foreground whitespace-pre-line">{item.summary}</p>
        </Card>
      )}

      {item.content && (
        <Card className="p-4">
          <h2 className="font-medium mb-2">Descripción</h2>
          <div className="prose max-w-none whitespace-pre-line">{item.content}</div>
        </Card>
      )}
    </div>
  );
}
