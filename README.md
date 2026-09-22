# Anjana B — Portfolio

A responsive portfolio for full-stack development and AI/ML projects, with a lightweight WebGL character. Built with HTML, CSS, and JavaScript; no installation or build step is required.

## Run locally

Open `index.html` in a browser, or run this optional preview server from the project folder:

```sh
python -m http.server 8000
```

Visit `http://localhost:8000`. Python is only needed for the preview server.

## Content

- **Projects:** NeuroWeave (published as ReMind), StellarisAI, and FoodSnap AI, with descriptions, features, stacks, and repository links. Additional links point to SprintMind AI and Food_D.
- **About:** Graduate biography, six skill groups, and both IEEE publication links.
- **Internships:** Edunet Foundation / EY GDS only, with the supplied completion certificate linked from the entry.
- **Education:** Degree and school details, CGPA 9.03 / 10, and Higher Secondary score of 96%.
- **Recognition:** Six original event photographs: ReMind at ICIETSD, Dekathon 3.0, ELYSIA third prize, Stellaris AI publication, Dreamvestor 2.0 district qualification, and AI Insight first prize. Newsletter editorship remains in the About profile.
- **Contact:** Email, LinkedIn, and GitHub.
- **Ask Anjana:** A character-led portfolio assistant with section-aware suggestions, local answers, and links into the site.

Project artwork consists of custom SVG illustrations, not product screenshots. Company badges use initials, not official logos.

## Files

| File | Purpose |
| --- | --- |
| `index.html` | All portfolio content and links |
| `style.css` | Responsive layouts, components, and character fallback |
| `script.js` | Navigation, project tabs, recognition dialog, and footer year |
| `recognition.js` | Native scroll progress, pinned photo stack, synchronized text, and static fallbacks |
| `character.js` | WebGL rendering, cursor response, and scroll path |
| `motion-boot.js` | First-paint intro decision and fail-open timeout |
| `motion.js` | Readiness progress, character handoff, hero scroll motion, and About previews |
| `motion.css` | Intro, shared motion easing, and responsive preview presentation |
| `cta.js` | Resume download feedback, magnetic links, and character gaze cues |
| `assistant.js` | Chat panel, conversation, context awareness, and navigation |
| `assistant.css` | Assistant layout, character trigger, and responsive styles |
| `portfolio-knowledge.js` | Structured verified knowledge and local answer matching |
| `assets/*.svg` | Project illustrations |
| `assets/Anjana-B-Resume.pdf` | Original supplied resume, available through the hero download link |
| `assets/EduNet-Certificate.pdf` | Original Edunet / EY completion certificate |
| `photos/*.jpeg` | Original achievement photographs supplied by Anjana |
| `favicon.svg` | Browser icon |

## Update the content

Edit the sections in `index.html`: `#work` for projects, `#about` for biography and skills, `#experience` for internships and education, `#recognition` for milestones, and `#contact` for links. Keep each project tab’s `data-panel` value matched to its panel ID. Add new illustrations to `assets/`.

