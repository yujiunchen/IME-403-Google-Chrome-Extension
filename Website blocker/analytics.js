document.addEventListener("DOMContentLoaded", () => {
  // Load analytics immediately when the page loads.
  loadAnalytics();

  // Refresh analytics every 30 seconds.
  setInterval(loadAnalytics, 30000);

  // Listen for changes to storage (if dailyUsage changes, update analytics).
  chrome.storage.onChanged.addListener((changes, namespace) => {
    if (namespace === "sync" && changes.dailyUsage) {
      console.log("dailyUsage updated, refreshing analytics...");
      loadAnalytics();
    }
  });
});

/**
 * loadAnalytics retrieves dailyUsage from storage and renders the charts.
 */
function loadAnalytics() {
  chrome.storage.sync.get(["dailyUsage"], data => {
    if (chrome.runtime.lastError) {
      console.error("Error retrieving dailyUsage:", chrome.runtime.lastError);
      return;
    }
    let dailyUsage = data.dailyUsage || {};
    const today = new Date().toISOString().slice(0, 10);
    let todayUsage = dailyUsage[today] || {};

    renderChart(todayUsage);
    displayMostUsed(todayUsage);
    generateAIAnalysis(todayUsage);
  });
}

/**
 * renderChart creates a doughnut chart (using Chart.js) for today's usage.
 */
function renderChart(data) {
  const canvas = document.getElementById("timeChart");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");

  // Destroy any previous chart instance.
  if (window.myChart instanceof Chart) {
    window.myChart.destroy();
  }

  const labels = Object.keys(data);
  const values = labels.map(site => data[site] || 0);
  const backgroundColors = [
    "#FF6384", "#36A2EB", "#FFCE56", "#4CAF50",
    "#9C27B0", "#FF9800", "#795548", "#CDDC39",
    "#00BCD4", "#E91E63"
  ];

  window.myChart = new Chart(ctx, {
    type: "doughnut",
    data: {
      labels: labels,
      datasets: [{
        data: values,
        backgroundColor: backgroundColors.slice(0, labels.length)
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          display: true,
          position: "right"
        }
      }
    }
  });
}

/**
 * displayMostUsed creates a list of the most used websites.
 */
function displayMostUsed(data) {
  const mostUsedList = document.getElementById("mostUsedSites");
  if (!mostUsedList) return;
  mostUsedList.innerHTML = "";

  Object.entries(data)
    .sort((a, b) => b[1] - a[1])
    .forEach(([site, timeSpent]) => {
      const li = document.createElement("li");
      li.textContent = `${site}: ${timeSpent} min`;
      mostUsedList.appendChild(li);
    });
}

/**
 * generateAIAnalysis generates a recommendation based on the most used site.
 */
function generateAIAnalysis(data) {
  const aiMessage = document.getElementById("aiMessage");
  if (!aiMessage) return;
  const sorted = Object.entries(data).sort((a, b) => b[1] - a[1]);
  let mostUsed = sorted[0];
  if (mostUsed) {
    aiMessage.textContent = `You seem to spend a lot of time on ${mostUsed[0]}. Consider taking a break!`;
  } else {
    aiMessage.textContent = "No usage data available for today.";
  }
}
