// src/pages/PrivacyPage.tsx
import { useEffect, useState, type ReactNode } from 'react';
import { PageContainer } from '@/layout/PageContainer';
import { RouteMeta } from '@/components/RouteMeta';
import { CONTACT_EMAIL_DISPLAY } from '@/config/contact';
import { useContactMailto } from '@/hooks/useContactMailto';
import { useConsent } from '@/context/ConsentContext';

const LAST_UPDATED = '2026-08-30'; // placeholder — owner confirms the real ship date, see PRD §8

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="text-xl font-semibold text-ink">{title}</h2>
      <div className="space-y-3 text-sm leading-6 text-body">{children}</div>
    </section>
  );
}

/**
 * The "Your consent choice" status line + Clear control. Root-cause fix for
 * "Clear my choice doesn't work" (PRD 05 §4.1): the old button rendered
 * unconditionally, including when consent was already 'unset': clicking it
 * then called localStorage.removeItem on a key that was never set and
 * setConsent('unset') on a value already 'unset', so nothing observable
 * happened; the status line read the same before and after. Fixed by (1)
 * only rendering the button when there's something to clear
 * (consent !== 'unset'), and (2) showing an explicit on-page confirmation
 * when it's clicked, rather than relying on a status line whose text may
 * already have read the same way pre-click.
 */
function ConsentStatus() {
  const { consent, clearConsent } = useConsent();
  const [justCleared, setJustCleared] = useState(false);

  // A fresh Accept/Decline (from the banner shown immediately below, which
  // reappears the instant consent becomes 'unset') supersedes the "Cleared"
  // confirmation.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (consent !== 'unset') setJustCleared(false);
  }, [consent]);

  function handleClear() {
    clearConsent();
    setJustCleared(true);
  }

  return (
    <>
      <p>
        Your saved analytics choice is currently{' '}
        <strong>{consent === 'unset' ? 'not set' : consent}</strong>.{' '}
        {consent === 'unset'
          ? 'There is nothing to clear yet. You will see the banner below the first time it has something to ask.'
          : 'You can clear this choice at any time. Clearing turns off Google Analytics for the rest of this visit, removes any analytics cookies already set on this device, and shows the banner again so you can decide again.'}
      </p>
      {consent !== 'unset' && (
        <button
          type="button"
          onClick={handleClear}
          className="rounded-full border border-teal-secondary/20 px-4 py-2 text-sm font-semibold text-teal-secondary hover:bg-teal-secondary/8"
        >
          Clear my choice
        </button>
      )}
      {justCleared && (
        <p role="status" className="text-sm font-semibold text-teal-secondary">
          Cleared. Your analytics choice has been reset, and Google Analytics is now off for the
          rest of this visit.
        </p>
      )}
      <p className="text-xs text-slate">
        Clearing your choice does not, and cannot, recall analytics data already sent to Google
        before you clear it. No website can undo that after the fact; this only changes what
        happens from this point forward.
      </p>
    </>
  );
}