The supplied `Anjana_B_Resume_.pdf` is the source for graduate status, CGPA, current technical focus, project descriptions, both publication titles and DOIs, and the RAG award. The [earlier public portfolio](https://github.com/anjanareghu/Anjana-B-Personal-Portfolio) and linked repositories supply additional projects, the StellarisAI second-author credit, and the newsletter role's February 2025 start date. LinkedIn could not be retrieved during this update; its supplied profile link is retained.

The supplied photo descriptions provide the six recognition stories, including AI Insight's 2025 date. Dekathon, ELYSIA, and Dreamvestor do not display unprovided years. The Edunet entry uses the supplied completion certificate: Student Development Program on Full Stack Web Development with AI Tools under the Next Gen Employability Program, academic year 2025–2026. This replaces the earlier January 2025 date; exact start and end dates are not stated. The certificate is served unchanged from `assets/EduNet-Certificate.pdf`.

## Cinematic interactions

The existing typography, palette, layout, content, and section order are preserved. Motion is progressively enhanced with native CSS, Web Animations, and `requestAnimationFrame`; no framework or build step is required.

- **Introduction:** Only a small centered `0–100` number appears on the existing background. HTML readiness contributes 25%, the character or its CSS fallback contributes 40%, and font readiness contributes 35%. The count eases toward completed milestones, not network byte estimates. Fonts get a 700ms deadline before using the existing system-font fallback. After a 90ms hold at 100, two background masks open from the center. The unchanged character approaches from 80% scale with slight translation and rotation; the original name reveals behind it through clipping. Navigation and metadata follow. The entrance settles over 1.05 seconds.
- **Fail-open behavior:** Escape or scrolling dismisses the sequence; a keyboard-focusable Skip introduction control stays visually hidden until focused. An independent 2.4-second watchdog restores the page if enhancement fails. Reduced motion, direct section links, and repeat visits within the same tab skip it. Only the `anjana:introduced:v2` sessionStorage flag is stored; unavailable storage also skips the intro.
- **First scroll:** On desktop with sufficient height, the existing hero stays sticky for a 95vh runway. Native scroll position determines the exact character position on a curved path and each name letter's translation, scale, and clipping. Stopping scroll freezes the path; reversing restores it. A small overlap brings the existing Projects heading into view before the name fully leaves. Section order stays unchanged. Touch, short viewports, and reduced motion disable the pin. There is no wheel interception or scroll locking.
- **Typography:** The original name remains untouched at rest. Measured letter copies supply the scroll effect while preserving its placement and period color; the heading retains its accessible name. Headings reveal with clipping and translation. Font families, weights, sizes, colors, and settled opacity are unchanged. About interactions use an underline, never a text color change.
- **About:** Three phrases preview the existing project illustrations with a small crossfade and cursor inertia. Desktop focus also opens previews; clicking selects and jumps to the matching project. On touch and with reduced motion, phrases act as buttons that reveal an inline image with a View project link. Escape dismisses previews. Original links still work without JavaScript.
- **Project tabs:** A short opacity/vertical transition accompanies a changed selection; reduced motion disables it.
- **Recognition and CTAs:** Existing photo storytelling, dialogs, magnetic controls, and accurate download feedback remain. Touch devices use the photo list, including large touch screens.

Tune the shared curve in `motion.css`, timing and readiness weights in `motion.js`, and character travel in `character.js`. Preview on a local server in a fresh tab to see the introduction; reloads in that tab skip it. To replay during development, remove the `anjana:introduced:v2` sessionStorage entry. The versioned key lets visitors see this revised entrance once. Check mouse, keyboard, narrow touch layouts, reduced motion, disabled JavaScript, and unavailable WebGL before publishing.

## Resume and contact links

The hero includes matching 56px pill links for downloading the resume and scrolling to Contact. The original PDF is served locally through a native `download` link; replace `assets/Anjana-B-Resume.pdf` to update it. Both links work without JavaScript.

On desktop, a padded hit area attracts each pill by at most 5px, with its contents moving 65% as far. Hover shifts the download arrow down toward its tray or the contact arrow up and right. The visible character looks toward the hovered link and resumes normal cursor tracking on leave. Paused animation, touch input, and reduced-motion preferences disable this gaze interaction. Mobile links stack, and magnetic movement is disabled on touch devices and with reduced motion.

Activating the resume link briefly displays a check and **Download started** for 1.8 seconds, with a polite screen-reader announcement. This acknowledges the native download request; browsers do not expose confirmation that a visitor saved the file. Keyboard focus stays visible, and Contact uses the site's native smooth anchor scrolling, which becomes immediate with reduced motion.

## Ask Anjana

The bottom-right character opens a 438 × 660px editorial panel on desktop and a nearly fullscreen modal on mobile. The mobile panel tracks the visual viewport to keep the composer above the keyboard. The character motion control docks at bottom left after the hero, clear of the launcher. Suggestions change with the current section, selected project, and active achievement. They do not rotate on a timer while someone is reading or focusing them.

**Replies currently run locally, using deterministic topic matching against verified portfolio content. No language model or AI provider is connected.** There are no API keys, outbound chat requests, analytics, browser storage, or saved conversations. The session persists while the page is open; New chat or a reload clears it. This is a functional portfolio Q&A interface, not a general-purpose generative assistant. Unsupported questions lead to the contact section instead of invented details.

`portfolio-knowledge.js` gathers project descriptions, stacks, internships, skills, and achievement summaries directly from the page. Its explicit records add verified education, contacts, team/guide credits, current interests, and the three certifications from the earlier portfolio. Update these records when those facts change. `AnjanaPortfolio.reply(question, context, previousTopic)` returns plain-text paragraphs, optional bullet points, and allowlisted navigation actions. User messages and answers render as text, never interpreted HTML. The UI can be connected to a server-side AI service later; credentials must stay on that server.

Enter sends; Shift+Enter adds a line. Minimize and close preserve the conversation, Escape dismisses the panel, and focus returns to the trigger. Desktop stays modeless so visitors can continue exploring; mobile contains focus in a native dialog. Reduced motion disables decorative motion. The trigger is hidden if JavaScript is unavailable, and the portfolio remains fully readable.

## Recognition scroll story

On desktop viewports wider than 1000px and at least 650px tall, a native CSS sticky stage pins within a taller gallery. Normal scroll progress moves the top photograph left, tilts it upward, and fades it at the edge. Underlying photographs scale and straighten into place. Description opacity, vertical movement, and the counter are synchronized to the same progress; there is no autoplay, wheel interception, or scroll locking. Reverse scrolling reverses the story, and the final entry holds briefly before the stage releases.

Mobile, touch input, short viewports, reduced motion, and disabled JavaScript show every article in a static vertical sequence. **View as list** also offers the complete reading order on desktop. In stack mode, inactive layers are inert and excluded from the accessibility tree; their normal HTML text remains available in list mode. Story dialogs and publication links work in both modes. Adjust `step`, hold length, and rotations in `recognition.js` to tune pacing.

## Recognition photographs

The gallery uses all six original JPEGs from `photos/`, with the ICCPCT / Stellaris AI publication featured first. Short summaries appear beside the stack; fuller descriptions, team credits, and existing publication links appear in the fullscreen stories.

| Photograph | Story |
| --- | --- |
| `Stellaris.jpeg` | Stellaris AI publication at IEEE ICCPCT 2025 |
| `ReMind.jpeg` | ReMind presentation at ICIETSD 2026 |
| `Dekathon.jpeg` | 72-hour Indo-Malaysian hackathon, 75 teams / 225 participants |
| `Ekha.jpeg` | Third prize at the ELYSIA Project Competition |
| `Asap.jpeg` | Dreamvestor 2.0 Round 3 district-level qualification and presentation |
| `Aiinsight.jpeg` | First prize at AI Insight 2025 for a Llama 3 Medical AI Assistant |

The original files are unchanged. Portrait and landscape photos retain their aspect ratios so people and awards stay in frame. Each figure's `--photo-ratio` is its intrinsic width divided by height; `.recognition-media--portrait` limits portrait width in list mode. The stack calculates its exit distance from the widest photograph. Images use intrinsic dimensions, descriptive alt text, lazy loading, and asynchronous decoding. Muted colors restore on hover or keyboard focus with a gentle 1.02 scale over 450ms. The fullscreen story shows the full original photo in color. Descriptions live in `.recognition-story`; article text and publication links remain usable without JavaScript. Close and Escape return focus to the story button. Reduced motion disables transitions.

## Character and accessibility

The same character appears in the introduction, settles into the hero with restrained cursor response, then becomes smaller and travels between the viewport edges through every section: Projects, About, Internships, Recognition, and Contact. Long sections, including the pinned photo gallery, have additional waypoints. Scroll position directly controls its route in both directions. Pause returns it to the hero. Reduced-motion preferences keep it static. The CSS fallback retains the introduction and movement when WebGL is unavailable.

- One transparent quad and one draw call per frame.
- Targets up to 60 FPS, or 30 FPS with a coarse pointer; actual performance depends on the device.
- Device pixel ratio capped at 1.5; canvas capped at 500,000 pixels.
- Animation stops when hidden, offscreen, paused, or while a story dialog is open.
- Section positions update after layout changes and tab selection.
- The character cannot intercept clicks or touch gestures.

Edit colors and materials in `character.js`; adjust `openingPose()` for the opening curve, section waypoints in `measure()`, and interpolation in `poseAt()` for the full scroll route. `setOpening()`, `setIntro()`, and `endIntro()` share geometry with the motion layer without duplicating the canvas.

Project tabs support arrow keys, Home, and End. All projects remain visible without JavaScript. The page includes visible keyboard focus, a skip link, and native expandable school details. Google Fonts supplies DM Sans, with Arial as a fallback.

## Deploy to GitHub Pages

1. Push the repository, including `assets/`, `photos/`, and all linked JavaScript and CSS files.
2. Open **Settings → Pages** in GitHub.
3. Choose **Deploy from a branch**.
4. Select your branch and **/(root)**, then save.

GitHub shows the published URL after deployment. Asset paths are relative, so a repository subpath is supported.

## Design

The section layout is inspired by the [Riotters drone demo](https://drone.riotters.com/). The glass character is inspired by the supplied image. Layout, illustrations, and shaders are custom implementations.

## License

No license has been selected. Add a license file if you want to specify reuse terms.
