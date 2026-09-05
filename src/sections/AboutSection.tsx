export function AboutSection() {
  return (
    <section
      id="about"
      className="scroll-mt-24 bg-sage px-8 py-16 sm:py-20 md:px-10 lg:px-12 lg:py-24"
    >
      <div className="mx-auto w-full max-w-content">
        <div className="max-w-[640px] text-left">
          <h2 className="text-[1.75rem] font-extrabold leading-[0.97] tracking-tight text-ink sm:text-[2.15rem]">
            About
          </h2>
          <div className="mt-5 space-y-4 text-[0.92rem] leading-7 text-body">
            <p>
              I&rsquo;m a software engineer. I like building things end to end, from backend
              to frontend, on whatever stack the problem calls for.
            </p>
            <p>
              At Microsoft, I&rsquo;m a Software Engineer II on the Fabric Maps team. I work
              on the infrastructure behind how geospatial data gets visualized and analyzed
              in Microsoft Fabric and Power BI.
            </p>
            <p>
              On the side, I build in health tech. Right now that&rsquo;s Juno, an AI
              companion that helps patients walk into a doctor&rsquo;s appointment prepared
              and walk out with a clear record of what was said and what to do next.
              It&rsquo;s early. I&rsquo;m still validating the idea with patients and
              clinicians.
            </p>
            <p>
              This isn&rsquo;t new for me. In college, I worked on a self-testing app for HIV
              and syphilis and a tool that identifies pills from photos. Juno picks up that
              same thread, aimed at a bigger problem.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
