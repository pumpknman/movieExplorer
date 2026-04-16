const API_BASE = "https://api.themoviedb.org/3";
const IMAGE_BASE = "https://image.tmdb.org/t/p/w500";
const queryInput = document.getElementById("queryInput");
const searchButton = document.getElementById("searchButton");
const resultsContainer = document.getElementById("results");
const featuredGrid = document.getElementById("featuredGrid");
const appShell = document.querySelector(".app-shell");
const detailPage = document.getElementById("detailPage");
const detailBack = document.getElementById("detailBack");
const detailTitle = document.getElementById("detailTitle");
const detailBody = document.getElementById("detailBody");
const personPopup = document.getElementById("personPopup");
const personPopupBackdrop = document.getElementById("personPopupBackdrop");
const personPopupClose = document.getElementById("personPopupClose");
const personPopupContent = document.getElementById("personPopupContent");

const apiKey = "a32540f70deb350a188eb7321c6a3739";
const OMDB_API_KEY = "2bf9d0dd";
const OMDB_BASE = "https://www.omdbapi.com/";

function createPosterCard(movie) {
  const card = document.createElement("article");
  card.className = "poster-card";

  const posterPath = movie.poster_path
    ? `${IMAGE_BASE}${movie.poster_path}`
    : "https://via.placeholder.com/500x750?text=No+Image";

  card.innerHTML = `
    <img src="${posterPath}" alt="${movie.title} poster" />
    <div class="poster-meta">
      <h3>${movie.title}</h3>
      <span>⭐ ${movie.vote_average.toFixed(1)}</span>
    </div>
  `;

  card.addEventListener("click", () => showMovieDetail(movie.id));
  return card;
}

function createMovieCard(movie) {
  const card = document.createElement("article");
  card.className = "card";

  const posterPath = movie.poster_path
    ? `${IMAGE_BASE}${movie.poster_path}`
    : "https://via.placeholder.com/500x750?text=No+Image";

  card.innerHTML = `
    <img src="${posterPath}" alt="${movie.title} poster" />
    <div class="card-content">
      <h2 class="card-title">${movie.title}</h2>
      <p class="badge">⭐ ${movie.vote_average.toFixed(1)}</p>
      <p class="card-overview">${movie.overview || "No overview available."}</p>
    </div>
  `;

  card.addEventListener("click", () => showMovieDetail(movie.id));
  return card;
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function formatMoney(value) {
  return typeof value === "number" && value > 0 ? `$${value.toLocaleString()}` : "N/A";
}

function formatList(items) {
  return items && items.length > 0 ? items.join(" / ") : "N/A";
}

function getOmdbRating(ratings, source) {
  return ratings?.find(item => item.Source === source)?.Value || "N/A";
}

async function fetchOmdbRatings(imdbId) {
  if (!imdbId) return null;
  const url = `${OMDB_BASE}?i=${encodeURIComponent(imdbId)}&apikey=${OMDB_API_KEY}`;
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error("OMDb request failed");
    const data = await response.json();
    if (data.Response === "False") throw new Error(data.Error || "OMDb returned no data");
    return {
      imdbRating: data.imdbRating || "N/A",
      rottenTomatoes: getOmdbRating(data.Ratings, "Rotten Tomatoes"),
      omdbTitle: data.Title || "N/A",
      omdbYear: data.Year || "N/A"
    };
  } catch (error) {
    console.error("OMDb fetch error:", error);
    return null;
  }
}

function getCrewJobs(crew, jobs) {
  return jobs
    .map(job => crew.find(person => person.job === job))
    .filter(Boolean)
    .map(person => `${person.name} (${person.job})`);
}

