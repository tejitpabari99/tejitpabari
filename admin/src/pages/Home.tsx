import { Link } from 'react-router-dom';

const CARDS = [
  { to: '/ideas', name: 'Ideas', desc: 'A running list of project ideas: browse, search, and expand.' },
  { to: '/links', name: 'Links', desc: 'Personal URL shortener: manage short links at go.tejitpabari.com.' },
];

export default function Home() {
  return (
    <div className="mx-auto max-w-4xl py-10">
      <h1 className="mb-1 text-2xl font-bold text-teal">Projects</h1>
      <p className="mb-8 text-sm text-slate">Personal tools.</p>
      <div className="grid gap-4 sm:grid-cols-2">
        {CARDS.map((c) => (
          <Link key={c.to} to={c.to} className="rounded-card bg-sage p-5 transition hover:opacity-90">
            <span className="block text-lg font-semibold text-teal">{c.name}</span>
            <span className="mt-1 block text-sm text-body">{c.desc}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
