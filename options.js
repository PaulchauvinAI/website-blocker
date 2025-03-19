function formatTimeString(hours, minutes = 0) {
    hours = Math.max(0, Math.min(23, parseInt(hours) || 0));
    minutes = Math.max(0, Math.min(59, parseInt(minutes) || 0));
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
}

function parseTimeString(timeString) {
    if (!timeString) return { hours: 0, minutes: 0 };
    const [hours, minutes] = timeString.split(':').map(Number);
    return {
        hours: hours || 0,
        minutes: minutes || 0
    };
}

function addBlockedWebsite() {
    let blockedSitesInput = document.getElementById("blockedSites").value.split(',').map(site => site.trim());
    
    if (!blockedSitesInput.filter(site => site).length) {
        showToast("Please enter at least one website", "error");
        return;
    }
  
    chrome.storage.sync.get("blockedSites", function(data) {
        let blockedSites = data.blockedSites || [];
        
        // Check for websites that might have been entered without proper domain format
        let processedSites = blockedSitesInput.map(site => {
            // Remove http/https protocol
            site = site.replace(/^(https?:\/\/)?(www\.)?/, '');
            // If user enters "facebook" instead of "facebook.com", fix it
            if (site === 'facebook') return 'facebook.com';
            if (site === 'youtube') return 'youtube.com';
            if (site === 'twitter') return 'twitter.com';
            if (site === 'instagram') return 'instagram.com';
            return site;
        });
        
        let newSites = processedSites.filter(site => site && site.match(/^[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9](?:\.[a-zA-Z]{2,})+$/));
        
        if (newSites.length === 0) {
            showToast("Please enter valid domain names (e.g., example.com)", "error");
            return;
        }
        
        blockedSites = blockedSites.concat(newSites);
        let uniqueBlockedSites = [...new Set(blockedSites)]; // Remove duplicates
  
        chrome.storage.sync.set({ blockedSites: uniqueBlockedSites }, function() {
            updateBlockedSitesList(uniqueBlockedSites);
            document.getElementById("blockedSites").value = ''; // Clear input after adding
            showToast(`Added ${newSites.length} website(s) to block list`);
        });
    });
}

function saveSettings() {
    let startTime = parseTimeString(document.getElementById("start").value);
    let endTime = parseTimeString(document.getElementById("end").value);
    let redirectUrl = document.getElementById("redirectUrl").value;

    // Validate redirectUrl
    if (redirectUrl && !redirectUrl.match(/^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/)) {
        showToast("Please enter a valid URL", "error");
        return;
    }

    let timeframes = [{
        day: new Date().getDay(),
        start: startTime.hours,
        startMinutes: startTime.minutes,
        end: endTime.hours,
        endMinutes: endTime.minutes
    }];

    chrome.storage.sync.set({ redirectUrl: redirectUrl, timeframes: timeframes }, function() {
        showToast("Settings saved successfully!");
    });
}

// Add a toast notification function for better user feedback
function showToast(message, type = "success") {
    const toast = document.createElement("div");
    toast.className = `toast ${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);
    
    // Trigger animation
    setTimeout(() => toast.classList.add("show"), 10);
    
    // Remove after 3 seconds
    setTimeout(() => {
        toast.classList.remove("show");
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

document.addEventListener('DOMContentLoaded', () => {
    chrome.storage.sync.get(["blockedSites", "timeframes", "redirectUrl"], function(data) {
        const timeframes = data.timeframes || [{ start: 9, startMinutes: 0, end: 17, endMinutes: 0 }];
        const timeframe = timeframes[0];
        
        document.getElementById("start").value = formatTimeString(timeframe.start, timeframe.startMinutes);
        document.getElementById("end").value = formatTimeString(timeframe.end, timeframe.endMinutes);
        document.getElementById("redirectUrl").value = data.redirectUrl || "";

        updateBlockedSitesList(data.blockedSites || []);
    });

    document.getElementById("add_website").addEventListener("click", addBlockedWebsite);
    document.getElementById("save_redirect").addEventListener("click", saveSettings);
});

function updateBlockedSitesList(blockedSites) {
    const siteList = document.getElementById("siteList");
    const emptyState = document.getElementById("empty-state");
    siteList.innerHTML = '';

    if (!blockedSites || blockedSites.length === 0) {
        emptyState.style.display = 'block';
        return;
    }

    emptyState.style.display = 'none';

    blockedSites.forEach(site => {
        let li = document.createElement("li");
        li.dataset.site = site;
        
        let siteIcon = document.createElement("i");
        siteIcon.className = "fas fa-globe";
        siteIcon.style.marginRight = "10px";
        siteIcon.style.color = "var(--primary-color)";
        
        let siteText = document.createTextNode(site);
        
        let deleteButton = document.createElement("button");
        deleteButton.innerHTML = '<i class="fas fa-trash-alt"></i> Remove';
        deleteButton.className = "btn-remove";
        deleteButton.onclick = function(e) {
            e.preventDefault();
            removeSite(site);
        };

        li.appendChild(siteIcon);
        li.appendChild(siteText);
        li.appendChild(deleteButton);
        siteList.appendChild(li);
    });
}

function removeSite(site) {
    const li = document.querySelector(`li[data-site="${site}"]`);
    if (li) {
        // Add animation class
        li.style.opacity = '0';
        li.style.transform = 'translateX(20px)';
        li.style.transition = 'all 0.3s ease';
        
        // Wait for animation to complete before removing
        setTimeout(() => {
            chrome.storage.sync.get("blockedSites", function(data) {
                let blockedSites = data.blockedSites || [];
                let updatedSites = blockedSites.filter(blockedSite => blockedSite !== site);

                chrome.storage.sync.set({ blockedSites: updatedSites }, function() {
                    updateBlockedSitesList(updatedSites);
                    showToast(`Removed "${site}" from block list`);
                });
            });
        }, 300);
    } else {
        // Fallback if element not found
        chrome.storage.sync.get("blockedSites", function(data) {
            let blockedSites = data.blockedSites || [];
            let updatedSites = blockedSites.filter(blockedSite => blockedSite !== site);

            chrome.storage.sync.set({ blockedSites: updatedSites }, function() {
                updateBlockedSitesList(updatedSites);
                showToast(`Removed "${site}" from block list`);
            });
        });
    }
}