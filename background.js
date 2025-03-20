chrome.action.onClicked.addListener((tab) => {
  chrome.tabs.create({
    url: chrome.runtime.getURL('options.html')
  });
});

// Keep track of recently blocked sites to avoid multiple console logs
const recentlyBlockedSites = new Set();

// Clear the set of recently blocked sites every 5 minutes
setInterval(() => {
  recentlyBlockedSites.clear();
}, 5 * 60 * 1000);

chrome.webNavigation.onBeforeNavigate.addListener(function(details) {
  // Skip subframes, we only want to block top-level frames
  if (details.frameId !== 0) return;
  
  chrome.storage.sync.get(["blockedSites", "redirectUrl", "timeframes"], function(data) {
    let currentTime = new Date();
    let currentDay = currentTime.getDay();
    let currentHour = currentTime.getHours();
    let currentMinute = currentTime.getMinutes();
    let blockedSites = data.blockedSites || [];
    let redirectUrl = data.redirectUrl || "chrome://newtab";
    let timeframes = data.timeframes || [];

    // Properly format the redirect URL
    if (redirectUrl !== "" && !redirectUrl.startsWith("chrome://") && !redirectUrl.startsWith("https://") && !redirectUrl.startsWith("http://")) {
      redirectUrl = "https://" + redirectUrl;
    }

    try {
      // Extract the hostname and pathname from the URL
      let url = new URL(details.url);
      let hostname = url.hostname;
      let pathname = url.pathname;

      // Check if the hostname matches any of the blocked sites
      let shouldBlock = blockedSites.some(site => {
        // Remove 'www.' if present for consistent matching
        let normalizedSite = site.replace(/^www\./, '').toLowerCase().trim();
        let normalizedHostname = hostname.replace(/^www\./, '').toLowerCase();
        
        // Basic check if the site is actually a domain pattern
        if (!normalizedSite.includes('.')) return false;
        
        // Check if the normalized hostname exactly matches the normalized site, or ends with the site as a domain
        return normalizedHostname === normalizedSite || 
               normalizedHostname.endsWith('.' + normalizedSite);
      });

      if (shouldBlock) {
        // Check if the current time is in any of the blocked timeframes
        let isInBlockedTimeframe = timeframes.some(timeframe => {
          // If day doesn't match, no need to check time
          if (timeframe.day !== currentDay) return false;
          
          const startTotalMinutes = (timeframe.start * 60) + (timeframe.startMinutes || 0);
          const endTotalMinutes = (timeframe.end * 60) + (timeframe.endMinutes || 0);
          const currentTotalMinutes = (currentHour * 60) + currentMinute;
          
          return currentTotalMinutes >= startTotalMinutes && currentTotalMinutes < endTotalMinutes;
        });

        if (isInBlockedTimeframe) {
          console.log(`Blocking access to ${hostname} and redirecting to ${redirectUrl}`);
          
          // Log the blocking (if this site hasn't been recently blocked)
          if (!recentlyBlockedSites.has(hostname)) {
            recentlyBlockedSites.add(hostname);
            
            console.log(`Website Blocked: Access to ${hostname} has been blocked during your focus time.`);
          }
          
          chrome.tabs.update(details.tabId, { url: redirectUrl });
        }
      }
    } catch (error) {
      console.error("Error processing URL:", error);
    }
  });
}, { url: [{ schemes: ['http', 'https'] }] });

// Add an install handler to set up default settings
chrome.runtime.onInstalled.addListener(function(details) {
  if (details.reason === "install") {
    // Initialize with default settings
    const defaultSettings = {
      blockedSites: [],
      redirectUrl: "https://www.google.com",
      timeframes: [{
        day: new Date().getDay(),
        start: 9,
        startMinutes: 0,
        end: 17,
        endMinutes: 0
      }]
    };
    
    chrome.storage.sync.set(defaultSettings, function() {
      console.log("Default settings initialized");
      
      // Log welcome message instead of showing notification
      console.log('Website Blocker Installed! Click the extension icon to configure your website blocking settings.');
    });
  }
});