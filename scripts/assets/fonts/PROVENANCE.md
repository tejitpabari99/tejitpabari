# Font provenance — vendored Montserrat

This directory contains three static-weight TrueType instances of
Montserrat, vendored for build-time use by `scripts/generate-og-cards.mjs`
(satori/resvg render OG card PNGs and need real font bytes on disk — they
can't load a browser-hosted `@font-face` stylesheet). These files are
**not** shipped to visitors: the live site loads Montserrat from Google
Fonts' own CDN at request time (see `index.html`'s
`fonts.googleapis.com`/`fonts.gstatic.com` links). This record exists only
for the copies committed under `scripts/assets/fonts/`.

## Files, weights, and checksums

| File | Weight | SHA-256 |
| --- | --- | --- |
| `Montserrat-Regular.ttf` | 400 | `76c4f058aac767f2f886d4f29393f6c38b47c7dc48f502dd9e30a273b4987e81` |
| `Montserrat-SemiBold.ttf` | 600 | `96c43ee88af9d0379312ed086502f87f6bfebf675a6f473770d08c6dd27f2c1f` |
| `Montserrat-Bold.ttf` | 700 | `5a491022018fd3965df4c071a581b055971e5be605b6df79d7ab03437a10234e` |

Computed with `sha256sum scripts/assets/fonts/*.ttf` on 2026-08-31.

**What this checksum table attests to, and what it doesn't:** these hashes
prove that the three files committed in this directory are exactly the
bytes recorded here — i.e. they let anyone confirm nothing has silently
changed since this record was written, and they pin down exactly what
"the vendored Montserrat" means in this repo. They are **not**, by
themselves, proof that these bytes are an unmodified, faithful rendering
of Google's original Montserrat design. See "Independent verification
performed" below for how far that was actually checked, and what remains
open.

## Source and why a mirror was used

Montserrat is a Google Fonts family; Google's own canonical repository
(`google/fonts`, path `ofl/montserrat/`) ships it as a single **variable**
font (`Montserrat[wght].ttf`, plus an italic variable counterpart) — it
does not publish separate static per-weight files the way this project
needs them (satori's font-loading in `generate-og-cards.mjs` wants
concrete Regular/SemiBold/Bold instances, not a variable font it would
have to instance itself).

Google Fonts' own website (fonts.google.com) generates and serves those
static per-weight instances, but only through its interactive download
flow — a `?download` link built for a browser session (cookies/referrer
expectations), not a stable, scriptable URL a build or a provenance record
can point at reproducibly.

**google-webfonts-helper** (`gwfh.mranftl.com`, formerly hosted at
`google-webfonts-helper.herokuapp.com`) is a long-standing, widely used
community tool that solves exactly this: it re-instances Google's variable
font sources into static per-weight TTF/WOFF/WOFF2 files behind a plain,
scriptable API and download URL. It is a third-party mirror, not a
Google-operated endpoint — that's the tradeoff being recorded here.

Files were originally obtained via gwfh's per-weight download for the
`latin` subset:

```
https://gwfh.mranftl.com/api/fonts/montserrat?download=zip&subsets=latin&variants=regular,600,700
```

which unpacks (among other formats not vendored here) to
`montserrat-v31-latin-regular.ttf`, `montserrat-v31-latin-600.ttf`, and
`montserrat-v31-latin-700.ttf` — renamed in this repo to
`Montserrat-Regular.ttf`, `Montserrat-SemiBold.ttf`, and
`Montserrat-Bold.ttf` respectively. `v31` is gwfh's own version tag for its
current Montserrat snapshot (`lastModified: 2025-09-05` per its API as of
this writing) — it tracks Google Fonts' own Montserrat updates, not a
version gwfh invented independently.

## License — SIL Open Font License 1.1

Montserrat is distributed under the **SIL Open Font License, Version
1.1**. The canonical license text for this exact font is committed
alongside this file as [`OFL.txt`](./OFL.txt), fetched directly from
Google's own font repository:

```
https://raw.githubusercontent.com/google/fonts/main/ofl/montserrat/OFL.txt
```

(SHA-256 of the committed `OFL.txt`:
`8b7141c03fa4f8d44e6345d5d4931709290f0f67875e452e95ac1fd3a027802e`)

