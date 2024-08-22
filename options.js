function formatTimeString(hours) {
    hours = Math.max(0, Math.min(23, parseInt(hours) || 0));
    return hours.toString().padStart(2, '0') + ':00';
}

function parseTimeString(timeString) {
    const [hours, minutes] = timeString.split(':').map(Number);
    return hours;
}

function addBlockedWebsite() {
    let blockedSitesInput = document.getElementById("blockedSites").value.split(',').map(site => site.trim());
  
    chrome.storage.sync.get("blockedSites", function(data) {
        let blockedSites = data.blockedSites || [];
        blockedSites = blockedSites.concat(blockedSitesInput.filter(site => site));
  
        let uniqueBlockedSites = [...new Set(blockedSites)]; // Remove duplicates
  
        chrome.storage.sync.set({ blockedSites: uniqueBlockedSites }, function() {
            updateBlockedSitesList(uniqueBlockedSites);
            document.getElementById("blockedSites").value = ''; // Clear input after adding
        });
    });
}

function saveSettings() {
    let start = parseTimeString(document.getElementById("start").value);
    let end = parseTimeString(document.getElementById("end").value);
    let redirectUrl = document.getElementById("redirectUrl").value;

    let timeframes = [{
        day: new Date().getDay(),
        start: start,
        end: end
    }];

    chrome.storage.sync.set({ redirectUrl: redirectUrl, timeframes: timeframes }, function() {
        alert("Settings saved!");
    });
}

document.addEventListener('DOMContentLoaded', () => {
    chrome.storage.sync.get(["blockedSites", "timeframes", "redirectUrl"], function(data) {
        document.getElementById("start").value = data.timeframes ? formatTimeString(data.timeframes[0].start) : "09:00";
        document.getElementById("end").value = data.timeframes ? formatTimeString(data.timeframes[0].end) : "17:00";
        document.getElementById("redirectUrl").value = data.redirectUrl || "";

        updateBlockedSitesList(data.blockedSites || []);
    });

    document.getElementById("add_website").addEventListener("click", addBlockedWebsite);
    document.getElementById("save_redirect").addEventListener("click", saveSettings);
});

function updateBlockedSitesList(blockedSites) {
    const siteList = document.getElementById("siteList");
    siteList.innerHTML = '';

    blockedSites.forEach(site => {
        let li = document.createElement("li");
        li.textContent = site;

        let deleteButton = document.createElement("button");
        deleteButton.textContent = "Remove";
        deleteButton.style.marginLeft = "10px";
        deleteButton.onclick = function() {
            removeSite(site);
        };

        li.appendChild(deleteButton);
        siteList.appendChild(li);
    });
}

function removeSite(site) {
    chrome.storage.sync.get("blockedSites", function(data) {
        let blockedSites = data.blockedSites || [];
        let updatedSites = blockedSites.filter(blockedSite => blockedSite !== site);

        chrome.storage.sync.set({ blockedSites: updatedSites }, function() {
            updateBlockedSitesList(updatedSites);
        });
    });
}