export function AboutSection() {
  return (
    <section
      id="about"
      className="scroll-mt-24 bg-sage px-6 py-16 sm:px-8 sm:py-20 md:px-10 lg:px-12 lg:py-24"
    >
      <div className="mx-auto max-w-[640px] text-left">
        <h2 className="text-[1.75rem] font-extrabold leading-[0.97] tracking-tight text-ink sm:text-[2.15rem]">
          About
        </h2>
        <div className="mt-5 space-y-4 text-[0.92rem] leading-7 text-body">
          <p>
            I&rsquo;m a software engineer who ends up building things end to end &mdash;
            backend systems at Microsoft during the day, and a health-tech startup nights
            and weekends.
          </p>
          <p>
            At Microsoft, I&rsquo;m a Software Engineer II on the Fabric Maps team, where I
            work on the infrastructure and developer tools behind large-scale geospatial
            data.
          </p>
          <p>
            Outside of that, I&rsquo;m building Juno &mdash; an AI companion that helps
            patients walk into a doctor&rsquo;s appointment prepared, and walk out with a
            clear record of what was said and what to do next. It&rsquo;s early: I&rsquo;m
            validating the idea directly with patients and clinicians before scaling
            anything.
          </p>
          <p>
            Health tech isn&rsquo;t really a pivot for me &mdash; some of my first research,
            in college, was a self-testing app for HIV and syphilis and a
            pill-identification tool built from photos. Juno is the same instinct, aimed
            at a bigger problem.
          </p>
        </div>
      </div>
    </section>
  );
}