function getAvatarFallback(name) {
  const initials = (name || "").split(" ").filter(Boolean).slice(0, 2).map(word => word[0].toUpperCase()).join("") || "?";
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120">
      <defs>
        <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#4f46e5" />
          <stop offset="100%" stop-color="#1d4ed8" />
        </linearGradient>
      </defs>
      <rect width="120" height="120" rx="30" fill="url(#g)" />
      <circle cx="60" cy="38" r="22" fill="#ffffff" opacity="0.98" />
      <circle cx="45" cy="34" r="6" fill="#1d4ed8" />
      <circle cx="75" cy="34" r="6" fill="#1d4ed8" />
      <path d="M42 52c8 8 28 8 36 0" stroke="#1d4ed8" stroke-width="5" fill="none" stroke-linecap="round" />
      <circle cx="60" cy="72" r="34" fill="none" stroke="#ffffff" stroke-opacity="0.16" stroke-width="8" />
      <text x="60" y="92" text-anchor="middle" font-family="Roboto, sans-serif" font-size="30" fill="#ffffff" font-weight="700">${initials}</text>
    </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

function renderCastCards(cast) {
  if (!cast || cast.length === 0) return `<p>No cast data available.</p>`;
  return `
    <div class="cast-grid">
      ${cast.slice(0, 12).map(actor => {
        const profilePath = actor.profile_path
          ? `${IMAGE_BASE}${actor.profile_path}`
          : getAvatarFallback(actor.name);
        return `
          <article class="cast-card" data-person-id="${actor.id}" data-person-name="${escapeHtml(actor.name)}">
            <img src="${profilePath}" alt="${escapeHtml(actor.name)} photo" />
            <div class="cast-meta">
              <strong>${escapeHtml(actor.name)}</strong>
            </div>
          </article>
        `;
      }).join("")}
    </div>
  `;
}

function renderCrewSection(crew) {
  if (!crew || crew.length === 0) return `<p>No crew data available.</p>`;
  const keyJobs = getCrewJobs(crew, ["Director", "Producer", "Screenplay", "Writer", "Cinematography", "Music", "Editing", "Production Designer"]);
  const otherJobs = crew.slice(0, 8).map(person => `${person.name} (${person.job})`);
  return `
    <p>${keyJobs.length > 0 ? keyJobs.join(" / ") : otherJobs.join(" / ")}</p>
  `;
}

async function fetchActorFilmography(personId) {
  if (!personId) return [];
  const url = `${API_BASE}/person/${personId}/movie_credits?api_key=${apiKey}&language=en-US`;
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error("Actor credits fetch failed");
    const data = await response.json();
    return data.cast || [];
  } catch (error) {
    console.error("Actor credits error:", error);
    return [];
  }
}

function sortCreditsByReleaseDate(credits) {
  return [...credits].sort((a, b) => {
    const dateA = a.release_date ? new Date(a.release_date).getTime() : 0;
    const dateB = b.release_date ? new Date(b.release_date).getTime() : 0;
    return dateB - dateA;
  });
}

function renderActorFilmographySection(actorName, credits) {
  if (!credits || credits.length === 0) {
    return `<p>No filmography data available for ${escapeHtml(actorName)}.</p>`;
  }
  const sortedCredits = sortCreditsByReleaseDate(credits).slice(0, 20);
  return `
    <h3>Filmography: ${escapeHtml(actorName)}</h3>
    <div class="actor-credits-grid">
      ${sortedCredits.map(movie => {
        const year = movie.release_date ? movie.release_date.slice(0, 4) : "N/A";
        return `
          <article class="actor-movie-card" data-movie-id="${movie.id}">
            <div class="actor-movie-meta">
              <strong>${escapeHtml(movie.title || movie.original_title || "Untitled")}</strong>
              <span>${escapeHtml(year)}${movie.character ? ` · ${escapeHtml(movie.character)}` : ""}</span>
            </div>
          </article>
        `;
      }).join("")}
    </div>
  `;
}

function attachActorClickHandlers() {
  const actorCards = detailBody.querySelectorAll(".cast-card[data-person-id]");
  actorCards.forEach(card => {
    card.addEventListener("click", async () => {
      const personId = card.dataset.personId;
      const personName = card.dataset.personName;
      if (personId) await showActorPopup(personId, personName);
    });
  });
}

