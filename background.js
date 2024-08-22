//only for new windows:

chrome.action.onClicked.addListener((tab) => {
    chrome.tabs.create({
      url: chrome.runtime.getURL('options.html')
    });
  });
  
  chrome.webNavigation.onBeforeNavigate.addListener(function(details) {
    chrome.storage.sync.get(["blockedSites", "redirectUrl", "timeframes"], function(data) {
      let currentTime = new Date();
      let currentDay = currentTime.getDay();
      let currentHour = currentTime.getHours();
      let blockedSites = data.blockedSites || [];
      let redirectUrl = data.redirectUrl || "";
      let timeframes = data.timeframes || [];
  
      // Normalize the URL by removing the scheme
      let normalizedUrl = details.url.replace(/^https?:\/\//, '');
  
      // Check if the URL matches any of the blocked sites
      blockedSites.forEach((site) => {
        // Normalize the blocked site by removing the scheme
        let normalizedSite = site.replace(/^https?:\/\//, '');
  
        if (normalizedUrl.includes(normalizedSite)) {
          timeframes.forEach((timeframe) => {
            if (timeframe.day === currentDay && currentHour >= timeframe.start && currentHour < timeframe.end) {
              chrome.tabs.update(details.tabId, { url: redirectUrl });
            }
          });
        }
      });
    });
  }, { url: [{ schemes: ['http', 'https'] }] });
  
