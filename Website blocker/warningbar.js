// WARNING BAR: This script checks the active website's remaining time
// and displays a warning bar if there are 5 minutes or less remaining.

function checkWarningBar() {
  // Retrieve timers from chrome.storage.sync
  chrome.storage.sync.get("timers", data => {
    const timers = data.timers || [];
    const currentUrl = window.location.href;
    let currentDomain;
    try {
      currentDomain = new URL(currentUrl).hostname;
    } catch (e) {
      console.error("Invalid current URL:", currentUrl);
      return;
    }
    
    // Find the timer that matches the current domain and is enabled.
    const matchedTimer = timers.find(timer => {
      try {
        const patternDomain = new URL(timer.urlPattern).hostname;
        return currentDomain.includes(patternDomain) && timer.enabled;
      } catch (e) {
        return false;
      }
    });
    
    // If a matching timer is found and a daily limit is set...
    if (matchedTimer && matchedTimer.dailyLimit > 0) {
      // Calculate live remaining seconds
      const spent = matchedTimer.timeSpentToday || 0;
      const lastUpdated = matchedTimer.lastUpdated || Date.now();
      const elapsed = Math.floor((Date.now() - lastUpdated) / 1000);
      let remaining = matchedTimer.dailyLimit - (spent + elapsed);
      if (remaining < 0) remaining = 0;
      
      // Only show the warning bar if there are 5 minutes (300 seconds) or less remaining
      if (remaining <= 300) {
        showWarningBar(remaining);
      } else {
        hideWarningBar();
      }
    } else {
      hideWarningBar();
    }
  });
}

function showWarningBar(remaining) {
  let warningBar = document.getElementById("warningBar");
  if (!warningBar) {
    warningBar = document.createElement("div");
    warningBar.id = "warningBar";
    // Style the warning bar: fixed at bottom, full width, red background with transparency.
    warningBar.style.position = "fixed";
    warningBar.style.bottom = "0";
    warningBar.style.left = "0";
    warningBar.style.width = "100%";
    warningBar.style.backgroundColor = "rgba(255, 0, 0, 0.8)"; // red with transparency
    warningBar.style.color = "white";
    warningBar.style.textAlign = "center";
    warningBar.style.padding = "10px";
    warningBar.style.zIndex = "9999";
    document.body.appendChild(warningBar);
  }
  // Format remaining time as "Xm Ys"
  const minutes = Math.floor(remaining / 60);
  const seconds = remaining % 60;
  warningBar.textContent = `Warning: Only ${minutes}m ${seconds}s remaining before your site is blocked.`;
  warningBar.style.display = "block";
}

function hideWarningBar() {
  const warningBar = document.getElementById("warningBar");
  if (warningBar) {
    warningBar.style.display = "none";
  }
}

// Run checkWarningBar every second
setInterval(checkWarningBar, 1000);
