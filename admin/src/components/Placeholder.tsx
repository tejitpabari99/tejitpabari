// Stand-in page; replaced by real pages in later SP02 tasks.
export default function Placeholder({ name }: { name: string }) {
  return <p data-testid="page">{name}</p>;
}
