export function ScheduleSkeleton() {
  return (
    <div aria-busy="true" className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="h-32 animate-pulse rounded-xl bg-gray-100" />
      ))}
    </div>
  );
}
