let lastCheckTime = Date.now();

// Create an alarm that fires every ~1 second
chrome.alarms.create("usageAlarm", { periodInMinutes: 0.01667 });

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name !== "usageAlarm") return;

  let [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
  if (!tab || !tab.url) return;

  let urlObj;
  try {
    urlObj = new URL(tab.url);
  } catch (e) {
    return; // Possibly a chrome:// or invalid URL
  }

  // Normalize the domain from the active tab
  let activeDomain = urlObj.hostname.toLowerCase();
  if (activeDomain.startsWith("www.")) {
    activeDomain = activeDomain.slice(4);
  }

  // Retrieve tracked websites
  chrome.storage.sync.get("trackedWebsites", (data) => {
    let tracked = data.trackedWebsites || {};

    if (tracked[activeDomain]) {
      let currentTime = Date.now();
      let elapsed = (currentTime - lastCheckTime) / 1000; // in seconds
      lastCheckTime = currentTime;

      // Increment the time spent for this domain
      tracked[activeDomain].timeSpent += elapsed;

      // Check if the limit is reached or exceeded, and if it's not already blocked
      if (
        tracked[activeDomain].timeSpent >= tracked[activeDomain].limit &&
        !tracked[activeDomain].blocked
      ) {
        // (Optional) Send a notification to the user
        chrome.notifications.create("", {
          type: "basic",
          iconUrl: "icon.png", // Make sure you have an icon.png in your extension folder
          title: "Screen Time Blocker",
          message: `Time's up for ${activeDomain}! This site is now blocked.`,
          priority: 2
        });

        // Add a dynamic rule to block future visits
        let rule = {
          id: 1,
          priority: 1,
          action: {
            type: "redirect",
            redirect: { extensionPath: "block.html" }
          },
          condition: {
            urlFilter: activeDomain,
            resourceTypes: ["main_frame"]
          }
        };
        chrome.declarativeNetRequest.updateDynamicRules({
          addRules: [rule],
          removeRuleIds: [1]
        });

        // Immediately redirect the user if they're still on this site
        chrome.tabs.update(tab.id, { url: chrome.runtime.getURL("block.html") });

        // Mark the site as blocked
        tracked[activeDomain].blocked = true;
      }

      // Save the updated usage data
      chrome.storage.sync.set({ trackedWebsites: tracked });
    } else {
      // If we're not tracking this domain, reset lastCheckTime
      lastCheckTime = Date.now();
    }
  });
});
