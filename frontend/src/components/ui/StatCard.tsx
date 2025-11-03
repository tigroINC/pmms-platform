export default function StatCard({ title, value, sub }:{ title:string; value:string|number; sub?:string }){
  return (
    <div className="rounded-lg border p-3 bg-white/50 dark:bg-white/5">
      <div className="text-xs text-gray-500 mb-1">{title}</div>
      <div className="flex items-baseline gap-2">
        <div className="text-2xl font-semibold">{value}</div>
        {sub && <div className="text-xs text-gray-400">{sub}</div>}
      </div>
    </div>
  );
}
