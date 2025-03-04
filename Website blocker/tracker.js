// tracker.js
console.log("Tracker.js loaded");

// Check if the page is visible to avoid unnecessary increments when in the background.
function shouldTrack() {
  return !document.hidden;
}

// Send an increment message every second
setInterval(() => {
  if (shouldTrack()) {
    chrome.runtime.sendMessage({ action: "incrementTime" });
  }
}, 1000);