That file's copyright line reads "Copyright 2024 The Montserrat.Git
Project Authors (https://github.com/JulietaUla/Montserrat.git)". The OFL
permits embedding, bundling, and redistributing the font (including in
this repo and in the OG-card PNGs it renders) — it does not permit selling
the font files by themselves, and any modified/redistributed version must
not use the reserved font name ("Montserrat") without the copyright
holder's permission per §6/§7. This project does not modify or
redistribute the font files as a standalone product, so no OFL-specific
action beyond keeping this license text with the files is required.

## Independent verification performed

Two checks were actually run — not assumed:

1. **Re-fetched the same three weights from the same mirror just now** and
   compared checksums byte-for-byte against what's committed:
   `montserrat-v31-latin-regular.ttf`, `-600.ttf`, and `-700.ttf` from a
   fresh `https://gwfh.mranftl.com/api/fonts/montserrat?download=zip&subsets=latin&variants=regular,600,700`
   download **matched exactly** — identical SHA-256 to the table above, for
   all three files. This confirms the files committed here are unmodified
   since whenever they were originally vendored, and that gwfh is
   currently serving these same bytes under its `v31` Montserrat snapshot.
2. **Confirmed Google's own `google/fonts` repo layout** for `ofl/montserrat/`
   via its GitHub API (`ofl/montserrat` directory listing) — it contains
   `Montserrat[wght].ttf` and `Montserrat-Italic[wght].ttf` (variable
   fonts) plus `OFL.txt`, `METADATA.pb`, etc. — no static per-weight files
   to diff against directly. This is *why* a mirror was used (above), and
   it's also why check #1 is the strongest verification actually
   achievable without independently re-instancing Google's variable font
   at weights 400/600/700 and comparing the resulting outlines/hinting —
   which was not done.

**Open item for the owner:** the bytes here are verified against the
mirror that served them (#1) and the license text is verified against
Google's own repo (OFL.txt above). What is **not** independently verified**
is that gwfh's static instancing of Google's variable font at weights
400/600/700 exactly reproduces what Google Fonts' own website would
generate byte-for-byte — gwfh is a well-established, widely-relied-on tool
for this, but it is still a third party in the chain between "Google's
variable font source" and "the static TTF committed here." If a
byte-exact match against Google's own generation is ever required (e.g.
for a licensing or supply-chain audit), the definitive path is
instancing `Montserrat[wght].ttf` from `google/fonts` at those exact
weights with the same tooling Google Fonts' backend uses (fonttools
`varLib.instancer`) and diffing the result — not attempted here.

## How to verify or re-fetch

To verify the currently committed files:

```bash
cd scripts/assets/fonts
sha256sum Montserrat-Regular.ttf Montserrat-SemiBold.ttf Montserrat-Bold.ttf
# compare against the table above
```

To re-fetch fresh copies from the same source and confirm they still
match (or to pull a newer Montserrat revision on purpose):

```bash
curl -sL 'https://gwfh.mranftl.com/api/fonts/montserrat?download=zip&subsets=latin&variants=regular,600,700' -o montserrat.zip
unzip -o montserrat.zip -d montserrat_fresh
sha256sum montserrat_fresh/montserrat-v31-latin-regular.ttf   # compare to Montserrat-Regular.ttf
sha256sum montserrat_fresh/montserrat-v31-latin-600.ttf       # compare to Montserrat-SemiBold.ttf
sha256sum montserrat_fresh/montserrat-v31-latin-700.ttf       # compare to Montserrat-Bold.ttf
```

If a checksum no longer matches, that means gwfh has updated its
Montserrat snapshot (a new upstream release, a re-hint, a subsetting
change, etc.) — not that anything is wrong; re-run
`scripts/generate-og-cards.mjs`'s test suite
(`scripts/generate-og-cards.test.ts`) against the new files, update the
checksum table above, and note the new gwfh version tag.

To check the license text is still current:

```bash
curl -sL https://raw.githubusercontent.com/google/fonts/main/ofl/montserrat/OFL.txt | sha256sum
# compare to OFL.txt's checksum above
```
