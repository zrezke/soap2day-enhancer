const urls = [
  "https:\\/\\/soap2day.ac\\/",
  "https:\\/\\/soap2day.to\\/",
  "https:\\/\\/soap2day.sh\\/",
  "https:\\/\\/soap2day.cx\\/",
  "https:\\/\\/s2dfree.to\\/",
  "https:\\/\\/s2dfree.cc\\/",
  "https:\\/\\/s2dfree.de\\/",
  "https:\\/\\/s2dfree.is\\/",
  "https:\\/\\/s2dfree.nl\\/",
]
  .map((val) => `(${val})`)
  .join("|");

let CURRENT_SOAP = null;

function atBaseSite() {
  return window.location.href[window.location.href.length - 1] === "/";
}

function atPlayerSite() {
  const elements = document.getElementsByClassName("panel-player");
  return elements.length != 0;
}

function atMovieOrSeriesSite() {
  return (
    document.getElementsByClassName("alert alert-info")[0].children.length == 2
  );
}

function createElementFromHTML(htmlString) {
  var div = document.createElement("div");
  div.innerHTML = htmlString.trim();

  // Change this to div.childNodes to support multiple top-level nodes.
  return div.firstChild;
}

async function createRecentSeriesInjection() {
  const injection = document.createElement("div");
  injection.classList.add("panel", "panel-info", "panel-default");
  const heading = document.createElement("div");
  heading.classList.add("panel-heading");
  const headingTitle = document.createElement("h4");
  headingTitle.classList.add("panel-title");
  headingTitle.appendChild(document.createTextNode("Recent Series"));
  heading.appendChild(headingTitle);
  injection.appendChild(heading);

  const body = document.createElement("div");
  body.classList.add("panel-body");
  const innerBodyDiv = document.createElement("div");
  innerBodyDiv.classList.add("col-sm-12", "col-lg-12", "no-padding");

  const recentSeries = await chrome.storage.sync.get("recentSeries");

  for (const series of recentSeries.recentSeries) {
    const elementDiv = document.createElement("div");
    elementDiv.classList.add(
      "col-lg-2",
      "col-md-4",
      "col-sm-6",
      "col-xs-6",
      "no-padding"
    );
    const link = document.createElement("a");
    link.href = series.href;
    elementDiv.appendChild(link);

    const thumbnailDiv = createElementFromHTML(series.thumbnail);
    const titleDiv = document.createElement("div");
    titleDiv.style = "height:40px;overflow: hidden; text-overflow: ellipsis;";
    const titleH5 = document.createElement("h5");
    titleH5.appendChild(document.createTextNode(series.title + " " + series.se_ep));
    titleDiv.appendChild(titleH5);
    thumbnailDiv.appendChild(titleDiv);
    link.appendChild(thumbnailDiv);
    innerBodyDiv.appendChild(elementDiv);
  }
  body.appendChild(innerBodyDiv);
  injection.appendChild(body);
  return injection;
}

async function createRecentMoviesInjection() {
  const injection = document.createElement("div");
  injection.classList.add("panel", "panel-info", "panel-default");
  const heading = document.createElement("div");
  heading.classList.add("panel-heading");
  const headingTitle = document.createElement("h4");
  headingTitle.classList.add("panel-title");
  headingTitle.appendChild(document.createTextNode("Recent Movies"));
  heading.appendChild(headingTitle);
  injection.appendChild(heading);

  const body = document.createElement("div");
  body.classList.add("panel-body");
  const innerBodyDiv = document.createElement("div");
  innerBodyDiv.classList.add("col-sm-12", "col-lg-12", "no-padding");

  const recentMovies = await chrome.storage.sync.get("recentMovies");

  for (const movie of recentMovies.recentMovies) {
    const elementDiv = document.createElement("div");
    elementDiv.classList.add(
      "col-lg-2",
      "col-md-4",
      "col-sm-6",
      "col-xs-6",
      "no-padding"
    );
    const link = document.createElement("a");
    link.href = movie.href;
    elementDiv.appendChild(link);

    const thumbnailDiv = createElementFromHTML(movie.thumbnail);
    const titleDiv = document.createElement("div");
    titleDiv.style = "height:40px;overflow: hidden; text-overflow: ellipsis;";
    const titleH5 = document.createElement("h5");
    titleH5.appendChild(document.createTextNode(movie.title));
    titleDiv.appendChild(titleH5);
    thumbnailDiv.appendChild(titleDiv);
    link.appendChild(thumbnailDiv);
    innerBodyDiv.appendChild(elementDiv);
  }
  body.appendChild(innerBodyDiv);
  injection.appendChild(body);
  return injection;
}

async function injectRecentlyWatched() {
  const targetDiv = document.getElementsByClassName("panel-body")[0];
  targetDiv.appendChild(await createRecentSeriesInjection());
  targetDiv.appendChild(await createRecentMoviesInjection());
}