async function fetchPersonDetails(personId) {
  if (!personId) return null;
  const url = `${API_BASE}/person/${personId}?api_key=${apiKey}&language=en-US`;
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error("Person details fetch failed");
    return await response.json();
  } catch (error) {
    console.error("Person details error:", error);
    return null;
  }
}

function renderPersonPopup(person, credits) {
  if (!person) {
    return `<p>Unable to load person details.</p>`;
  }

  const profilePath = person.profile_path
    ? `${IMAGE_BASE}${person.profile_path}`
    : getAvatarFallback(person.name);
  const birthday = person.birthday || "N/A";
  const placeOfBirth = person.place_of_birth || "N/A";
  const knownFor = person.known_for_department || "N/A";
  const homepage = person.homepage ? `<a href="${escapeHtml(person.homepage)}" target="_blank">${escapeHtml(person.homepage)}</a>` : "N/A";
  const biography = person.biography ? escapeHtml(person.biography).replace(/\n/g, "<br />") : "No biography available.";
  const creditsHtml = credits && credits.length > 0
    ? sortCreditsByReleaseDate(credits).slice(0, 15).map(movie => {
        const year = movie.release_date ? movie.release_date.slice(0, 4) : "N/A";
        return `
          <article class="actor-movie-card" data-movie-id="${movie.id}">
            <strong>${escapeHtml(movie.title || movie.original_title || "Untitled")}</strong>
            <span>${escapeHtml(year)}${movie.character ? ` · ${escapeHtml(movie.character)}` : ""}</span>
          </article>
        `;
      }).join("")
    : `<p>No filmography available.</p>`;

  return `
    <div class="person-popup-header">
      <div class="person-popup-image">
        <img src="${profilePath}" alt="${escapeHtml(person.name)} photo" />
      </div>
      <div class="person-popup-meta">
        <h2>${escapeHtml(person.name)}</h2>
        <p><strong>Known for:</strong> ${escapeHtml(knownFor)}</p>
        <p><strong>Born:</strong> ${escapeHtml(birthday)}</p>
        <p><strong>Place:</strong> ${escapeHtml(placeOfBirth)}</p>
        <p><strong>Homepage:</strong> ${homepage}</p>
      </div>
    </div>
    <section class="modal-section">
      <h3>Biography</h3>
      <p>${biography}</p>
    </section>
    <section class="modal-section">
      <h3>Filmography</h3>
      <div class="actor-credits-grid">${creditsHtml}</div>
    </section>
  `;
}

function openPersonPopup() {
  personPopup.classList.remove("hidden");
}

function closePersonPopup() {
  personPopup.classList.add("hidden");
  personPopupContent.innerHTML = "";
}

function attachPersonMovieCardHandlers() {
  const movieCards = personPopupContent.querySelectorAll(".actor-movie-card[data-movie-id]");
  movieCards.forEach(card => {
    card.addEventListener("click", () => {
      const movieId = card.dataset.movieId;
      if (movieId) {
        closePersonPopup();
        showMovieDetail(movieId);
      }
    });
  });
}

async function showActorPopup(personId, personName) {
  personPopupContent.innerHTML = `<div class="actor-credits-loading">Loading ${escapeHtml(personName)}...</div>`;
  openPersonPopup();
  const [person, credits] = await Promise.all([
    fetchPersonDetails(personId),
    fetchActorFilmography(personId)
  ]);
  personPopupContent.innerHTML = renderPersonPopup(person, credits);
  attachPersonMovieCardHandlers();
}

function openDetailPage() {
  appShell.classList.add("hidden");
  detailPage.classList.remove("hidden");
}

function closeDetailPage() {
  detailPage.classList.add("hidden");
  appShell.classList.remove("hidden");
  detailTitle.textContent = "";
  detailBody.innerHTML = "";
}

