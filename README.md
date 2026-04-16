# TMDB Web App

A simple movie search demo app using The Movie Database (TMDb) API. This app loads featured movie posters and lets you search for titles, then shows details in a popup.

## How to use

1. Get an API key from TMDB: https://www.themoviedb.org/
2. Replace `YOUR_TMDB_API_KEY` in `app.js` with your API key.
3. Open `index.html` in your browser or run a local server.

## Run a local server
- Use VS Code Live Server extension, or
- Run this in PowerShell:
  ```powershell
  cd "c:\Users\LeJa979\OneDrive - HP Inc\Works\Dev\tmdb-webapp"
  python -m http.server 8080
  ```

Then open `http://localhost:8080`.

## GitHub Pages deployment
1. Create a new GitHub repository.
2. Commit the contents of this folder (`tmdb-webapp`) to the repository root.
3. In the repository settings, enable GitHub Pages and set the branch to `main` or `master`.
4. If `index.html` is in the root, GitHub Pages can serve the app directly.

> Note: This app uses the TMDB API key directly in browser JavaScript, so it is best suited for demo purposes only.
