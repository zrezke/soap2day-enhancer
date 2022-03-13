
chrome.runtime.onInstalled.addListener((e) => {
  chrome.storage.local.set({ soaps: { "TV Series": {}, Movies: {} } });
  chrome.storage.local.set({ recentMovies: [] });
  chrome.storage.local.set({ recentSeries: [] });
  console.log("Initialized soap storage");
});
