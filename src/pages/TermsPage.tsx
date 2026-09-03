// src/pages/TermsPage.tsx
import type { ReactNode } from 'react';
import { PageContainer } from '@/layout/PageContainer';
import { RouteMeta } from '@/components/RouteMeta';
import { CONTACT_EMAIL_DISPLAY } from '@/config/contact';
import { useContactMailto } from '@/hooks/useContactMailto';

const LAST_UPDATED = '2026-08-30'; // placeholder — owner confirms the real ship date, see PRD §8

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="text-xl font-semibold text-ink">{title}</h2>
      <div className="space-y-3 text-sm leading-6 text-body">{children}</div>
    </section>
  );
}

export function TermsPage() {
  const emailHref = useContactMailto();

  return (
    <PageContainer chrome="full">
      <RouteMeta
        title="Terms of Use"
        description="Terms governing use of tejitpabari.com, a personal portfolio: no company, no warranty, and information on how hosted projects and outbound links are treated."
        path="/terms"
      />
      <div className="mx-auto max-w-2xl space-y-8">
        <header className="space-y-1">
          <h1 className="text-3xl font-semibold text-ink">Terms of Use</h1>
          <p className="text-sm text-slate">Last updated: {LAST_UPDATED}</p>
        </header>

        <p className="text-sm leading-6 text-body">
          This site, tejitpabari.com, is operated by me, Tejit Pabari, as a personal portfolio,
          not a company. By using it, you agree to the following.
        </p>

        <Section title="Not medical or professional advice">
          <p>
            Nothing on this site, including anything about Juno (an AI companion for medical
            appointments that I founded, with its own separate site and terms at
            meetjuno.health), constitutes medical advice. Nothing here should be used to make a
            medical, treatment, engineering, or business decision. This site is a portfolio: it
            describes and links to things I have built, and does not itself provide any medical,
            clinical, or other professional service. If you are looking for Juno as a product, go
            to meetjuno.health directly; that site's own terms and privacy policy govern its use,
            not this page.
          </p>
        </Section>

        <Section title="What this covers">
          <p>
            These terms cover tejitpabari.com and everything hosted directly under this domain.
            Project and research pages here link out to where each thing actually lives, rather
            than hosting it on this domain itself. A project hosted elsewhere, on its own domain
            or subdomain, is governed by that project's own terms, not this page.
          </p>
        </Section>

        <Section title="No forms, today">
          <p>
            As of the date above, this site has no forms, accounts, or logins anywhere, and does
            not accept anything you submit. If that ever changes, I will update this page before
            it ships, not after. See <code>/privacy</code> for the same commitment, stated in more
            detail.
          </p>
        </Section>

        <Section title="No warranty">
          <p>
            This site, and every project on it, is provided "as is," without warranty of any kind.
            I do not represent that anything here is accurate, complete, current, uninterrupted,
            or error-free. These are personal projects built around a full-time job; please treat
            them accordingly, and do not rely on them for anything important without checking
            independently.
          </p>
        </Section>

        <Section title="Project licences">
          <p>
            Some projects on this site are open source and link to their own repository, which
            may carry its own software licence. Where that is the case, the project's own licence
            governs use of its code; this page does not override it. Where a project does not
            state a licence, do not assume you are free to reuse its code.
          </p>
        </Section>

        <Section title="Links to other sites">
          <p>
            This site links to other websites, tools, and profiles, including GitHub and
            LinkedIn. A link does not mean I endorse, vouch for, or am affiliated with the
            destination beyond what is explicitly stated. I am not responsible for the content or
            practices of anything I link to.
          </p>
        </Section>

        <Section title="My views are my own">
          <p>
            I have a full-time position as a software engineer at Microsoft. Everything on this
            site, including its content, opinions, and the projects it links to, reflects my own
            personal work and views, done on my own time; it does not represent Microsoft's views
            or work. Juno is a separate company with its own site; this portfolio only links to
            it, and is not where Juno operates.
          </p>
        </Section>

        <Section title="Changes">
          <p>
            I may change, update, or take down this site or any project on it at any time,
            without notice. I may also update these terms; the date above reflects the most
            recent change.
          </p>
        </Section>

        <Section title="Contact">
          <p>
            For questions about these terms, contact me:{' '}
            {emailHref ? (
              <a href={emailHref} className="font-semibold text-teal-secondary underline">
                {CONTACT_EMAIL_DISPLAY}
              </a>
            ) : (
              <span className="select-all font-semibold">{CONTACT_EMAIL_DISPLAY}</span>
            )}
            .
          </p>
        </Section>
      </div>
    </PageContainer>
  );
}
