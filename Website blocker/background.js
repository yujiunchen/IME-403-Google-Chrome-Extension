// background.js

/***************************************************************
 * 1) On Installed: Initialize currentDay and reset timers
 ***************************************************************/
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.sync.get(["currentDay", "timers"], data => {
    const today = new Date().toISOString().slice(0, 10);
    let timers = data.timers || [];
    if (data.currentDay !== today) {
      // Reset each timer's usage for the new day.
      timers.forEach(timer => {
        timer.timeSpentToday = 0;
      });
      chrome.storage.sync.set({ currentDay: today, timers });
    }
  });
});

/***************************************************************
 * 2) Message Listener: Increment Time and Unblock Site
 ***************************************************************/
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // Only process if sender.tab exists and its URL starts with http:// or https://
  if (!(sender.tab && sender.tab.url && 
        (sender.tab.url.startsWith("http://") || sender.tab.url.startsWith("https://")))) {
    console.warn("Ignoring message for non-web page:", sender.tab ? sender.tab.url : "no tab");
    return true;
  }
  
  // Handle "incrementTime" message from content script
  if (message.action === "incrementTime") {
    const today = new Date().toISOString().slice(0, 10);
    
    // 2a) Update dailyUsage (live tracking)
    chrome.storage.sync.get("dailyUsage", data => {
      let dailyUsage = data.dailyUsage || {};
      if (!dailyUsage[today]) {
        dailyUsage[today] = {};
      }
      try {
        const urlObj = new URL(sender.tab.url);
        const hostname = urlObj.hostname;
        dailyUsage[today][hostname] = (dailyUsage[today][hostname] || 0) + 1; // increment by 1 second
      } catch (err) {
        console.error("Error parsing URL in incrementTime (dailyUsage):", err);
      }
      chrome.storage.sync.set({ dailyUsage });
    });
    
    // 2b) Update timers (configuration and blocking logic)
    chrome.storage.sync.get("timers", data => {
      let timers = data.timers || [];
      try {
        const urlObj = new URL(sender.tab.url);
        const hostname = urlObj.hostname;
        // Find a timer matching the active domain that is enabled.
        let matchedTimer = timers.find(timer => {
          try {
            const patternDomain = new URL(timer.urlPattern).hostname;
            return hostname.includes(patternDomain) && timer.enabled;
          } catch (e) {
            return false;
          }
        });
        if (matchedTimer) {
          // Increment by 1 second.
          matchedTimer.timeSpentToday = (matchedTimer.timeSpentToday || 0) + 1;
          matchedTimer.lastUpdated = Date.now();
          chrome.storage.sync.set({ timers }, () => {
            // If usage exceeds the daily limit, block the site.
            if (matchedTimer.dailyLimit > 0 && matchedTimer.timeSpentToday >= matchedTimer.dailyLimit) {
              chrome.tabs.update(sender.tab.id, {
                url: chrome.runtime.getURL("block.html") + "?original=" + encodeURIComponent(sender.tab.url)
              });
            }
          });
        }
      } catch (err) {
        console.error("Error in incrementTime handler (timers):", err);
      }
    });
    return true;
  }
  
  // Handle "unblockSite" message
  if (message.type === "unblockSite") {
    const originalUrl = message.originalUrl;
    if (!originalUrl) {
      sendResponse({ success: false, error: "No originalUrl provided." });
      return true;
    }
    let domain;
    try {
      domain = new URL(originalUrl).hostname;
    } catch (e) {
      sendResponse({ success: false, error: "Invalid originalUrl." });
      return true;
    }
    chrome.storage.sync.get("timers", data => {
      let timers = data.timers || [];
      timers = timers.map(timer => {
        try {
          const patternDomain = new URL(timer.urlPattern).hostname;
          if (domain.includes(patternDomain)) {
            timer.timeSpentToday = 0;
          }
        } catch (e) {
          // Ignore invalid timer patterns.
        }
        return timer;
      });
      chrome.storage.sync.set({ timers }, () => {
        chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
          if (tabs && tabs.length > 0) {
            const tabId = tabs[0].id;
            // Refresh the active tab with the original URL
            chrome.tabs.update(tabId, { url: originalUrl }, () => {
              if (chrome.runtime.lastError) {
                console.error("Error updating tab:", chrome.runtime.lastError);
                chrome.tabs.reload(tabId, () => {
                  sendResponse({ success: true, fallback: "Tab reloaded" });
                });
              } else {
                sendResponse({ success: true });
              }
            });
          } else {
            sendResponse({ success: false, error: "No active tab found." });
          }
        });
      });
    });
    return true;
  }
  
  return true;
});

/***************************************************************
 * 3) On Before Navigate: Block sites if time is up
 ***************************************************************/
chrome.webNavigation.onBeforeNavigate.addListener(details => {
  // Only process http(s) URLs
  if (!details.url.startsWith("http://") && !details.url.startsWith("https://")) return;
  
  chrome.storage.sync.get("timers", data => {
    let timers = data.timers || [];
    try {
      const urlObj = new URL(details.url);
      const domain = urlObj.hostname;
      let matchedTimer = timers.find(timer => {
        try {
          const patternDomain = new URL(timer.urlPattern).hostname;
          return domain.includes(patternDomain);
        } catch (e) {
          return false;
        }
      });
      if (matchedTimer && matchedTimer.dailyLimit > 0 && matchedTimer.timeSpentToday >= matchedTimer.dailyLimit) {
        chrome.tabs.update(details.tabId, {
          url: chrome.runtime.getURL("block.html") + "?original=" + encodeURIComponent(details.url)
        });
      }
    } catch (e) {
      // Ignore invalid URL.
    }
  });
}, { urls: ["<all_urls>"] });

/***************************************************************
 * 4) Debugging: Listen for Storage Changes (Optional)
 ***************************************************************/
chrome.storage.onChanged.addListener((changes, namespace) => {
  for (let key in changes) {
    console.log(`Storage key "${key}" in namespace "${namespace}" changed:`, changes[key]);
  }
});
