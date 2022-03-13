chrome.runtime.onInstalled.addListener((e) => {
  chrome.storage.sync.set({ soaps: { "TV Series": {}, Movies: {} } });
  chrome.storage.sync.set({ recentMovies: [] });
  chrome.storage.sync.set({ recentSeries: [] });
  console.log("Initialized soap storage");
});
