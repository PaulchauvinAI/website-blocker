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

    if (redirectUrl !== "" && !redirectUrl.startsWith("https://")) {
      redirectUrl = "https://" + redirectUrl;
    }

    // Extract the hostname and pathname from the URL
    let url = new URL(details.url);
    let hostname = url.hostname;
    let pathname = url.pathname;

    // Check if the hostname matches any of the blocked sites
    let shouldBlock = blockedSites.some(site => {
      // Remove 'www.' if present for consistent matching
      let normalizedSite = site.replace(/^www\./, '').toLowerCase();
      let normalizedHostname = hostname.replace(/^www\./, '').toLowerCase();
      
      // Check if the normalized hostname is exactly the normalized site, or a subdomain of it
      // Also ensure that the pathname is either empty or starts with '/'
      return (normalizedHostname === normalizedSite || normalizedHostname.endsWith('.' + normalizedSite)) &&
             (pathname === '' || pathname === '/' || pathname.startsWith('/watch'));
    });

    if (shouldBlock) {
      let isInBlockedTimeframe = timeframes.some(timeframe => 
        timeframe.day === currentDay && currentHour >= timeframe.start && currentHour < timeframe.end
      );

      if (isInBlockedTimeframe) {
        chrome.tabs.update(details.tabId, { url: redirectUrl });
      }
    }
  });
}, { url: [{ schemes: ['http', 'https'] }] });