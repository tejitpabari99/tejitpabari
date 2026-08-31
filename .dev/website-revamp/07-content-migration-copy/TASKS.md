# Tasks: Content Migration & Copy (SP07)

Source of truth: `/root/projects/tejitpabari/.dev/website-revamp/07-content-migration-copy/PRD.md`. Every task below cites the PRD §4 subsection it implements. This sub-project writes markdown content files into `src/content/{projects,research,work-experience}/` plus the Hero/About/Contact copy SP03 renders — it defines no types, components, validators, or schema; every field below is specified by SP02 (`02-content-pipeline/PRD.md` §4.4, mirrored in `02-content-pipeline/TASKS.md` Tasks 1–4).

**Progress:** 4/7 tasks complete

**Toolchain/ordering assumption:** per the initiative's `README.md` phase graph (also stated in `03-landing-page-timeline/TASKS.md`), SP02 lands in Phase 1–2, before SP07's Phase 3 authoring work. By the time these tasks run, `src/data/projects.ts`, `src/data/research.ts`, `src/data/workExperience.ts`, and `scripts/check-launch-content.ts` are expected to already exist and compile — so unlike SP03 (which had to hedge around content not existing yet), SP07's tasks can and should run the real `npm run build` / `npm test` / `npm run check:launch` as acceptance gates, not a `tsc --noEmit` substitute. If any of those SP02 files genuinely doesn't exist yet when a task is picked up, stop and confirm with the orchestrator rather than authoring content nothing will validate.

**`image` discipline (PRD §4.6), stated once, applies to every one of the 15 project/research files below:** every `image` frontmatter value must be the exact, byte-identical string `https://images.unsplash.com/photo-1572177812156-58036aae439c` — no query string, no variation. This is what makes `grep -rl 'images.unsplash.com/photo-1572177812156-58036aae439c' src/content/{projects,research}/` a reliable "what's still on the placeholder" check later.

**`date` values are transcribed exactly as PRD §4.1/§4.2/§4.3 derived them — do not re-derive or "improve" any of them.** Four are explicit low-confidence guesses (Juno, Med-Doc Tracker, Crunchy Filler, Clip-Verse) flagged for the owner in §8/§9 of the PRD and again in this file's closing summary — write them as given; they are not blockers.

**Copy status, stated once:** every `description`/`body` value below is a first draft, per PRD §4.5/§9's explicit framing ("a full first draft the owner only needs to edit," not locked final copy) — write it exactly as given in this file (it is either quoted verbatim from the PRD's own drafted samples, or drafted here following the PRD's stated tone/length rule for the items the PRD explicitly left as a tasks-phase drafting job, §4.5.3/§4.5.4/§9). Do not soften, expand, or fact-check beyond what's written here — that pass is the owner's, not the implementing agent's.

---