export function PrivacyPage() {
  const emailHref = useContactMailto();

  return (
    <PageContainer chrome="full">
      <RouteMeta
        title="Privacy Policy"
        description="This is Tejit Pabari's personal portfolio: no company, no accounts, and no forms today. Here is what this site, and everything hosted under it, collects, and what your choices are."
        path="/privacy"
      />
      <div className="mx-auto max-w-2xl space-y-8">
        <header className="space-y-1">
          <h1 className="text-3xl font-semibold text-ink">Privacy Policy</h1>
          <p className="text-sm text-slate">Last updated: {LAST_UPDATED}</p>
        </header>

        <p className="text-sm leading-6 text-body">
          This is Tejit Pabari's personal portfolio site. There is no company behind it: it is not
          a registered business, and there is no "we." This policy explains, in plain language,
          what this site (and everything hosted directly under it) collects when you visit, and
          what your choices are.
        </p>

        <Section title="The short version">
          <p>
            This site has no accounts, no sign-up, and no login. As of the date above, it has no
            forms anywhere: there is nowhere on this site to type something and submit it to me.
            Two things are involved: optional analytics, through Google Analytics, which runs only
            if you accept the banner shown on your first visit; and basic web server logs that
            Firebase (my hosting provider, part of Google) generates automatically for every
            request. I do not access, analyze, or build anything on top of those logs.
          </p>
        </Section>

        <Section title="What this covers">
          <p>
            This policy covers tejitpabari.com and everything hosted directly under this domain,
            including project pages I have built and hosted myself at addresses such as{' '}
            <code>/projects/&lt;name&gt;/live</code>. If a project of mine lives on its own
            domain, such as meetjuno.health for Juno, that project has its own privacy policy, and
            this page does not speak for it. Where that applies, I link to the project's own
            policy from its page here.
          </p>
          <p>
            <strong>This is a standing commitment, not a one-time fact.</strong> As I add new
            hosted projects under <code>/projects/*/live</code>, one of them may eventually need
            to collect something this page does not currently describe, for example an input
            field. If that happens, I will update this page, and that project's own writeup,
            before the project goes live, not after. If you are reading this and a project you are
            using appears to ask for something this page does not describe, that is a gap in this
            page, not a hidden feature. Please email me (see Contact, below).
          </p>
        </Section>

        <Section title="What this site does not do">
          <ul className="list-disc space-y-1 pl-5">
            <li>No user accounts or login</li>
            <li>
              No forms of any kind, anywhere on the domain, as of the date above: nothing here to
              type into and submit
            </li>
            <li>No comments, uploads, or user-generated content</li>
            <li>No database that stores anything about you</li>
            <li>
              No sale of data, and no sharing of data with third parties for their own purposes
              (Google Analytics, described below, acts only as a service provider processing this
              site's own analytics)
            </li>
            <li>No advertising, ad tracking, or retargeting</li>
          </ul>
        </Section>

        <Section title="What this site does collect">
          <h3 className="text-base font-semibold text-ink">Google Analytics (optional)</h3>
          <p>
            I use Google Analytics 4 to see whether people find this site, for example whether a
            post I share on LinkedIn brings visitors here, and which projects people look at once
            they arrive. That is the only reason it is here.
          </p>
          <p>
            Google Analytics runs only if you select "Accept" on the banner. If you select
            "Decline," or do not respond, Google Analytics does not load, and no analytics cookies
            are set on your device.
          </p>
          <p>
            If you accept, Google Analytics collects information such as: which pages you view and
            how long you spend on them; an approximate location, estimated from your IP address
            (Google Analytics does not retain your full IP address); the type of device and
            browser you are using; and how you arrived at the site. It also records a small number
            of specific interactions I have chosen to track because they tell me something useful:
            which project or research card you click, which outbound link you follow (a live
            project, a paper, a GitHub repository, LinkedIn), whether you click through to my
            résumé, and, if you use the search box on <code>/projects</code> or{' '}
            <code>/research</code>, what you typed. I use this information to understand what
            visitors are looking for, not to identify who is looking. Google processes and stores
            this data as described in its own privacy policy (policies.google.com/privacy). I only
            ever see aggregated reports, never an individual visitor's browsing history.
          </p>
          <p>
            <strong>A note on the search box:</strong> it is not a form. What you type is used
            locally, in your browser, to filter the list as you type, and is not sent to a server
            or stored by me directly. If you have accepted analytics, the text you search for is
            also sent to Google Analytics as an event, so I can see what visitors are looking for.
            Please avoid typing anything personal into it: it is the one place on this site where
            typed text can be logged.
          </p>
          <p>
            You can withdraw consent at any time. See "Your consent choice," below, or clear this
            site's browsing data in your own browser; either resets your choice and shows the
            banner again.
          </p>
          <h3 className="text-base font-semibold text-ink">Hosting logs</h3>
          <p>
            This site is hosted on Firebase Hosting, a Google product. Like most website hosts,
            Firebase Hosting automatically generates basic server logs for each request, typically
            including the requester's IP address, the page requested, the time of the request, and
            the browser's user agent. This is standard web infrastructure, not something built or
            configured specifically for this site, and I do not run any separate tracking,
            profiling, or analysis on top of it.
          </p>
        </Section>

        <Section title="Your consent choice">
          <p>
            When you accept or decline the analytics banner, that choice is saved in your
            browser's local storage (on-device storage that is not sent to any server), so you are
            not asked again on every visit.
          </p>
          <ConsentStatus />
        </Section>

        <Section title="Cookies, in full">
          <p>
            The only cookies this site can set are Google Analytics cookies, and only after you
            select "Accept." Your consent choice itself is stored in local storage, not a cookie.
            If you decline, this site sets no cookies at all. Clearing your choice (above) removes
            any Google Analytics cookies already on this device.
          </p>
        </Section>

        <Section title="Outbound links">
          <p>
            This site links to other things: GitHub, LinkedIn, project repositories, papers, and
            other sites I have built, including Juno (meetjuno.health), which has its own separate
            privacy policy and terms. Once you follow a link elsewhere, you are on someone else's
            site, governed by their practices, not this one.
          </p>
        </Section>

        <Section title="Children">
          <p>
            This site is not directed at children and is not designed to knowingly collect
            information from anyone, of any age.
          </p>
        </Section>

        <Section title="Changes to this policy">
          <p>
            If what this site collects ever changes, including because a new hosted project needs
            something this page does not describe today, I will update this page and the date
            above before that change ships.
          </p>
        </Section>

        <Section title="Contact">
          <p>
            For questions about this policy, or about what is collected, contact me directly:{' '}
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
