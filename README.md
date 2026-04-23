# Job Watcher Frontend

This Vite + React app is prepared for GitHub Pages deployment and is wired to call Python CGI endpoints hosted on Obi.

## Local development

```bash
npm install
npm run dev
```

Create a `.env` file from `.env.example` and set:

```bash
VITE_API_BASE=https://obi.kean.edu/~solermig@kean.edu/cgi-bin/capstone_project
```

## Backend endpoint expected

- `GET /latest_snapshot.py`

Sample backend versions of those files are included in `backend_examples/`, main ones loaded from server.

## GitHub Pages

1. Push this project to a GitHub repo named `job-watcher`.
2. In **Settings → Pages**, set **Source** to **GitHub Actions**.
3. In **Settings → Secrets and variables → Actions → Variables**, add:
   - `VITE_API_BASE = https://obi.kean.edu/~solermig@kean.edu/cgi-bin/capstone_project`
4. Push to `main`.

Vite's static deploy guide says GitHub Pages deployments should use a build workflow, and GitHub Pages supports custom workflows for this publishing model. citeturn619834search1turn619834search0
