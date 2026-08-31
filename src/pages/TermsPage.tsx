// src/pages/TermsPage.tsx
import type { ReactNode } from 'react';
import { RouteMeta } from '@/components/RouteMeta';
import { CONTACT_EMAIL_DISPLAY } from '@/config/contact';
import { useContactMailto } from '@/hooks/useContactMailto';

const LAST_UPDATED = '2026-08-30'; // placeholder — owner confirms the real ship date

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
    <div className="mx-auto max-w-content px-4 py-16 sm:px-6 lg:px-8">
      <RouteMeta
        title="Terms of Use"
        description="Terms governing use of tejitpabari.com, a personal portfolio — no company, no warranty, and how hosted projects and outbound links are treated."
        path="/terms"
      />
      <div className="mx-auto max-w-2xl space-y-8">
        <header className="space-y-1">
          <h1 className="text-3xl font-semibold text-ink">Terms of Use</h1>
          <p className="text-sm text-slate">Last updated: {LAST_UPDATED}</p>
        </header>

        <p className="text-sm leading-6 text-body">
          This site (tejitpabari.com) is run by me, Tejit Pabari, as a personal portfolio — not a
          company. By using it, you're agreeing to the following.
        </p>

        <Section title="This isn't professional or medical advice">
          <p>
            Nothing on this site — including anything about Juno, an AI companion for medical
            appointments that I founded and that has its own separate site and terms at
            meetjuno.health — is medical advice, and nothing here should be used to make a
            medical, treatment, engineering, or business decision. This site is a portfolio: it
            describes and links to things I've built. It doesn't provide any medical, clinical, or
            other professional service itself. If you're looking for Juno as a product, go to
            meetjuno.health directly — that site's own terms and privacy policy govern using it,
            not this page.
          </p>
        </Section>

        <Section title="What this covers">
          <p>
            These terms cover tejitpabari.com and everything hosted directly under this domain,
            including project pages I host myself at addresses like{' '}
            <code>/projects/&lt;name&gt;/live</code>. A project hosted elsewhere — its own domain
            or subdomain — is governed by that project's own terms, not this page.
          </p>
        </Section>

        <Section title="No forms, today">
          <p>
            As of the date above, this site has no forms, accounts, or logins anywhere, and
            doesn't accept anything you submit. If a future project I host here needs to change
            that, I'll update this page — and that project's own page — before it ships, not
            after. (See <code>/privacy</code> for the same commitment, stated in more detail.)
          </p>
        </Section>

        <Section title="No warranty">
          <p>
            This site, and every project on it, is provided "as is," without warranty of any
            kind. I don't promise that anything here is accurate, complete, current,
            uninterrupted, or error-free. These are personal projects built around a full-time
            job — please treat them accordingly, and don't rely on them for anything important
            without checking independently.
          </p>
        </Section>

        <Section title="Individual projects may carry their own licence">
          <p>
            Some projects on this site are open source and link to their own repository, which
            may carry its own software licence. Where that's the case, that project's own licence
            governs your use of its code — this page doesn't override it. Where a project doesn't
            state a licence, don't assume you're free to reuse its code.
          </p>
        </Section>

        <Section title="Links to other sites aren't endorsements">
          <p>
            This site links to other websites, tools, and profiles, including GitHub and
            LinkedIn. A link doesn't mean I endorse, vouch for, or am affiliated with the
            destination beyond what's explicitly stated. I'm not responsible for the content or
            practices of anything I link to.
          </p>
        </Section>

        <Section title="My views are my own">
          <p>
            I have a full-time job as a software engineer at Microsoft. Anything on this site —
            its content, opinions, and the projects it links to — reflects my own personal work
            and views, done on my own time; it doesn't represent Microsoft's views or work.
            Separately, Juno is its own company with its own site; this portfolio only links to
            it, it isn't where Juno operates.
          </p>
        </Section>

        <Section title="Changes">
          <p>
            I can change, update, or take down this site or any project on it at any time,
            without notice. I can also update these terms; the date above reflects the most
            recent change.
          </p>
        </Section>

        <Section title="Contact">
          <p>
            Questions about these terms? Email me:{' '}
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
    </div>
  );
}