async function storeSoap() {
  const moviesOrSeriesInfo =
    document.getElementsByClassName("alert alert-info")[0];
  const type = moviesOrSeriesInfo.children[1].textContent.trim();
  const indexOfTitle = moviesOrSeriesInfo.textContent.lastIndexOf(">>") + 2;
  const title = moviesOrSeriesInfo.textContent.substring(indexOfTitle).trim();
  CURRENT_SOAP = { type: type, title: title };
  const storedSoaps = await chrome.storage.sync
    .get("soaps")
    .then((res) => res.soaps);
  if (storedSoaps[type][title] !== undefined) {
    return;
  }
  const thumbnail = document.getElementsByClassName("thumbnail text-center")[0];
  // Remove add to favourites
  for (let i = 0; i < 3; i++) {
    thumbnail.removeChild(thumbnail.lastChild);
  }
  storedSoaps[type][title] = { thumbnail: thumbnail.outerHTML };

  await chrome.storage.sync.set({ soaps: storedSoaps });
}

async function storeMovieState(timeElapsed, duration) {
  const soaps = await chrome.storage.sync.get("soaps").then((s) => s.soaps);
  soaps["Movies"][CURRENT_SOAP.title].timeElapsed = timeElapsed;
  soaps["Movies"][CURRENT_SOAP.title].duration = duration;
  soaps["Movies"][CURRENT_SOAP.title].href = window.location.href;
  await chrome.storage.sync.set({ soaps: soaps });

  const recentMovies = await chrome.storage.sync
    .get("recentMovies")
    .then((res) => res.recentMovies);
  const movieAlreadyRecentIndex = recentMovies.findIndex(
    (obj) => obj.title === CURRENT_SOAP.title
  );
  const recentMovieObj = soaps.Movies[CURRENT_SOAP.title];
  recentMovieObj.title = CURRENT_SOAP.title;
  recentMovies.push(recentMovieObj);
  if (movieAlreadyRecentIndex >= 0) {
    recentMovies.splice(movieAlreadyRecentIndex, 1);
  } else if (recentMovies.length > 10) {
    recentMovies.shift();
  }
  await chrome.storage.sync.set({ recentMovies: recentMovies });
}

async function storeSeriesState(timeElapsed, duration) {
  const soaps = await chrome.storage.sync.get("soaps").then((s) => s.soaps);
  CURRENT_SOAP = {
    title: document
      .getElementsByClassName("alert alert-info")[0]
      .children[2].textContent.trim(),
    type: "TV Series",
  };
  soaps["TV Series"][CURRENT_SOAP.title].timeElapsed = timeElapsed;
  soaps["TV Series"][CURRENT_SOAP.title].duration = duration;
  soaps["TV Series"][CURRENT_SOAP.title].href = window.location.href;
  soaps["TV Series"][CURRENT_SOAP.title].se_ep = document
    .getElementsByClassName("player-title-bar text-center")[0]
    .textContent.replace("\n", "")
    .trim();
  await chrome.storage.sync.set({ soaps: soaps });

  const recentSeries = await chrome.storage.sync
    .get("recentSeries")
    .then((res) => res.recentSeries);

  const seriesAlreadyRecentIndex = recentSeries.findIndex(
    (obj) => obj.title === CURRENT_SOAP.title
  );
  const recentSeriesObj = soaps["TV Series"][CURRENT_SOAP.title];
  recentSeriesObj.title = CURRENT_SOAP.title;
  recentSeriesObj.se_ep = soaps["TV Series"][CURRENT_SOAP.title].se_ep;
  recentSeries.push(recentSeriesObj);
  if (seriesAlreadyRecentIndex >= 0) {
    recentSeries.splice(seriesAlreadyRecentIndex, 1);
  } else if (recentSeries.length > 10) {
    recentSeries.shift();
  }
  console.log(recentSeries);
  await chrome.storage.sync.set({ recentSeries: recentSeries });
}

async function storeSoapState() {
  const timeElapsed =
    document.getElementsByClassName("jw-text-elapsed")[0].textContent;
  const duration =
    document.getElementsByClassName("jw-text-duration")[0].textContent;
  if (CURRENT_SOAP && CURRENT_SOAP.type == "Movies") {
    await storeMovieState(timeElapsed, duration);
  } else {
    await storeSeriesState(timeElapsed, duration);
  }
}

window.addEventListener("load", (e) => {
  if (atBaseSite()) {
    injectRecentlyWatched();
  } else if (atMovieOrSeriesSite()) {
    storeSoap();
  }
});

window.addEventListener("beforeunload", async (e) => {
  if (atPlayerSite()) {
    await storeSoapState();
  }
});
