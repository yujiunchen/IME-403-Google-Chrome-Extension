/**
 * Normalize a domain string by:
 * 1) converting to lowercase,
 * 2) trimming whitespace,
 * 3) removing any leading "www.".
 */
function normalizeDomain(input) {
    let domain = input.trim().toLowerCase();
    if (domain.startsWith("www.")) {
      domain = domain.slice(4); // remove leading 'www.'
    }
    return domain;
  }
  
  document.getElementById("save").addEventListener("click", function() {
    const domainInput = document.getElementById("domain").value;
    const limitValue = parseInt(document.getElementById("limit").value, 10);
  
    if (!domainInput || isNaN(limitValue) || limitValue <= 0) {
      alert("Please enter a valid domain and a positive time limit.");
      return;
    }
  
    const normalized = normalizeDomain(domainInput);
  
    chrome.storage.sync.get("trackedWebsites", (data) => {
      let tracked = data.trackedWebsites || {};
      // Create/overwrite domain's data
      tracked[normalized] = {
        limit: limitValue,
        timeSpent: 0,
        blocked: false
      };
  
      chrome.storage.sync.set({ trackedWebsites: tracked }, () => {
        alert("Screen time set for " + normalized);
        updateCountdown(); // Immediately update so the user sees the new countdown
      });
    });
  });
  
  /**
   * Fetches tracked websites and updates the countdown display.
   */
  function updateCountdown() {
    chrome.storage.sync.get("trackedWebsites", (data) => {
      const timersDiv = document.getElementById("timers");
      timersDiv.innerHTML = ""; // Clear old entries
  
      let tracked = data.trackedWebsites || {};
      let domains = Object.keys(tracked);
  
      if (domains.length === 0) {
        timersDiv.textContent = "No website is currently tracked.";
        return;
      }
  
      for (let domain of domains) {
        let { limit, timeSpent } = tracked[domain];
        let remaining = Math.max(0, Math.floor(limit - timeSpent));
  
        let p = document.createElement("p");
        p.textContent = `${domain}: ${remaining} seconds remaining`;
        timersDiv.appendChild(p);
      }
    });
  }
  
  // Continuously update the timers every second
  setInterval(updateCountdown, 1000);
  updateCountdown();
  