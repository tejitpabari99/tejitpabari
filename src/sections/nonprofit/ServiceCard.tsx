import type { Service } from '@/config/nonprofit';

interface ServiceCardProps {
  service: Service;
  index: number;
  bg: string;
  border: string;
  badge: string;
}

export function ServiceCard({ service, index, bg, border, badge }: ServiceCardProps) {
  return (
    <article className={`flex h-full flex-col rounded-2xl border p-6 shadow-sm ${bg} ${border}`}>
      <span
        aria-hidden="true"
        className={`flex h-10 w-10 items-center justify-center rounded-full text-base font-extrabold ${badge}`}
      >
        {index + 1}
      </span>
      <h3 className="mt-4 text-lg font-bold text-ink">{service.title}</h3>
      <p className="mt-1 text-[0.9rem] font-medium text-body">{service.teaser}</p>
      <p className="mt-4 text-[0.94rem] leading-7 text-body">{service.body}</p>
    </article>
  );
}