function renderDetailPage(movie, omdb = null) {
  const posterPath = movie.poster_path
    ? `${IMAGE_BASE}${movie.poster_path}`
    : "https://via.placeholder.com/500x750?text=No+Image";
  const genres = formatList((movie.genres || []).map(genre => genre.name));
  const runtime = movie.runtime ? `${movie.runtime} min` : "N/A";
  const releaseDate = movie.release_date || "N/A";
  const status = movie.status || "N/A";
  const tagline = movie.tagline || "";
  const homepage = movie.homepage ? `<a href="${escapeHtml(movie.homepage)}" target="_blank">${escapeHtml(movie.homepage)}</a>` : "N/A";
  const imdbLink = movie.imdb_id ? `<a href="https://www.imdb.com/title/${escapeHtml(movie.imdb_id)}" target="_blank">${escapeHtml(movie.imdb_id)}</a>` : "N/A";
  const productionCompanies = formatList((movie.production_companies || []).map(company => company.name));
  const productionCountries = formatList((movie.production_countries || []).map(country => country.name));
  const imdbRating = omdb?.imdbRating || "N/A";
  const rottenTomatoes = omdb?.rottenTomatoes || "N/A";
  const spokenLanguages = formatList((movie.spoken_languages || []).map(lang => lang.english_name || lang.name));
  const castHtml = renderCastCards(movie.credits?.cast || []);
  const crewHtml = renderCrewSection(movie.credits?.crew || []);
  const rawJson = escapeHtml(JSON.stringify(movie, null, 2));

  detailTitle.textContent = movie.title || movie.original_title || "Movie details";
  detailBody.innerHTML = `
    <div class="modal-top">
      <div class="modal-poster">
        <img src="${posterPath}" alt="${escapeHtml(movie.title)} poster" />
        <div class="poster-ratings">
          <span class="rating-pill rating-tmdb"><span>🎬</span>${movie.vote_average ? movie.vote_average.toFixed(1) : "N/A"}</span>
          <span class="rating-pill rating-imdb"><span>IMDb</span>${escapeHtml(imdbRating)}</span>
          <span class="rating-pill rating-rt"><span>🍅</span>${escapeHtml(rottenTomatoes)}</span>
        </div>
      </div>
      <div class="modal-details">
        ${tagline ? `<p class="detail-tagline">${escapeHtml(tagline)}</p>` : ""}
        <div class="detail-row"><strong>Original Title:</strong> ${escapeHtml(movie.original_title || movie.title || "N/A")}</div>
        <div class="detail-row"><strong>Status:</strong> ${escapeHtml(status)}</div>
        <div class="detail-row"><strong>Release Date:</strong> ${escapeHtml(releaseDate)}</div>
        <div class="detail-row"><strong>Runtime:</strong> ${escapeHtml(runtime)}</div>
        <div class="detail-row"><strong>Genres:</strong> ${escapeHtml(genres)}</div>
        <div class="detail-row"><strong>Language:</strong> ${escapeHtml(movie.original_language || "N/A")}</div>
        <div class="detail-row"><strong>Homepage:</strong> ${homepage}</div>
        <div class="detail-row"><strong>IMDB:</strong> ${imdbLink}</div>
        <div class="detail-row"><strong>Budget:</strong> ${formatMoney(movie.budget)}</div>
        <div class="detail-row"><strong>Revenue:</strong> ${formatMoney(movie.revenue)}</div>
        <div class="detail-row"><strong>Production:</strong> ${escapeHtml(productionCompanies)}</div>
        <div class="detail-row"><strong>Countries:</strong> ${escapeHtml(productionCountries)}</div>
        <div class="detail-row"><strong>Languages:</strong> ${escapeHtml(spokenLanguages)}</div>
      </div>
    </div>
    <section class="modal-section">
      <h3>Overview</h3>
      <p>${escapeHtml(movie.overview || "No overview available.")}</p>
    </section>
    <section class="modal-section">
      <h3>Top Cast</h3>
      ${castHtml}
    </section>
    <section class="modal-section">
      <h3>Crew</h3>
      ${crewHtml}
    </section>
    <section class="modal-section">
      <h3>Full TMDB JSON</h3>
      <pre class="raw-json">${rawJson}</pre>
    </section>
  `;
  attachActorClickHandlers();
  openDetailPage();
}

