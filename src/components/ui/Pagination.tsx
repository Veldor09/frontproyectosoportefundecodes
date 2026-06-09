'use client';
export default function Pagination({
  page,
  pageSize,
  total,
  onPageChange,
}: {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (next: number) => void;
}) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const canPrev = page > 1;
  const canNext = page < totalPages;

  return (
    <div className="flex items-center justify-between gap-3 py-2">
      <span className="text-sm">Página {page} de {totalPages} · {total} registros</span>
      <div className="flex gap-2">
        <button onClick={() => canPrev && onPageChange(page - 1)} className="px-3 py-1 rounded border disabled:opacity-50" disabled={!canPrev}>Anterior</button>
        <button onClick={() => canNext && onPageChange(page + 1)} className="px-3 py-1 rounded border disabled:opacity-50" disabled={!canNext}>Siguiente</button>
      </div>
    </div>
  );
}
