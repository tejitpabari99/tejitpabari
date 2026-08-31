// src/pages/HomePage.tsx
export function HomePage() {
  return (
    <div className="mx-auto w-full max-w-content px-6 pb-20 pt-32 sm:px-8 sm:pt-36 md:px-10 lg:px-12">
      <section className="flex flex-col items-start gap-4">
        <p className="text-[0.72rem] font-semibold uppercase tracking-wide text-teal-secondary">
          Tejit Pabari
        </p>
        <h1 className="text-[2rem] font-extrabold tracking-tight text-ink sm:text-[2.6rem]">
          Health-tech builder — hero copy lands in SP03.
        </h1>
      </section>

      <section id="projects" className="mt-24 scroll-mt-24">
        <h2 className="text-xl font-bold text-ink">Projects — filled in by SP03/SP04</h2>
      </section>

      <section id="work-experience" className="mt-24 scroll-mt-24">
        <h2 className="text-xl font-bold text-ink">Work Experience — filled in by SP03</h2>
      </section>

      <section id="about" className="mt-24 scroll-mt-24">
        <h2 className="text-xl font-bold text-ink">About — filled in by SP03</h2>
      </section>

      <section id="contact" className="mt-24 scroll-mt-24">
        <h2 className="text-xl font-bold text-ink">Contact — filled in by SP03</h2>
      </section>
    </div>
  );
}
