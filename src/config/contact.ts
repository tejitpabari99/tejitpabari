// src/config/contact.ts
export const CONTACT_EMAIL_DISPLAY = 'tejitpabari99 _at_ gmail [dot] com';

// Deliberately two separate constants, not one CONTACT_EMAIL string, so nothing
// in this file — or anything importing it without calling the function below —
// contains a plain, greppable "user@domain.tld" pattern.
const EMAIL_USER = 'tejitpabari99';
const EMAIL_DOMAIN = 'gmail.com';

/** Real address, assembled on demand. Only ever called from client-side
 *  effects/handlers (never at render time) — see useContactMailto. */
export function getContactEmailAddress(): string {
  return `${EMAIL_USER}@${EMAIL_DOMAIN}`;
}

// LinkedIn and GitHub are deliberately NOT obfuscated (brief's "Contact facts"):
// a profile URL isn't harvested/spammed the way a mailto address is, so hiding
// it adds friction for zero benefit.
export const LINKEDIN_URL = 'https://www.linkedin.com/in/tejitpabari';
export const GITHUB_USERNAME = 'tejitpabari99';
export const GITHUB_URL = 'https://github.com/tejitpabari99';
