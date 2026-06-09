export default function EmptyState({ text = 'No hay datos para mostrar.' }: { text?: string }) {
  return (
    <div className="w-full py-12 text-center text-sm text-gray-500 border rounded">
      {text}
    </div>
  );
}
