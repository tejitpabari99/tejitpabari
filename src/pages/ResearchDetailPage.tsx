// src/pages/ResearchDetailPage.tsx
import { useParams } from 'react-router-dom';
import { BackButton } from '@/components/BackButton';

export function ResearchDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  return (
    <div className="mx-auto w-full max-w-content px-6 pb-20 pt-28 sm:px-8 sm:pt-32 md:px-10 lg:px-12">
      <BackButton />
      <h1 className="mt-6 text-2xl font-bold text-ink">Research detail — filled in by SP04</h1>
      <p className="mt-2 text-body">slug: {slug}</p>
    </div>
  );
}