async function showMovieDetail(movieId) {
  const url = `${API_BASE}/movie/${movieId}?api_key=${apiKey}&language=en-US&append_to_response=credits,images,external_ids`;

  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error("Movie detail fetch failed");

    const movie = await response.json();
    const omdb = await fetchOmdbRatings(movie.imdb_id);
    renderDetailPage(movie, omdb);
  } catch (error) {
    console.error(error);
    alert("An error occurred while loading movie details.");
  }
}

const featuredTitles = [
  "The Super Mario Galaxy Movie (2026)",
  "Project Hail Mary (2026)",
  "Avatar: Fire and Ash (2025)",
  "Hoppers (2026)"
];

function normalizeTitle(title) {
  return title.replace(/\s*\(\d{4}\)$/, "").trim();
}

async function searchMovieByTitle(title) {
  const query = normalizeTitle(title);
  const url = `${API_BASE}/search/movie?api_key=${apiKey}&language=en-US&query=${encodeURIComponent(query)}`;
  const response = await fetch(url);
  if (!response.ok) throw new Error("Movie search failed");

  const data = await response.json();
  return data.results?.[0] || null;
}

async function fetchFeaturedMovies() {
  featuredGrid.innerHTML = `<div class="empty-state">Loading featured movies...</div>`;

  try {
    const results = await Promise.all(featuredTitles.map(title => searchMovieByTitle(title).catch(() => null)));
    const movies = results.filter(Boolean);

    if (movies.length === 0) {
      featuredGrid.innerHTML = `<div class="empty-state">Unable to load featured movies.</div>`;
      return;
    }

    featuredGrid.innerHTML = "";
    movies.forEach(movie => featuredGrid.appendChild(createPosterCard(movie)));
  } catch (error) {
    console.error(error);
    featuredGrid.innerHTML = `<div class="empty-state">Unable to load featured movies.</div>`;
  }
}

async function searchMovies(query) {
  if (!query) {
    resultsContainer.innerHTML = `<div class="empty-state">Please enter a search term.</div>`;
    return;
  }

  const url = `${API_BASE}/search/movie?api_key=${apiKey}&language=en-US&query=${encodeURIComponent(query)}`;
  resultsContainer.innerHTML = `<div class="empty-state">Searching...</div>`;

  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error("API request failed");

    const data = await response.json();
    const movies = data.results || [];

    if (movies.length === 0) {
      resultsContainer.innerHTML = `<div class="empty-state">No results found.</div>`;
      return;
    }

    resultsContainer.innerHTML = "";
    movies.forEach(movie => resultsContainer.appendChild(createMovieCard(movie)));
  } catch (error) {
    resultsContainer.innerHTML = `<div class="empty-state">An error occurred. Check the console.</div>`;
    console.error(error);
  }
}

searchButton.addEventListener("click", () => searchMovies(queryInput.value.trim()));
queryInput.addEventListener("keydown", event => {
  if (event.key === "Enter") {
    searchMovies(queryInput.value.trim());
  }
});

detailBack.addEventListener("click", closeDetailPage);
personPopupClose.addEventListener("click", closePersonPopup);
personPopupBackdrop.addEventListener("click", closePersonPopup);
window.addEventListener("keydown", event => {
  if (event.key === "Escape") {
    if (!personPopup.classList.contains("hidden")) {
      closePersonPopup();
      return;
    }
    if (!detailPage.classList.contains("hidden")) {
      closeDetailPage();
    }
  }
});

fetchFeaturedMovies();
