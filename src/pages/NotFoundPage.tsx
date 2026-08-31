// src/pages/NotFoundPage.tsx
import { BackButton } from '@/components/BackButton';

export function NotFoundPage() {
  return (
    <div className="mx-auto flex w-full max-w-content flex-col items-center gap-4 px-6 py-32 text-center">
      <h1 className="text-2xl font-bold text-ink">Page not found</h1>
      <p className="text-body">The page you&rsquo;re looking for doesn&rsquo;t exist or may have moved.</p>
      <BackButton />
    </div>
  );
}
