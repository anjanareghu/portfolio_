# Anjana B — Portfolio

A responsive portfolio for AI/ML projects, Python backend development, and published research. Built with HTML, CSS, vanilla JavaScript, and a lightweight WebGL character. The checked-in site runs without a build step.

## Run locally

From the project folder:

```sh
python -m http.server 8000
```

Open `http://localhost:8000`. You can also open `index.html` directly. Python is only needed for the optional preview server and content tools.

## Content

- **Hero:** Original name composition, lavender character, resume download, and contact link.
- **About and capabilities:** Graduate biography, linked credentials (two IEEE papers, CGPA 9.03, AI Insight first prize), and a skills index linked to relevant case study contributions.
- **Projects:** Five compact image cards for NeuroWeave / ReMind, StellarisAI, FoodSnap AI, SprintMind AI, and Food_D. Each opens a dedicated page with the existing descriptions, features, technology, project visuals, and repository links. Research projects retain their publications, team credits, and event photographs.
- **Research:** Both IEEE publications, author roles, DOI links, and related projects.
- **Experience and education:** Edunet Foundation / EY GDS certificate, IEEE newsletter editorship, degree, CGPA, and school details.
- **Recognition:** Six supplied event photographs and their stories.
- **Contact:** Visible email address with click-to-copy feedback, LinkedIn, GitHub, and another resume download. Copy is available where the Clipboard API is supported; email links always work.
- **Ask Anjana:** Local portfolio Q&A with section-aware suggestions and links into the content.

Project artwork is clearly labeled as concept illustration. Component diagrams summarize documented project flows; they are not deployment diagrams or performance benchmarks. No unverified metrics or live demo links have been added.

## Files

| File | Purpose |
| --- | --- |
| `index.html` | Main portfolio and generated project/research sections |
| `data/projects.json` | Shared records for all five projects and both papers |
| `data/project-content.js` | Generated project records for the local assistant |
| `scripts/build-content.py` | Generates the main content blocks and static case study pages |
| `scripts/check-content.py` | Validates HTML, local links, anchors, assets, and content invariants |
| `scripts/check-motion.cjs` | Dependency-free Node checks for motion behavior using a simulated DOM |
| `projects/*.html` | Shareable case studies, readable without JavaScript |
| `style.css` | Original palette, typography, responsive components, and CSS character |
| `editorial.css` | Revised heading hierarchy, editorial sections, desktop compositions, and case studies |
| `script.js` | Navigation, progressive enhancements, story dialog, and footer year |
| `character.js` | WebGL character, mouse gaze, and measured scroll compositions |
| `motion-control.js` | Shared pause preference and reduced-motion handling |
| `motion-boot.js` | Intro eligibility and independent fail-open watchdog |
| `motion.js` / `motion.css` | Counter intro, hero letters, heading masks, project motion, and About previews |
| `recognition.js` | Scroll-driven photograph stack and static reading mode |
| `cta.js` | Restrained magnetic links and accurate download feedback |
| `assistant.js` / `assistant.css` | Portfolio Q&A panel, navigation, and responsive presentation |
| `portfolio-knowledge.js` | Portfolio facts and deterministic answer matching |
| `assets/` | Original resume and certificate PDFs, plus custom project illustrations |
| `photos/` | Six original achievement photographs |
| `favicon.svg` | Browser icon |

## Update content

For all projects and papers, edit `data/projects.json`, then run:

```sh
python scripts/build-content.py
python scripts/check-content.py
```

Commit the JSON, generated `data/project-content.js`, and generated HTML together. The generator replaces only marked project/research regions in `index.html` and regenerates all five detail pages. Do not manually edit those generated regions or pages.

Edit biography, capabilities, experience, recognition, and contact directly in `index.html`. Replace `assets/Anjana-B-Resume.pdf` to update both download links. Keep IDs stable because navigation and assistant actions use them.

