# subdomains

Static placeholder sites for `nonprofit.tejitpabari.com` and `healthtech.tejitpabari.com`.
Deploys independently of the main site (own `firebase.json` / `.firebaserc`; root config untouched).

## Owner steps

1. Firebase console -> Hosting -> add sites `tejitpabari-nonprofit` and `tejitpabari-healthtech`
   (or `npx firebase hosting:sites:create tejitpabari-nonprofit` / `... tejitpabari-healthtech`), project `tejitpabari-99`.
2. Deploy: `cd subdomains && npx firebase deploy --only hosting`
3. Add custom domain `nonprofit.tejitpabari.com` to the nonprofit site, `healthtech.tejitpabari.com` to the healthtech site.
4. Short aliases: on the nonprofit site add custom domain `np.tejitpabari.com`, choose "Redirect to an existing website" -> `nonprofit.tejitpabari.com`.
   Same for `htech.tejitpabari.com` on the healthtech site -> `healthtech.tejitpabari.com`.
   (Firebase docs describe this as a checkbox in the Add custom domain wizard to redirect to a second domain; exact UI label not verified.
   Fallback: a Cloudflare redirect rule, `np`/`htech` -> the full subdomain.)
5. Cloudflare: add the DNS records Firebase shows for each domain, DNS-only (grey cloud), same as the apex.

Content: edit `nonprofit/index.html` and `healthtech/index.html`. CSP forbids inline styles and scripts; keep CSS in `style.css`.
