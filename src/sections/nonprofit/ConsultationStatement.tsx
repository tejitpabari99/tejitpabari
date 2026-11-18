import { STATEMENT_HEADING, STATEMENT_TEXT } from '@/config/nonprofit';

export function ConsultationStatement() {
  return (
    <section className="px-8 py-12 md:px-10 lg:px-12">
      <div className="mx-auto w-full max-w-content">
        <h2 className="text-[1.5rem] font-extrabold tracking-tight text-ink sm:text-[1.8rem]">{STATEMENT_HEADING}</h2>
        <p className="mt-4 max-w-[40rem] text-[0.94rem] leading-7 text-body">{STATEMENT_TEXT}</p>
      </div>
    </section>
  );
}
