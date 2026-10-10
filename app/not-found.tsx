import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#090b0e] text-slate-100 flex flex-col items-center justify-center p-4">
      <h2 className="text-2xl font-bold font-cinzel text-amber-400 mb-2">404 — Страница не найдена</h2>
      <p className="text-sm text-slate-400 mb-6">Запрошенная страница не существует или была перемещена.</p>
      <Link
        href="/"
        className="px-4 py-2 rounded-lg bg-gradient-to-r from-[#aa8222] to-[#8c7241] text-slate-950 font-bold text-xs"
      >
        Вернуться в LFG
      </Link>
    </div>
  );
}
