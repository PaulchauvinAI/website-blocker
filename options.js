function addBlockedWebsite() {
    let blockedSitesInput = document.getElementById("blockedSites").value.split(',').map(site => site.trim());
  
    chrome.storage.sync.get("blockedSites", function(data) {
      let blockedSites = data.blockedSites || [];
      blockedSites = blockedSites.concat(blockedSitesInput.filter(site => site));
  
      let uniqueBlockedSites = [...new Set(blockedSites)]; // Remove duplicates
  
      chrome.storage.sync.set({ blockedSites: uniqueBlockedSites }, function() {
        updateBlockedSitesList(uniqueBlockedSites);
      });
    });
  }


function saveSettings() {
  let start = parseInt(document.getElementById("start").value);
  let end = parseInt(document.getElementById("end").value);
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
        document.getElementById("blockedSites").value = '';
        document.getElementById("start").value = data.timeframes ? data.timeframes[0].start : "";
        document.getElementById("end").value = data.timeframes ? data.timeframes[0].end : "";
        document.getElementById("redirectUrl").value = data.redirectUrl || "";

        updateBlockedSitesList(data.blockedSites || []);
    });

    document.getElementById("add_website").addEventListener("click", addBlockedWebsite);
    document.getElementById("save_redirect").addEventListener("click", saveSettings);



    //document.getElementById("add_website").addEventListener("click", function() {
    //    let blockedSitesInput = document.getElementById("blockedSites").value.split(',').map(site => site.trim());
    //    let start = parseInt(document.getElementById("start").value);
    //    let end = parseInt(document.getElementById("end").value);
    //    let redirectUrl = document.getElementById("redirectUrl").value;
    //
    //    chrome.storage.sync.get("blockedSites", function(data) {
    //        let blockedSites = data.blockedSites || [];
    //        blockedSites = blockedSites.concat(blockedSitesInput.filter(site => site));
    //
    //        let uniqueBlockedSites = [...new Set(blockedSites)]; // Remove duplicates
    //
    //        let timeframes = [{
    //            day: new Date().getDay(),
    //            start: start,
    //            end: end
    //        }];
    //
    //        chrome.storage.sync.set({ blockedSites: uniqueBlockedSites, redirectUrl: redirectUrl, timeframes: timeframes }, function() {
    //            //alert("Settings saved!");
    //            updateBlockedSitesList(uniqueBlockedSites);
    //        });
    //    });
    //});
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