The supplied resume is the source for graduate status, CGPA, technical focus, project descriptions, publication titles and DOIs, and the RAG award. The [earlier public portfolio](https://github.com/anjanareghu/Anjana-B-Personal-Portfolio) and linked repositories supply additional projects and credits. The Edunet entry follows the supplied certificate: academic year 2025–2026; exact internship start and end dates are not stated. Unprovided recognition years remain omitted.

### Add application screenshots

The supplied files currently contain concept artwork and event photographs, not application screenshots. Detail pages label those accurately. Add real screenshots to `assets/` and populate the project's `screenshots` array in `data/projects.json`:

```json
{"src":"assets/neuroweave-dashboard.png","alt":"Describe the visible interface","caption":"Dashboard","width":1440,"height":900}
```

Regenerate the content to display them in the detail page gallery. `teaser` controls the short homepage summary; `summary`, `features`, and `stack` hold the full details. Keep unverified features, metrics, dates, and screenshots out of the records.

## Motion and composition

Motion progressively enhances the readable HTML. There is no wheel interception, scroll hijacking, animation framework, or duplicated WebGL canvas.

- **Introduction:** A small centered counter advances toward HTML, character/fallback, and font readiness milestones. Font waiting is capped at 700ms. At 100, background masks open and the same character settles into the original hero. Escape, scrolling, or the keyboard-accessible Skip introduction control dismisses it. A separate 2.4-second watchdog releases the page if enhancement fails.
- **Hero:** On a desktop with sufficient height, the existing composition uses a native sticky 95vh runway. The letters move first while the character holds its position. The original shaped title remains intact at rest.
- **About:** A concise introduction, three achievement highlights, and three compact skill groups occupy approximately one desktop screen. There are no tall scene rows. A small character sits in reserved space at the upper right and scrolls out with the introduction; mobile uses a natural single-column layout.
- **Character scale:** The hero character is 40% smaller than its previous size. About uses 90% of that reduced size (about 51% smaller than the former About portrait). There is no enlarged project wipe. The character stays clear of Projects, Research, Experience, and Recognition, with a small optional accent at Contact.
- **Typography:** Regular section headings range from 36–68px; the About statement tops out at 40px, Contact at 80px. The hero name, font family, font colors, background colors, and established palette are preserved. Transitions use masks and movement rather than text recoloring.
- **About previews:** Highlighted phrases reveal concept illustrations on hover or keyboard focus. Touch and reduced-motion modes use inline previews with an explicit destination link. Escape dismisses them.
- **Recognition:** Native scroll progress advances the six-photo stack in both directions. View as list provides the full reading order. Touch, short viewports, reduced motion, and paused motion use the static list. Original photos retain their aspect ratios; stories open in an accessible dialog.
- **Pause motion:** One control pauses the character, section effects, recognition stack, and decorative interactions. It releases sticky storytelling and preserves the current reading anchor where possible. System reduced-motion preferences take precedence. Touch and screens under 650px high retain the character in the hero and use a simpler reading layout. Shorter laptops retain the small About accent without pinning an oversized hero.

The intro uses `anjana:introduced:v2` in sessionStorage; the motion preference uses `anjana:motion-paused`. Storage is optional. Direct section links, repeat visits in the same tab, reduced motion, and paused motion skip the intro. Remove the introduced flag to replay it during development.

### WebGL budget

- One transparent quad and one draw call per rendered frame.
- Up to 60 FPS on desktop and 30 FPS with a coarse pointer; actual performance depends on the device.
- Pixel ratio capped at 1.5 and canvas capped at 500,000 pixels.
- Rendering stops when hidden, offscreen, paused, or while a story dialog is open.
- Scene geometry is measured on layout changes, not on every pointer event.
- The character never intercepts links or touch gestures.
- A CSS fallback remains available if WebGL fails or its context is lost.

Tune compositions in `character.js`, their content spacing in `editorial.css`, and the opening runway in `motion.js`. The character stays still when scrolling stops during its opening scenes; mouse input changes its gaze.

## Resume links and assistant

Resume downloads use native links, with a short **Download started** announcement. This acknowledges the request; the browser does not report whether someone saved the file. Magnetic movement is limited to 5px and disabled on touch or paused/reduced motion. The final Get in touch link opens an email; the hero link scrolls to Contact.

**Ask Anjana runs locally with deterministic topic matching. No language model, API provider, or backend is connected.** There are no API keys, outbound chat requests, analytics, or stored conversations. New chat or reload clears the conversation. Unsupported questions lead to contact instead of invented answers.

`portfolio-knowledge.js` reads full project records from generated `data/project-content.js` and research, skills, experience, and recognition from the page and supplements them with verified education and team credits. Update its explicit records when those facts change. Messages are rendered as plain text. Any future model integration should keep credentials on a server.

Enter sends; Shift+Enter adds a line. Escape closes the panel and restores focus. Desktop is modeless; mobile uses a dialog with focus containment. The quiet launcher shows its invitation on hover or focus, without timed popups.

## Recognition photographs

| Photograph | Story |
| --- | --- |
| `Stellaris.jpeg` | Stellaris AI publication at IEEE ICCPCT 2025 |
| `ReMind.jpeg` | ReMind presentation at ICIETSD 2026 |
| `Dekathon.jpeg` | 72-hour Indo-Malaysian hackathon |
| `Ekha.jpeg` | Third prize at the ELYSIA Project Competition |
| `Asap.jpeg` | Dreamvestor 2.0 district-level qualification |
| `Aiinsight.jpeg` | First prize at AI Insight 2025 |

Original photo files and supplied PDFs are unchanged. Photos have descriptive alt text, intrinsic dimensions, lazy loading, and asynchronous decoding.

## Checks before publishing

Run `python scripts/check-content.py` after content changes and `node scripts/check-motion.cjs` after interaction changes. The motion checks simulate scrolling, intro failure conditions, keyboard previews, cropped character scale, pause/resume, and reduced motion without external dependencies. Also review the page in a real browser at desktop and mobile sizes, with keyboard navigation, reduced motion, paused motion, disabled JavaScript, and unavailable WebGL. These checks do not measure visual quality or frame rate.

## Deploy to GitHub Pages

1. Push the repository including `projects/`, `assets/`, `photos/`, and every linked CSS/JavaScript file.
2. In GitHub, open **Settings → Pages**.
3. Choose **Deploy from a branch**, select your branch and **/(root)**, then save.

The generated pages are checked in, so GitHub Pages needs no custom build. All local asset paths are relative and support repository subpaths. `.gitignore` excludes caches, dependencies, logs, editor settings, and local secrets.

## Design and license

Compositions are inspired by the [Riotters drone demo](https://drone.riotters.com/) and the supplied character image and recordings. The implementation, illustrations, and shader are custom.

Further reference reviews: [Rinu Thomas K](https://rinu-portfolio.lovable.app/) for visible academic/research evidence, [Ebin Reji](https://www.ebinreji.online/) for project presentation, and [Ananthakrishnan S](https://ananthakrishnans.me/) for community experience and contact discoverability. Their personal content and assets are not used in this portfolio.

No license has been selected. Add a license file if you want to specify reuse terms.