### Task 1 — Health Tech flagship projects: Juno, SMARTtest
   - Status: Done
   - Files: `src/content/projects/juno.md` (new), `src/content/projects/smarttest.md` (new)
   - Changes: Per PRD §4.1 rows 1 and 10, and §4.5.3 (both flagships' drafted `description` and `body`). These are the only two of the 10 projects that ship a `body` — write both exactly as below, including the frontmatter.

```markdown
<!-- src/content/projects/juno.md -->
---
slug: juno
title: Juno
description: >-
  An AI companion for medical appointments — live note-taking, real-time
  question prompts, and a clear summary of what to do next. Built with
  neurologists and researchers, and validated with 200+ patients and 30+
  doctors so far.
image: https://images.unsplash.com/photo-1572177812156-58036aae439c
tags: [Health Tech]
status: Building
liveUrl: https://app.meetjuno.health/
links:
  - label: App
    href: https://app.meetjuno.health/
  - label: Website
    href: http://meetjuno.health/
date: "2025-06-01"
---
Juno helps patients get more out of every doctor's visit. During an appointment, it takes structured notes in real time and prompts context-aware questions a patient might not think to ask in the moment — then turns the conversation into a clear summary with concrete follow-ups, instead of a page of hurried handwriting.

It's being built in collaboration with neurologists and researchers, with an early focus on complex, recurring conditions like MS, where patients see specialists repeatedly and small details compound over time. The team is in early conversations with the National MS Society and Columbia University about clinical validation and funding.

So far: 200+ patients surveyed, 30+ doctors consulted, and 70 patients on the beta waitlist. Juno is still pre-launch — the current focus is validating the clinical workflow before scaling it.
```

```markdown
<!-- src/content/projects/smarttest.md -->
---
slug: smarttest
title: "SMARTtest: HIV & Syphilis Self-Testing App"
description: >-
  A smartphone app that makes HIV and syphilis self-testing more accessible —
  walking users through the test, helping interpret results, and linking them
  to follow-up care. Downloaded 1,000+ times.
image: https://images.unsplash.com/photo-1572177812156-58036aae439c
tags: [Health Tech]
status: Completed
links:
  - label: AIDS and Behaviour Paper
    href: https://doi.org/10.1007/s10461-019-02718-y
  - label: News Coverage
    href: "https://www.labiotech.eu/best-biotech/hiv-test-app-home/#:~:text=SMARTtest,and%20syphilis%20in%20the%20blood."
date: "2019-01-01"
---
SMARTtest is a smartphone app that makes HIV and syphilis self-testing more accessible — walking a user through the test itself, helping interpret the result, and linking them to follow-up care, all from a phone. Built with React Native and Firebase, with Twilio and SendGrid handling secure result-sharing, and deployed and tested through Expo.

The app has been downloaded 1,000+ times and received national news coverage. The underlying research was published in the journal *AIDS and Behavior* — one of the earliest projects that pointed me toward health tech, years before Juno.
```

   **Note on `smarttest.md`'s `liveUrl`:** deliberately absent — PRD §4.1 row 10 explains no standalone live tool exists distinct from an app-store listing, so this stays link-only, matching `liveMode`'s `hosted` fallback in `src/data/projects.ts`.

   - Acceptance criteria:
     1. Both files exist at the exact paths above; `slug` in each frontmatter matches its filename.
     2. `npx gray-matter` parse (or `npm run build`) succeeds against both files with no validator error.
     3. `juno.md` has `liveUrl: https://app.meetjuno.health/` and `status: Building`; `smarttest.md` has no `liveUrl` key at all and `status: Completed`.
     4. Both `image` values are byte-identical to `https://images.unsplash.com/photo-1572177812156-58036aae439c`.
     5. Both `body` fields, after `matter()` parsing, are non-empty (these are the only two projects where that's true by design).
     6. `juno.md`'s `links` has exactly 2 entries (App, Website); `smarttest.md`'s has exactly 2 (AIDS and Behaviour Paper, News Coverage) — every entry has both `label` and `href`.

---

### Task 2 — Microsoft-era Developer Tools projects
   - Status: Done
   - Files: `src/content/projects/fabric-maps-mcp-server.md` (new), `src/content/projects/azure-maps-ai-assistant.md` (new), `src/content/projects/qgis-plugin-azure-maps-creator.md` (new), `src/content/projects/creator-onboarding-tool.md` (new)
   - Changes: Per PRD §4.1 rows 5–8. None of these four gets a `body` — each ships `description` + `links` only, per PRD §4.1's explicit "most don't need one" framing. `qgis-plugin-azure-maps-creator.md`'s `description` is quoted verbatim from PRD §4.5.3 (the contrast example); the other three follow the identical tone/length rule (1–2 sentences, 20–40 words, present tense, leads with what it does) as a condensation of `src/pages/projects.js`'s existing prose — drafted below, not to be re-drafted.

```markdown
<!-- src/content/projects/fabric-maps-mcp-server.md -->
---
slug: fabric-maps-mcp-server
title: Fabric Maps MCP Server
description: >-
  An MCP (Model Context Protocol) server that lets AI agents call Fabric Maps
  APIs directly, so large language models can visualize and analyze
  geospatial data programmatically. Built for a Microsoft hackathon.
image: https://images.unsplash.com/photo-1572177812156-58036aae439c
tags: [Developer Tools]
status: Completed
links:
  - label: Hackathon Project
    href: https://innovationstudio.microsoft.com/hackathons/MRTAthon-2025/project/112785
date: "2025-01-01"
---
```

```markdown
<!-- src/content/projects/azure-maps-ai-assistant.md -->
---
slug: azure-maps-ai-assistant
title: Azure Maps AI Assistant
description: >-
  An AI assistant that analyzes user data and generates map visualizations
  from natural-language prompts, removing the need for manual configuration.
  Built for a Microsoft hackathon.
image: https://images.unsplash.com/photo-1572177812156-58036aae439c
tags: [Developer Tools]
status: Completed
links:
  - label: Hackathon Project
    href: https://hackbox.microsoft.com/hackathons/MRTAthon/project/85641
date: "2023-06-01"
---
```

```markdown
<!-- src/content/projects/qgis-plugin-azure-maps-creator.md -->
---
slug: qgis-plugin-azure-maps-creator
title: QGIS Plugin for Azure Maps Creator
description: >-
  A QGIS plugin that brings Azure Maps Creator's APIs directly into the QGIS
  environment, with parallelized data loading and full debugging support.
  Downloaded 1,000+ times from the official plugin store.
image: https://images.unsplash.com/photo-1572177812156-58036aae439c
tags: [Developer Tools]
status: Completed
liveUrl: https://plugins.qgis.org/plugins/AzureMapsCreator/
links:
  - label: QGIS Plugin Store
    href: https://plugins.qgis.org/plugins/AzureMapsCreator/
date: "2022-06-01"
---
```

```markdown
<!-- src/content/projects/creator-onboarding-tool.md -->
---
slug: creator-onboarding-tool
title: Creator Onboarding Tool
description: >-
  An onboarding tool for Azure Maps Creator, shaped through iterative design
  cycles driven by user feedback, accessible documentation, and API usage
  data. Built while shadowing the team's Product Manager role.
image: https://images.unsplash.com/photo-1572177812156-58036aae439c
tags: [Developer Tools]
status: Completed
liveUrl: https://azure.github.io/azure-maps-creator-onboarding-tool/
links:
  - label: Website
    href: https://azure.github.io/azure-maps-creator-onboarding-tool/
date: "2022-09-01"
---
```

   **`liveUrl` calls, per PRD §4.1/§8 item 2:** only `qgis-plugin-azure-maps-creator.md` and `creator-onboarding-tool.md` get one — both are genuine "go use it" destinations (a plugin-store page, a hosted tool site). `fabric-maps-mcp-server.md` and `azure-maps-ai-assistant.md` deliberately omit `liveUrl` — their hackathon-submission pages are informational, not "try it now" destinations, per PRD §4.1 rows 5–6.

   - Acceptance criteria:
     1. All four files exist at the exact paths above; each `slug` matches its filename; each `status: Completed`.
     2. `npm run build` (or a direct `parseProject` call per file) succeeds with no validator error.
     3. `qgis-plugin-azure-maps-creator.md` and `creator-onboarding-tool.md` each have a `liveUrl` key; `fabric-maps-mcp-server.md` and `azure-maps-ai-assistant.md` have none.
     4. Each file's markdown body (below the frontmatter fence) is empty — `content.trim() === ''` after `gray-matter` parsing — confirming no `body` was accidentally added to a project that isn't supposed to have one.
     5. Each `links` array has exactly one entry, matching the table above; every entry has both `label` and `href`.
     6. All four `image` values are byte-identical to the placeholder URL.

---

### Task 3 — Personal/hobby projects and Columbia Virtual Campus
   - Status: Done
   - Files: `src/content/projects/med-doc-tracker.md` (new), `src/content/projects/crunchy-filler.md` (new), `src/content/projects/clip-verse.md` (new), `src/content/projects/columbia-virtual-campus.md` (new)
   - Changes: Per PRD §4.1 rows 2–4 and row 9. `med-doc-tracker.md` and `clip-verse.md` **omit `status` entirely** — no key, not an empty string, not `"Unknown"` — per the owner's no-pill decision (brief §6, PRD §4.1's `ALLOWED_KEYS` compliance note). All four ship `description` + `links` only, no `body`.

```markdown
<!-- src/content/projects/med-doc-tracker.md -->
---
slug: med-doc-tracker
title: Med-Doc Tracker
description: >-
  A personal tool for storing, organizing, and searching all your medical
  documents in one place — built to make the fragmented world of medical
  records simpler to navigate.
image: https://images.unsplash.com/photo-1572177812156-58036aae439c
tags: [Health Tech]
liveUrl: https://tejitpabari.short.gy/med-doc-tracker
links:
  - label: Website
    href: https://tejitpabari.short.gy/med-doc-tracker
date: "2024-06-01"
---
```

```markdown
<!-- src/content/projects/crunchy-filler.md -->
---
slug: crunchy-filler
title: Crunchy Filler
description: >-
  A Chrome extension that marks filler episodes across anime series on
  Crunchyroll, helping fans skip non-canon content and stay on track with
  the main story. Downloaded 200+ times.
image: https://images.unsplash.com/photo-1572177812156-58036aae439c
tags: [Developer Tools]
status: Completed
liveUrl: https://chromewebstore.google.com/detail/crunchy-filler/djbcknbbfoldifpllefimnnkfaogcnid
links:
  - label: Chrome Web Store
    href: https://chromewebstore.google.com/detail/crunchy-filler/djbcknbbfoldifpllefimnnkfaogcnid
date: "2022-01-01"
---
```

```markdown
<!-- src/content/projects/clip-verse.md -->
---
slug: clip-verse
title: Clip-Verse
description: >-
  A web tool that extracts location information from YouTube videos and
  automatically pins them to Google Maps, turning travel and exploration
  content into a navigable, interactive map.
image: https://images.unsplash.com/photo-1572177812156-58036aae439c
tags: [Developer Tools]
liveUrl: https://clipverse-five.vercel.app/
links:
  - label: Website
    href: https://clipverse-five.vercel.app/
date: "2023-06-01"
---
```

```markdown
<!-- src/content/projects/columbia-virtual-campus.md -->
---
slug: columbia-virtual-campus
title: Columbia Virtual Campus
description: >-
  A pandemic-born virtual community platform for Columbia students, offering
  resources, events, and initiatives. Co-founded and led product/tech
  development for a 40-student team across 5 projects, reaching 10,000+
  views and 500+ unique users.
image: https://images.unsplash.com/photo-1572177812156-58036aae439c
tags: [Others]
status: Completed
links:
  - label: Website
    href: https://columbiavirtualcampus.com/
  - label: Facebook
    href: https://www.facebook.com/columbiavirtualcampus/
  - label: Instagram
    href: https://www.instagram.com/columbiavirtualcampus/
date: "2020-05-01"
---
```

   **Reminder on `liveUrl`, per PRD §4.1 rows 2–4:** Med-Doc Tracker and Clip-Verse both get a `liveUrl` (their existing links are genuine "try it" destinations — a short.gy redirect and a Vercel-hosted tool respectively). Crunchy Filler also gets one (its Chrome Web Store listing is a "go install it" destination). Columbia Virtual Campus gets **no** `liveUrl` — it's defunct, pandemic-era, wound down; none of its three links is a live tool.

   - Acceptance criteria:
     1. All four files exist at the exact paths above; each `slug` matches its filename.
     2. `npm run build` succeeds with no validator error.
     3. `med-doc-tracker.md` and `clip-verse.md` have **no `status` key at all** — verify with `grep -L "^status:" src/content/projects/med-doc-tracker.md src/content/projects/clip-verse.md` (both files should be listed, meaning neither contains the string); `crunchy-filler.md` and `columbia-virtual-campus.md` both have `status: Completed`.
     4. `med-doc-tracker.md`, `crunchy-filler.md`, and `clip-verse.md` each have a `liveUrl`; `columbia-virtual-campus.md` has none.
     5. `columbia-virtual-campus.md`'s `links` array has exactly 3 entries (Website, Facebook, Instagram), each with `label` and `href`.
     6. All four `body` fields are empty; all four `image` values are byte-identical to the placeholder URL.

---

### Task 4 — Research collection (5 files)
   - Status: Done
   - Files: `src/content/research/flood-event-extraction-bangladesh.md` (new), `src/content/research/dvmm-lab.md` (new), `src/content/research/incite-labs.md` (new), `src/content/research/pill-recognition-prescription-extraction.md` (new), `src/content/research/solar-illumination-water-bottle.md` (new)
   - Changes: Per PRD §4.2. **No `liveUrl` key on any of these five** — SP02's Research schema doesn't define the field at all; setting it fails the build via `assertNoUnknownKeys`. Every entry gets the same drafted abstract text in both `description` and `body` — per PRD §4.2's own note, all 5 research bodies are "abstract-only" (no separate short-blurb/long-writeup split the way Projects has one): the 2–3 sentence, 30–50 word abstract is the entire content deliverable for each item, so it is written once and populates both the required `description` field and the markdown `body`. `flood-event-extraction-bangladesh.md`'s abstract is quoted verbatim from PRD §4.5.4 (the one the task explicitly required); the other four are drafted below, following the identical rule (past tense, method → headline result/number → outcome), not to be re-drafted.

   **The `incite-labs.md` link fix, called out once here since it's easy to miss:** its `links[]` carries **only** the Website entry. The source `research.js`'s "News Coverage" link (`labiotech.eu/best-biotech/hiv-test-app-home`) is a confirmed copy-paste bug — it's actually SMARTtest's link, unrelated to INCITE Labs — and is dropped per PRD §7/§9, not carried forward and not replaced with an invented citation.

```markdown
<!-- src/content/research/flood-event-extraction-bangladesh.md -->
---
slug: flood-event-extraction-bangladesh
title: Flood Event Extraction from News Media (Bangladesh)
description: >-
  Built a BERT-based classifier to extract flood events from 40,000+ tagged
  Bangladeshi news articles, then used the resulting time-series — validated
  against Sentinel satellite data — to help the Bangladesh government
  develop a flood-index insurance product. Presented at AGU; published as a
  pre-print.
image: https://images.unsplash.com/photo-1572177812156-58036aae439c
tags: [Machine Learning]
status: Completed
links:
  - label: Pre-print paper
    href: https://bit.ly/tejit-flood-research
  - label: AGU Abstract Presentation
    href: https://agu.confex.com/agu/fm20/meetingapp.cgi/Paper/766342
date: "2020-12-01"
---
Built a BERT-based classifier to extract flood events from 40,000+ tagged Bangladeshi news articles, then used the resulting time-series — validated against Sentinel satellite data — to help the Bangladesh government develop a flood-index insurance product. Presented at AGU; published as a pre-print.
```

```markdown
<!-- src/content/research/dvmm-lab.md -->
---
slug: dvmm-lab
title: DVMM Lab
description: >-
  Built a phrase-grounding pipeline using YOLOv3 and BERT to extract and
  link images and captions from research papers, reaching 85% accuracy,
  then constructed a searchable knowledge graph from the results. Also
  classified dosage-response curves from the extracted features, reaching
  92.7% accuracy with AdaBoost.
image: https://images.unsplash.com/photo-1572177812156-58036aae439c
tags: [Machine Learning]
status: Completed
links:
  - label: Project Report
    href: https://bit.ly/tejit-dvmm-lab-research-2020
date: "2020-08-01"
---
Built a phrase-grounding pipeline using YOLOv3 and BERT to extract and link images and captions from research papers, reaching 85% accuracy, then constructed a searchable knowledge graph from the results. Also classified dosage-response curves from the extracted features, reaching 92.7% accuracy with AdaBoost.
```

```markdown
<!-- src/content/research/incite-labs.md -->
---
slug: incite-labs
title: INCITE Labs
description: >-
  Extracted syllabi and mission statements from college websites to build a
  quantitative measure of liberal-arts education across institutions, and
  developed Python scripts to streamline the project's underlying SQL
  database interactions.
image: https://images.unsplash.com/photo-1572177812156-58036aae439c
tags: [Machine Learning]
status: Completed
links:
  - label: Website
    href: https://incite.columbia.edu/measuring-liberal-arts
date: "2020-05-01"
---
Extracted syllabi and mission statements from college websites to build a quantitative measure of liberal-arts education across institutions, and developed Python scripts to streamline the project's underlying SQL database interactions.
```

```markdown
<!-- src/content/research/pill-recognition-prescription-extraction.md -->
---
slug: pill-recognition-prescription-extraction
title: Pill Recognition & Prescription Extraction
description: >-
  Used Google Vision and OCR to extract pill features and prescription-bottle
  imprints, then built a multi-dimensional embedding from the collected data
  to train RandomForest and SVM classifiers for precise pill identification.
image: https://images.unsplash.com/photo-1572177812156-58036aae439c
tags: [Health, Machine Learning]
status: Completed
links:
  - label: Project Report
    href: https://www.researchgate.net/publication/340528010_Pill_Detection_Prescription_Analysis
date: "2019-05-01"
---
Used Google Vision and OCR to extract pill features and prescription-bottle imprints, then built a multi-dimensional embedding from the collected data to train RandomForest and SVM classifiers for precise pill identification.
```

```markdown
<!-- src/content/research/solar-illumination-water-bottle.md -->
---
slug: solar-illumination-water-bottle
title: A Study on the Solar Illumination Provided by a Water Bottle
description: >-
  Experimentally demonstrated that a "Liter of Light" water bottle
  outperforms a glass plate at illuminating low-light spaces like slums.
  Named a Regional Finalist at the Google Science Fair, and published and
  presented the research in the Journal of Basic and Applied Engineering
  Research.
image: https://images.unsplash.com/photo-1572177812156-58036aae439c
tags: [Other]
status: Completed
links:
  - label: JBAER Paper
    href: https://doi.org/10.7916/D8Q24BQ9
  - label: Google Science Fair
    href: https://www.hindustantimes.com/education/google-science-fair-two-indian-teens-among-global-finalists/story-B3iDwvHtxLngSz21egVOYJ.html
  - label: Times of India
    href: https://timesofindia.indiatimes.com/education/news/two-indian-teens-among-global-finalists-at-google-science-fair/articleshow/53736020.cms
date: "2017-05-01"
---
Experimentally demonstrated that a "Liter of Light" water bottle outperforms a glass plate at illuminating low-light spaces like slums. Named a Regional Finalist at the Google Science Fair, and published and presented the research in the Journal of Basic and Applied Engineering Research.
```

   - Acceptance criteria:
     1. All five files exist at the exact paths above; each `slug` matches its filename; each `status: Completed`.
     2. `npm run build` succeeds with no validator error, including the negative-space check: none of the five files has a `liveUrl` key (`grep -L "liveUrl" src/content/research/*.md` lists all 5).
     3. `incite-labs.md`'s `links` array has exactly **one** entry (Website) — confirm the labiotech.eu URL does not appear anywhere in this file (`grep -c "labiotech" src/content/research/incite-labs.md` → `0`).
     4. `pill-recognition-prescription-extraction.md`'s `tags` is `[Health, Machine Learning]` (both, multi-tag); `dvmm-lab.md`'s title is spelled `DVMM Lab` (not the résumé's "DMVV," per PRD §4.4's resolved naming call).
     5. Every file's `body` (below the frontmatter fence) is non-empty and, for each file, is textually identical to its own `description` value.
     6. All five `image` values are byte-identical to the placeholder URL.

---

### Task 5 — Work Experience collection (2 files)
   - Files: `src/content/work-experience/microsoft-fabric-maps.md` (new), `src/content/work-experience/jio-reliance-industries.md` (new)
   - Changes: Per PRD §4.3 and §4.5.5. **Exactly these two files — do not create a third file for "Programming for Entrepreneurs and Social Good."** That role is dropped from the site entirely (owner decision, PRD §4.3/§9) — there is no filename, no frontmatter, no `DRAFT_DATE` placeholder for it anywhere. Both files ship real, résumé-sourced dates; **zero `DRAFT_DATE: true` entries exist in this collection.** Per SP02's schema (§4.4.4), this collection has no `slug`/filename-agreement check and no `title`/`description`/`tags`/`status`/`image` fields at all — only `company`, `role`, `startDate`, `endDate`, `links`, and `body`.

```markdown
<!-- src/content/work-experience/microsoft-fabric-maps.md -->
---
company: Microsoft Fabric Maps
role: Software Engineer II
startDate: "2021-06-01"
endDate: "Present"
links:
  - label: Fabric Maps blog
    href: https://blog.fabric.microsoft.com/en-us/blog/introducing-maps-in-fabric-geospatial-insights-for-everyone/
  - label: QGIS Plugin
    href: https://plugins.qgis.org/plugins/AzureMapsCreator/
  - label: Creator Onboarding Tool
    href: https://azure.github.io/azure-maps-creator-onboarding-tool/
---
Lead engineer for the Tileset Job API, taking it from design through delivery to support large-scale geospatial data ingestion and map-tile generation. Built a performance-testing framework that cut latency regressions by 15% ahead of releases, and served as shadow PM, using competitive analysis that helped shape the 2025 roadmap.
```

```markdown
<!-- src/content/work-experience/jio-reliance-industries.md -->
---
company: Jio, Reliance Industries
role: Computer Vision Researcher
startDate: "2019-06-01"
endDate: "2019-08-01"
links: []
---
Built a TensorFlow-based license-plate recognition model for a campus security system, hand-annotating 1,000 training images to reach 65% accuracy. Also fine-tuned a BERT model to process and query legal documents.
```

   **On the two title/naming judgment calls (PRD §4.4, §8 item 3), both already resolved in the frontmatter above — do not "correct" either back to the résumé's wording:** the role's `role` value stays `Computer Vision Researcher` (not the résumé's "Machine Learning Intern"); the file's own frontmatter has no field to carry the "DVMM"-vs-"DMVV" question (that only affects Task 4's research entry) — noted here only to avoid confusion between the two naming calls the PRD flags.

   - Acceptance criteria:
     1. Exactly two files exist in `src/content/work-experience/` — `ls src/content/work-experience/*.md | wc -l` → `2`. No file for the dropped TA role exists anywhere in the repo.
     2. `npm run build` succeeds with no validator error; both files' `body` is non-empty (required — an empty body fails the build per SP02's `parseWorkExperience`).
     3. Neither file contains a `DRAFT_DATE` key — `grep -c "DRAFT_DATE" src/content/work-experience/*.md` → `0` for both files.
     4. `microsoft-fabric-maps.md` has `endDate: "Present"` (literal string, not a date) and `startDate: "2021-06-01"`; `jio-reliance-industries.md` has `startDate: "2019-06-01"` and `endDate: "2019-08-01"`.
     5. Sorted by `startDate` descending (`src/data/workExperience.ts`'s own sort), `microsoft-fabric-maps` resolves before `jio-reliance-industries` — confirm via `npm run build` output or a quick `node -e` sort check, matching PRD §4.3's ordering check.
     6. `jio-reliance-industries.md` has `links: []` (empty array, not an omitted key — the field is required by `assertLinks`, which accepts an empty array).

---

### Task 6 — Hero, About, and Contact copy (handed to SP03)
   - Files: none — this copy is not a markdown content file SP07 owns; it's prose consumed directly by SP03's `src/sections/Hero.tsx`, `src/sections/AboutSection.tsx`, and `src/sections/ContactSection.tsx` (already implemented per `03-landing-page-timeline/TASKS.md` Tasks 3, 8, 9, which inlined this exact text). This task exists to record the final, PRD-approved wording as the authoritative source and to verify SP03's implementation matches it — not to write a new file.
   - Changes: Per PRD §4.5.1, §4.5.2, §4.5.6. All three pieces of copy are quoted verbatim below — the PRD drafted them in full, so there is nothing left to draft here, only to confirm and cross-check.

   **Hero** (PRD §4.5.1):
   > **Eyebrow:** Health Tech Builder
   > **Greeting:** Hi, I'm Tejit.
   > **Paragraph:** I'm building Juno, an AI companion that helps patients get more out of every medical appointment — while working full-time as a Software Engineer II on Microsoft's Fabric Maps team. Health tech is where most of my energy outside of work goes, and where I'm headed next.

   **About** (PRD §4.5.2, full — 4 paragraphs):
   > I'm a software engineer who ends up building things end to end — backend systems at Microsoft during the day, and a health-tech startup nights and weekends.
   >
   > At Microsoft, I'm a Software Engineer II on the Fabric Maps team, where I work on the infrastructure and developer tools behind large-scale geospatial data.
   >
   > Outside of that, I'm building Juno — an AI companion that helps patients walk into a doctor's appointment prepared, and walk out with a clear record of what was said and what to do next. It's early: I'm validating the idea directly with patients and clinicians before scaling anything.
   >
   > Health tech isn't really a pivot for me — some of my first research, in college, was a self-testing app for HIV and syphilis and a pill-identification tool built from photos. Juno is the same instinct, aimed at a bigger problem.

   **Contact** (PRD §4.5.6):
   > **Heading:** Get in Touch
   > **Paragraph:** Whether you're hiring, working on something in health tech, or want to talk through Juno with a clinician's or researcher's eye — I'd like to hear from you.

   **No location line anywhere in the Contact copy** — this is a settled owner decision (PRD §3/§9), not an omission to fill in later.

   - Acceptance criteria:
     1. If `src/sections/Hero.tsx`, `src/sections/AboutSection.tsx`, `src/sections/ContactSection.tsx` already exist (per SP03), diff their inlined copy strings against the three blocks above — they must match verbatim (mdash/apostrophe characters included). If any file doesn't exist yet, this task's job is complete once the text above is confirmed as final; SP03's task implements the actual JSX.
     2. Hero eyebrow is ≤ 4 words; greeting is ≤ 6 words; hero paragraph is 35–55 words (PRD §4.5.1's length targets) — spot-check by word count.
     3. About prose is 3–4 paragraphs, ~120–180 words total (PRD §4.5.2).
     4. `grep -in "location" <the three files, once they exist>` returns no matches tied to a Contact address/city string.
     5. Every sentence in all three blocks is checked against the PRD's own throughline rule (§4.5): Juno is described as "building"/"early"/"validating," never as launched, staffed, or partnered; the Microsoft role is stated plainly, never hidden or apologized for.

---

### Task 7 — Full-set validation: SP02 validator and pre-launch gate
   - Files: none (verification only — no content or code changes in this task).
   - Changes: Run SP02's build-time validators and pre-launch content gate against the complete 17-file content set produced by Tasks 1–5, and confirm every claim this PRD makes about the finished set is actually true, not merely intended.
   - Steps:
     1. `npm run build` — must succeed with zero errors. Any validator error here names a specific file and field (per SP02's `shared.ts` error-message contract) — fix the named file against this document's tables, don't guess.
     2. `npm run check:launch` — must exit 0 and print "Pre-launch content check passed."
     3. `find src/content/projects -name '*.md' | wc -l` → `10`. `find src/content/research -name '*.md' | wc -l` → `5`. `find src/content/work-experience -name '*.md' | wc -l` → `2`.
     4. `grep -rc "DRAFT_DATE" src/content/` → every matched file reports `0` (i.e., the string does not appear anywhere in `src/content/`).
     5. `grep -rl "demo: true" src/content/projects/` → no matches. (`sample-project.md` is SP06's and is not part of this sub-project's 10; if it happens to already exist in the repo when this task runs, it is explicitly excluded from every count and check above — SP06's file, not SP07's.)
     6. `grep -rl 'images.unsplash.com/photo-1572177812156-58036aae439c' src/content/{projects,research}/ | wc -l` → `15` (10 projects + 5 research).
     7. Spot-check every `links[].href` across all 17 files against this document's Tasks 1–5 tables — confirm no link was dropped, retyped, or left pointing at the wrong destination (the INCITE Labs mis-paste in particular — confirm `labiotech.eu` appears in exactly one file across the whole content set, `smarttest.md`, and nowhere else).
     8. Confirm `microsoft-fabric-maps` sorts before `jio-reliance-industries` in `workExperience` (already checked per-collection in Task 5; re-confirm here as part of the full-set pass) and that `juno` sorts as the most recent entry in `projects` (its `2025-06-01` date is later than every other project's).

   - Acceptance criteria: all eight steps above pass. This task produces no diff of its own — if any step fails, the fix is a correction to the specific file identified, re-run from step 1, not a new task.

---

## Summary of what requires you (not a dev agent)

1. **The 4 low-confidence project dates are genuine guesses** — Juno (`2025-06-01`), Med-Doc Tracker (`2024-06-01`), Crunchy Filler (`2022-01-01`), Clip-Verse (`2023-06-01`). None of these gates the build; correct any you actually remember. A wrong one silently reorders `/projects` and can change what `src/config/featured.ts` backfills.
2. **Per-project `liveUrl` calls are this PRD's proposal, not locked** — Task 2/3 assign `liveUrl` to the QGIS Plugin, Creator Onboarding Tool, Med-Doc Tracker, Crunchy Filler, and Clip-Verse, and withhold it from the two hackathon-submission projects and Columbia Virtual Campus. Override any of these; nothing else in the affected file changes if you do.
3. **Two low-stakes title/naming judgment calls**: keeping "Computer Vision Researcher" (not the résumé's "Machine Learning Intern") for the Jio role, and keeping "DVMM Lab" (not the résumé's apparent "DMVV Lab" typo) for the research entry. Flag if you'd rather go the other way on either.
4. **Every drafted copy field in this file is a first draft, not a final one** — the Hero paragraph, the About prose, both flagship body writeups (Juno, SMARTtest), all 8 remaining project descriptions, all 4 remaining research abstracts, and the Contact copy all need your read-through and edit pass before launch. This is the expected outcome, not a gap.
5. **The Med-Doc-Tracker-body question**: per PRD §9/§4.1, Med-Doc Tracker is deliberately one of the 8 projects shipping with no `body` — a short description + link is the intended, not degraded, state. If you'd rather it get a longer writeup (a third flagship, alongside Juno and SMARTtest), that's a scope addition to flag, not something these tasks assume.
6. **The ~23-URL external-link liveness checklist (PRD §7)** is a five-minute manual click-through the owner does, prioritizing the three shorteners flagged as most likely to have rotted: `bit.ly/tejit-flood-research`, `bit.ly/tejit-dvmm-lab-research-2020`, `tejitpabari.short.gy/med-doc-tracker`. Task 7 verifies link *values* match this document; it does not verify the links are still live.
7. **Confirm the INCITE Labs "News Coverage" link should simply stay dropped** (this PRD's default, implemented in Task 4) rather than replaced — supply a real citation if you have one; otherwise no action needed.
8. Nothing else in this sub-project is owner-blocked in a way that stops the tasks above from proceeding — every table in PRD §4.1–§4.3 is complete and directly transcribed into Tasks 1–5.
