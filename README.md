# Anjana B — Portfolio

A responsive personal portfolio for Anjana B, a frontend developer and Computer Science Engineering student. It introduces her background, skills, internship experience, education, and ways to connect.

## Features

- Responsive layout for desktop and mobile screens
- Mobile navigation with section highlighting
- About, skills, experience, education, and contact sections
- CSS-built hero illustration and SVG favicon
- Reduced-motion support

## Built with

HTML, CSS, and vanilla JavaScript. Google Fonts supplies DM Sans and Space Grotesk; the site has no package dependencies or build step.

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
| `script.js` | Mobile navigation, active section state, and footer year |
| `favicon.svg` | Browser tab icon |

## Customize

Edit the text and external profile links in `index.html`. Update colors and layout in `style.css`; the main color variables are at the top of the file. Replace `favicon.svg` if you want a different browser icon. The contact section links to LinkedIn and GitHub; it does not submit a contact form.

## License

No license has been specified for this repository. If you want others to reuse the code, add a license file with the terms you choose.
