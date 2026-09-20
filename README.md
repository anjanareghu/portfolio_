# Anjana B — Portfolio

A responsive personal portfolio for Anjana B, a frontend developer and Computer Science Engineering student. A typography-led design with warm neutrals, violet accents, and a small interactive WebGL sculpture.

## Features

- Responsive desktop and mobile layouts with accessible navigation
- Interactive, procedurally generated WebGL sculpture with a pause control
- Two clearly labeled concept projects with expandable briefs
- About, skills, internship experience, education, and contact sections
- Keyboard focus indicators, a skip link, and native expandable details
- Reduced-motion support and a static CSS fallback when WebGL is unavailable

## Built with

HTML, CSS, vanilla JavaScript, and the browser's WebGL API. Google Fonts supplies DM Sans, with Arial as a fallback. There are no package dependencies, downloaded 3D models, textures, or build steps.

## Run locally

Clone the repository and open `index.html` in a browser. For a local server, run this command from the project directory:

```sh
python -m http.server 8000
```

Then visit `http://localhost:8000`. Python is only needed for this optional preview method.

## Deploy with GitHub Pages

1. Push the repository to GitHub.
2. In the repository, open **Settings → Pages**.
3. Under **Build and deployment**, choose **Deploy from a branch**.
4. Select the branch containing `index.html`, choose **/(root)**, and save.

GitHub will show the published URL in the Pages settings once deployment finishes. The site uses relative paths for its CSS, JavaScript, and favicon, so it can be served from a repository subpath.

## Project files

| File | Purpose |
| --- | --- |
| `index.html` | Page content and metadata |
| `style.css` | Layout, visuals, and responsive styles |
| `script.js` | Navigation, footer year, and the WebGL renderer |
| `favicon.svg` | Browser tab icon |

## Customize

Edit content directly in `index.html`:

| Content | Where to edit |
| --- | --- |
| Introduction and availability | `#home` and `#contact` |
| Project previews, titles, and briefs | `#work` — search for `PLACEHOLDERS` |
| Biography and toolkit | `#about` |
| Internship roles, dates, and descriptions | `#experience` |
| Education | `.education-block` |
| GitHub and LinkedIn destinations | Existing external links throughout the page |

**Forme and Orbit are concept placeholders, not completed client projects.** Their previews are HTML/CSS illustrations; the dashboard numbers are sample data. Replace their titles, descriptions, previews, and expandable briefs with your own projects, and add repository or demo links when available. Existing internships and education were carried over from the previous portfolio; review and expand those details before publishing.

Update colors and layout in `style.css`; the main color variables are at the top. Replace `favicon.svg` to change the browser icon. Contact buttons open the existing LinkedIn profile; there is no backend or contact form to configure.

## WebGL and performance

The hero uses one mesh, one shader program, and one draw call per frame. Geometry is generated once on demand and reused when the context is restored.

- Starts when the sculpture is visible; skips initialization for reduced-motion preferences.
- Caps animation at 30 FPS, or 24 FPS for devices with a coarse pointer.
- Caps device pixel ratio at 1.5 and the canvas at approximately 800,000 pixels.
- Stops animation when offscreen, when the tab is hidden, or when paused.
- Falls back to a static CSS illustration if WebGL initialization fails or the context is lost.
- Responds to changes in reduced-motion preferences without reloading.

Renderer settings and shader colors are in `script.js`. All content and expandable details remain available without WebGL; the navigation and project briefs also work without JavaScript.

## Preview checks

Before publishing, inspect the page at desktop and mobile widths. Check navigation, keyboard focus, expandable details, external profile links, and the sculpture's pause/play control. Enable your operating system's reduced-motion setting to check the static presentation.

## Design reference

Inspired by the oversized typography, restrained palette, and spacious layout of [Filmbot](https://filmbot.com/). The portfolio layout, project illustrations, and WebGL geometry are custom implementations; no assets or source code from the reference site are included.

## License

No license has been specified for this repository. If you want others to reuse the code, add a license file with the terms you choose.
