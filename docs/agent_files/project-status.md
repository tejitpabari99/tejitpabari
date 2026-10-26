# Project Status & Portfolio Plan

Date: 2026-10-26

> Live checks were curl-based on 2026-10-26: pages load, but backends were not tested end-to-end.

**Legend.** Projects are grouped by what stands between them and the portfolio. **A** = done with a working live link (ready now). **B** = done, shown via screenshots or a download, no live app needed. **C** = done but must be deployed (or fixed) before it is clickable. **D** = ongoing or unfinished. **Off the site** = intentionally not shown. "On site" means it currently has an entry in `src/content/projects/` (clip-verse, columbia-virtual-campus, crunchy-filler, juno, med-doc-tracker, smarttest). Where the inventory JSON and the owner's decisions disagree, the owner's decisions win. Image URLs are GitHub raw URLs (the JSON lists a sample; the full set lives in the folder noted).

## A. Done + live link (ready now)

### crunchy-filler

- Repo: tejitpabari99/crunchy-filler (https://github.com/tejitpabari99/crunchy-filler)
- Brief: Chrome extension that marks filler episodes with a star icon on Crunchyroll series pages.
- Stack: JavaScript, Chrome extension (MV3)
- Status: Done
- Live: https://chromewebstore.google.com/detail/crunchy-filler/djbcknbbfoldifpllefimnnkfaogcnid (Chrome Web Store listing)
- Pictures (has screenshots, `assets/screenshots_chrome/`):
  - https://raw.githubusercontent.com/tejitpabari99/crunchy-filler/HEAD/assets/screenshots_chrome/crunchyFiller_naruto_1280_800.png
  - https://raw.githubusercontent.com/tejitpabari99/crunchy-filler/HEAD/assets/screenshots_chrome/crunchyFiller_beyblade_1280_800.png
  - https://raw.githubusercontent.com/tejitpabari99/crunchy-filler/HEAD/assets/screenshots_chrome/crunchyFiller_blackClover_1280_800.png
- On site: yes (crunchy-filler)
- To-do:
  - [ ] Update repo `homepageUrl` to the canonical store slug (old `crunchyroll-filler` slug redirects).
  - [ ] Add a real README description (currently attributions only).

### Juno (Onolys/juno + tejitpabari99/simplify-med)

- Repos: Onolys/juno (https://github.com/Onolys/juno), tejitpabari99/simplify-med (https://github.com/tejitpabari99/simplify-med)
- Brief: AI converts clinical provider notes into a plain-language care plan with a before/after readability score. No-login trial; zero-retention design.
- Stack: Python Flask on Cloud Run, Firestore, Cloud Tasks, GCS, React + Vite + TS on Firebase Hosting, Gemini on Vertex AI
- Status: Trial live; full app down
- Live: https://juno-medical-clarity.web.app (trial). Full app `juno-app-99.web.app` returns "Site Not Found".
- Pictures: none in these repos. Site has its own screenshot: https://raw.githubusercontent.com/tejitpabari99/tejitpabari/HEAD/.dev/website-revamp-r3/screenshots/project-detail-juno-1440.png
- On site: yes (juno; currently links meetjuno.health / app.meetjuno.health, both return 200 SPA shells)
- To-do:
  - [ ] OWNER DECISION: deploy the full app, or link the trial only.
  - [ ] Repoint the portfolio Juno link to the chosen target.

### notion-gmaps

- Repo: tejitpabari99/notion-gmaps (private) (https://github.com/tejitpabari99/notion-gmaps)
- Brief: Shows addresses from a Notion database on an interactive Mapbox map, embeddable in Notion pages, with auto-refresh.
- Stack: Node/Express, Mapbox, Notion API, Render
- Status: Done
- Live: https://notion-gmaps.onrender.com (Render free tier: first load is slow, ~30-60s)
- Pictures: none
- On site: no
- To-do:
  - [ ] Capture 2-3 screenshots (map and Notion embed).
  - [ ] Add to portfolio with a cold-start note.

### crontick

- Repo: tejitpabari99/crontick (https://github.com/tejitpabari99/crontick)
- Brief: AI-native local cron: schedule an AI agent prompt on cron/interval/one-shot, capture output + session. Daemon + CLI + MCP server.
- Stack: TypeScript, Node, MCP
- Status: Done (shipped)
- Live: npm 0.3.1, https://www.npmjs.com/package/crontick
- Pictures: none
- On site: no
- To-do:
  - [ ] Add to portfolio linking the npm package.
  - [ ] Optional: terminal screenshot/GIF.

## B. Done; screenshots/download, no live app needed

### fabric-udf-maps-demo

- Repo: tejitpabari99/fabric-udf-maps-demo (https://github.com/tejitpabari99/fabric-udf-maps-demo)
- Brief: Renders four Microsoft Fabric sources (GeoJSON, PMTiles, SQL table, Eventstream) on Azure Maps via Fabric User Data Functions and a Node app.
- Stack: Node/JavaScript, Azure Maps, Microsoft Fabric UDFs, PMTiles
- Status: Done
- Live: none (needs a Fabric tenant + auth)
- Pictures (4 screenshots in `docs/images/`; JSON sample):
  - https://raw.githubusercontent.com/tejitpabari99/fabric-udf-maps-demo/HEAD/docs/images/carpark.png
  - https://raw.githubusercontent.com/tejitpabari99/fabric-udf-maps-demo/HEAD/docs/images/airports.png
  - https://raw.githubusercontent.com/tejitpabari99/fabric-udf-maps-demo/HEAD/docs/images/pmtiles.png
- On site: no
- To-do:
  - [ ] Add to portfolio using the 4 screenshots and repo link.

### SMARTest

- Repo: tejitpabari99/SMARTest (https://github.com/tejitpabari99/SMARTest)
- Brief: Smartphone app for at-home HIV/syphilis rapid-test interpretation; published research with press coverage.
- Stack: React Native (Expo), Firebase
- Status: Done
- Live: none (smartest-df9af.web.app returns Site Not Found; no app store link). Published paper is the link.
- Pictures (34 screenshots in `Images/`; JSON sample):
  - https://raw.githubusercontent.com/tejitpabari99/SMARTest/HEAD/Images/10.jpg
  - https://raw.githubusercontent.com/tejitpabari99/SMARTest/HEAD/Images/2.jpg
  - https://raw.githubusercontent.com/tejitpabari99/SMARTest/HEAD/Images/11A.jpg
- On site: yes (smarttest; paper/news links)
- To-do:
  - [ ] Check the site entry shows the screenshots and the published-paper link.

### nourish-tones

- Repo: tejitpabari99/nourish-tones (https://github.com/tejitpabari99/nourish-tones)
- Brief: Chrome/Edge extension that highlights DoorDash menu items matching dietary restrictions and custom allergens in red.
- Stack: JavaScript, Chrome extension
- Status: Complete (owner). Probably can't be submitted to the Chrome Web Store anymore, and DoorDash has something similar.
- Live: none
- Pictures (10 store screenshots in `public/screenshots/`; JSON sample):
  - https://raw.githubusercontent.com/tejitpabari99/nourish-tones/HEAD/public/screenshots/Earls%20Kitchen%20%28Vegan%29%201280-800.png
  - https://raw.githubusercontent.com/tejitpabari99/nourish-tones/HEAD/public/screenshots/Castilla%20%28pescaterian%29%201280-800.png
  - https://raw.githubusercontent.com/tejitpabari99/nourish-tones/HEAD/public/screenshots/options%20640-400.png
- On site: no
- To-do:
  - [ ] Add to portfolio showing the 10 screenshots.
  - [ ] Later (optional): possible improvements.

### unsubscribe-all-gmail

- Repo: tejitpabari99/unsubscribe-all-gmail (https://github.com/tejitpabari99/unsubscribe-all-gmail)
- Brief: Lists emails from Gmail and mass-unsubscribes from them. React CRA app with Express server.
- Stack: React (CRA), Node/Express, Gmail API
- Status: Done; fine without a deployment
- Live: none
- Pictures: Gmail logo (generic image; repo has icons only)
- On site: no
- To-do:
  - [ ] Add to portfolio with the Gmail logo and repo link.

### hades-randomizer-mod

- Repo: tejitpabari99/hades-randomizer-mod (https://github.com/tejitpabari99/hades-randomizer-mod)
- Brief: Hades game mod that gives a random keepsake and weapon each room.
- Stack: Lua, Hades ModImporter
- Status: Complete; nothing to add
- Live: none
- Pictures: Hades image (generic)
- On site: no
- To-do:
  - [ ] Add to portfolio with the Hades image and repo link.

### azmaps-geo-assistant

- Repo: tejitpabari99/azmaps-geo-assistant (https://github.com/tejitpabari99/azmaps-geo-assistant)
- Brief: Azure Maps geospatial AI assistant: AI Search indexes over Azure Maps samples/docs plus assistant scripts and Azure Functions.
- Stack: Python, Azure AI Search, Azure Functions
- Status: Complete (owner)
- Live: none
- Pictures: Azure Maps logo (generic)
- On site: no
- To-do:
  - [ ] Add to portfolio with the Azure Maps logo and repo link.

### simplify-med-plugin

- Repo: tejitpabari99/simplify-med-plugin (https://github.com/tejitpabari99/simplify-med-plugin)
- Brief: Patient-facing plugin skills (prep before a visit, simplify clinical docs into a cited plain-language report, med-lit); outputs a self-contained HTML report.
- Stack: Python stdlib scripts, OpenAI/Claude plugin skills, Node MCP
- Status: Done
- Live: none (download)
- Pictures: https://raw.githubusercontent.com/tejitpabari99/simplify-med-plugin/HEAD/user/figures/05_connected_care_journey.png
- On site: no
- To-do:
  - [ ] Publish the plugin zip (e.g., as a GitHub release) and link it.
  - [ ] Add to portfolio.

### TTAgentChallengeFeb2025

- Repo: tejitpabari99/TTAgentChallengeFeb2025 (https://github.com/tejitpabari99/TTAgentChallengeFeb2025)
- Brief: Feb 2025 challenge entry: AI audience-pulse simulation (Microsoft TinyTroupe/GPT agents) reacting to pitch slides.
- Stack: Python backend, Next.js frontend, GPT, TinyTroupe
- Status: Done; owner wants it on the site
- Live: none
- Pictures: https://raw.githubusercontent.com/tejitpabari99/TTAgentChallengeFeb2025/HEAD/docs/arch-diagram.png (plus sample pitch pptx files in repo)
- On site: no
- To-do:
  - [ ] Write a README (currently title only).
  - [ ] Decide: deploy, or screenshots only.
  - [ ] Add to portfolio.

## C. Done, but must be deployed before clickable

### hospital-bill-checker

- Repo: tejitpabari99/hospital-bill-checker (https://github.com/tejitpabari99/hospital-bill-checker)
- Brief: Upload a hospital bill (PDF/image) and get an automated audit for upcoding, unbundling, pharmacy markup and ICD-10 mismatches against CMS data, plus a dispute letter. Free, no login.
- Stack: SvelteKit (adapter-node), Gemini (vision + audit), CMS MPFS/NCCI/ASP data
- Status: Done (78 commits), never deployed; local STATUS.md targets Railway
- Live: none
- Pictures: https://raw.githubusercontent.com/tejitpabari99/hospital-bill-checker/HEAD/examples/test-images/1728679915072.jpg (test bill only; capture real UI screenshots after deploy)
- On site: no
- To-do:
  - [ ] Deploy (Railway or Cloud Run).
  - [ ] Capture UI screenshots.
  - [ ] Add to portfolio.

### clipverse

- Repo: tejitpabari99/clipverse (private) (https://github.com/tejitpabari99/clipverse); public feedback repo tejitpabari99/clipverse-public
- Brief: Extracts locations mentioned in YouTube videos/shorts and pins them on a map.
- Stack: Next.js/TypeScript (Vercel), Docker backend on Fly.io + Redis, GH Actions tests
- Status: Done, deploy gone: Vercel 404 DEPLOYMENT_NOT_FOUND, clipverse.app doesn't resolve, Fly host gone
- Live: none (old: https://clipverse-five.vercel.app is dead)
- Pictures: none in repo; capture after redeploy
- On site: yes (clip-verse, link broken)
- To-do:
  - [ ] Redeploy frontend + backend.
  - [ ] SECURITY: ROTATE the plaintext Redis password in `backend/fly.toml` and remove it from the repo (use secrets; consider scrubbing history).
  - [ ] Fix the portfolio `/projects/clip-verse/live` redirect.
  - [ ] Remove or update tejitpabari99/clipverse-public.

### virtualCampus

- Repo: tejitpabari99/virtualCampus (https://github.com/tejitpabari99/virtualCampus)
- Brief: Columbia Virtual Campus website: static Gatsby site with events, team pages and Firebase functions (student-run Covid-era virtual campus). Largest project (1132 commits).
- Stack: Gatsby, React, Material UI, Firebase (functions, hosting)
- Status: Done, but columbiavirtualcampus.com now redirects to a Chinese spam/gambling site, and the portfolio links to it
- Live: none (domain hijacked)
- Pictures:
  - https://raw.githubusercontent.com/tejitpabari99/virtualCampus/HEAD/src/assets/images/freshmen-socials/TitleImg.png
  - https://raw.githubusercontent.com/tejitpabari99/virtualCampus/HEAD/src/assets/images/blm/Group%201.png
- On site: yes (columbia-virtual-campus, BAD link)
- To-do:
  - [ ] Remove/replace the portfolio link NOW.
  - [ ] Redeploy on a free host (Firebase Hosting / GitHub Pages / Netlify / Vercel).
  - [ ] Repoint the portfolio link.
  - [ ] Check the Facebook/Instagram links on the site (unchecked).

### HealthDocumentTracker

- Repo: tejitpabari99/HealthDocumentTracker (https://github.com/tejitpabari99/HealthDocumentTracker)
- Brief: Upload health documents with OCR, index in Azure AI Search, and ask natural-language questions answered with Azure OpenAI.
- Stack: Python Flask API, Azure Blob/Document Intelligence/AI Search/OpenAI, React frontend, Azure Web App (GH Actions)
- Status: Frontend live; Azure backend host doesn't resolve
- Live: https://meddoctracker.netlify.app (frontend only)
- Pictures: none in repo; capture screenshots
- On site: yes (med-doc-tracker)
- To-do:
  - [ ] Host the backend (new Azure Web App or alternative).
  - [ ] Verify end-to-end (upload, search, Q&A).
  - [ ] Capture screenshots.

## D. Ongoing

### node-arena (FEATURED)

- Repo: tejitpabari99/node-arena (https://github.com/tejitpabari99/node-arena)
- Brief: Browser tower-strategy game: draw persistent routes, capture buildings, 20-level solo campaign with AI; Green/Snow themes.
- Stack: TypeScript monorepo, Vite, Preact, Three.js, deterministic sim
- Status: Ongoing (26 commits in 3 weeks). Owner will launch later; post smaller updates/blog links over time. Multiplayer deferred.
- Live: none yet
- Pictures (README screenshots in `docs/img/`):
  - https://raw.githubusercontent.com/tejitpabari99/node-arena/HEAD/docs/img/tw-level-01.png
  - https://raw.githubusercontent.com/tejitpabari99/node-arena/HEAD/docs/img/tw-level-10.png
  - https://raw.githubusercontent.com/tejitpabari99/node-arena/HEAD/docs/img/tw-level-20.png
- On site: no (planned as one of the 6 featured)
- To-do:
  - [ ] Static deploy (Firebase/Vercel).
  - [ ] Check the Tower War-derived assets before promoting.
  - [ ] Add to portfolio as featured.
  - [ ] Post updates / blog links over time.

### Onolys/iaudit

- Repo: Onolys/iaudit (https://github.com/Onolys/iaudit)
- Brief: Interview Evidence Auditor: checks whether a written assessment faithfully represents interview evidence; produces an evidence audit and a visual review UI.
- Stack: Python backend, React frontend, CI + nightly
- Status: Ongoing (28 commits in 2 weeks)
- Live: none
- Pictures: none
- On site: no
- To-do:
  - [ ] Deploy.
  - [ ] Capture screenshots.

### tickdeck

- Repo: tejitpabari99/tickdeck (https://github.com/tejitpabari99/tickdeck)
- Brief: Planned local modular dashboard (widget grid) for crontick job outputs. Design docs only so far.
- Stack: none yet (docs)
- Status: Ongoing
- Live: none
- Pictures: generic image for now
- On site: no
- To-do:
  - [ ] Pick a generic placeholder image.
  - [ ] Build out the dashboard.

### notify-plugin

- Repo: tejitpabari99/notify-plugin (https://github.com/tejitpabari99/notify-plugin)
- Brief: GitHub Copilot CLI plugin firing native Windows toast notifications when a task finishes or needs input, with click-to-focus on the Windows Terminal tab.
- Stack: PowerShell, TypeScript extension, Copilot CLI hooks
- Status: Needs completing before it goes on the site
- Live: none
- Pictures: none
- On site: no
- To-do:
  - [ ] Finish the plugin.
  - [ ] Capture a toast screenshot, then add to portfolio.

## Off the site

- juno-landing-page: no longer needed.
- kyro, linkedin-outreach-tool, tejitpabari-gateway: private tools.
- hangintherepunch: kept off the site.
- pahe-downloader: piracy-adjacent.
- aurelian, kouper, fabric-poc-towers: take-home/employer work.
- Coursework: Data-Mining-Project-3, 3106_Project2, fundSpeechProject, CatalogService, haskell-project, Backend-as-a-Service, slp-hw-2, w4111-Databases, Deep-Learning-Coursera, Python-Course, labs-f18-challenge, tejit_TEMBOchallenge, node-web-server, gh600-lab, psychResearch.
- Empty/stub repos: discord-jira-bot, kouper-interview, automations, Flynzo, geoparquet-azure-maps-react, exam-prep-ai, SuicideIdeationProject, license_plate, edog-test, file-host, Onolys/juno-cdr, Onolys/juno-landing, clipverse-public.
- Other private/personal: tejitpabari_resume, Azure-Maps-plugin-for-QGIS, bloodDrive, SMARTest-Android (duplicate of SMARTest), tejitpabari99.github.io (placeholder, to delete).
- Forks (not own work): fabric-docs-pr, fabric-docs, claw-code, fabric-rti-mcp, azure-quickstart-templates, LibreChat, azure-rest-api-specs, imbalanced-learn, awesome-data-labeling, interviews, first-contributions, medifile-app, BloodDrive2 (20 of 38 own commits), Prescription-Project (54 of 93), labs-f18-challenge (2 of 21).
- medical-scribe: fork with 30 of 130 commits by the owner.

## Site / infra fixes

- [ ] Remove the virtualCampus spam link now.
- [ ] Fix the clip-verse live redirect after the redeploy.
- [ ] www.tejitpabari.com fails TLS: Firebase serves the default firebaseapp.com cert; www DNS points to Firebase 199.36.158.100 but `www` isn't added as a custom domain. Fix: add `www` as a custom domain on Firebase Hosting with a redirect to the apex. Owner may need to do this in the console.
- [ ] Delete the tejitpabari99.github.io repo (serves a placeholder "Your title" TF.js page).
- [ ] Optionally delete the leftover Developer Connect connection `apphosting-github-conn-39o4719` (from the deleted App Hosting backend).
- [ ] go.tejitpabari.com root returns 404 (informational).

## Open decisions for owner

- [ ] Pick the other 5 featured projects (node-arena is one).
- [ ] Juno: deploy the full app, or trial only.

## Summary table

| Project                 | Group | Status                    | Live link                                   | Pics                 | Next step                           |
| ----------------------- | ----- | ------------------------- | ------------------------------------------- | -------------------- | ----------------------------------- |
| crunchy-filler          | A     | Done                      | Chrome Web Store                            | 3 screenshots        | Fix homepageUrl, add README         |
| Juno                    | A     | Trial live, full app down | juno-medical-clarity.web.app                | Site screenshot only | Owner decision: full app or trial   |
| notion-gmaps            | A     | Done                      | notion-gmaps.onrender.com (slow cold start) | None                 | Screenshots, add to site            |
| crontick                | A     | Done                      | npm 0.3.1                                   | None                 | Add to site                         |
| fabric-udf-maps-demo    | B     | Done                      | none                                        | 4 screenshots        | Add to site                         |
| SMARTest                | B     | Done                      | Paper                                       | 34 screenshots       | Verify site entry                   |
| nourish-tones           | B     | Complete                  | none                                        | 10 store screenshots | Add to site                         |
| unsubscribe-all-gmail   | B     | Done                      | none                                        | Gmail logo           | Add to site                         |
| hades-randomizer-mod    | B     | Complete                  | none                                        | Hades image          | Add to site                         |
| azmaps-geo-assistant    | B     | Complete                  | none                                        | Azure Maps logo      | Add to site                         |
| simplify-med-plugin     | B     | Done                      | none (zip planned)                          | 1 figure             | Publish zip release, add to site    |
| TTAgentChallengeFeb2025 | B     | Done                      | none                                        | Arch diagram         | Write README, deploy or screenshots |
| hospital-bill-checker   | C     | Done, never deployed      | none                                        | Test image only      | Deploy (Railway/Cloud Run)          |
| clipverse               | C     | Deploy gone               | none (dead)                                 | None                 | Redeploy, rotate Redis password     |
| virtualCampus           | C     | Domain hijacked (spam)    | none                                        | 2 images             | Remove link now, redeploy           |
| HealthDocumentTracker   | C     | Frontend only             | meddoctracker.netlify.app                   | None                 | Host backend                        |
| node-arena              | D     | Ongoing (featured)        | none yet                                    | 3 screenshots        | Static deploy, check assets         |
| Onolys/iaudit           | D     | Ongoing                   | none                                        | None                 | Deploy                              |
| tickdeck                | D     | Ongoing (design docs)     | none                                        | Generic              | Build out                           |
| notify-plugin           | D     | Incomplete                | none                                        | None                 | Finish before listing               |
