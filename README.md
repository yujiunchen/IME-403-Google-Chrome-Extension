# IME-403-Google-Chrome-Extension
Here's a well-structured `README.md` for your Google Chrome extension, **MindfulBrowse**:

---

# MindfulBrowse - Chrome Extension

MindfulBrowse is a Chrome extension that helps users track and manage their web usage with timers, analytics, and personalized AI insights. It promotes mindful browsing habits by visualizing screen time, limiting distractions, and encouraging better time management.

## Features

- ⏳ **Screen Time Tracking**: Monitors time spent on websites and provides usage analytics.
- 📊 **Analytics Dashboard**: View usage trends with a visual chart and AI-generated insights.
- 🔔 **Website Blocking**: Set time limits for specific websites to reduce distractions.
- 🕰️ **Timers**: Add and manage timers for different sites to regulate browsing time.
- 🚀 **Minimal & Intuitive UI**: Clean interface with easy-to-use controls.
- 🤖 **AI Analysis**: Personalized recommendations based on browsing habits.

## Installation

1. Clone or download this repository:
   ```bash
   git clone https://github.com/yourusername/mindfulbrowse.git
   cd mindfulbrowse
   ```
2. Open **Google Chrome** and navigate to:
   ```
   chrome://extensions/
   ```
3. Enable **Developer Mode** (top right corner).
4. Click **Load unpacked** and select the `mindfulbrowse` folder.
5. The extension is now installed and ready to use!

## Usage

### 📌 Popup Interface
- The extension popup consists of three main tabs:
  - **Home**: Overview of total screen time and focus percentage.
  - **Screen Time**: Add timers, manage restrictions, and view browsing history.
  - **Analytics**: View graphical breakdowns of your usage.

### 🚫 Blocking Websites
- Set a time limit for a site using the **Screen Time** tab.
- Once time is up, access is blocked with an option to unblock.

### 📊 Analytics & AI Insights
- The **Analytics** tab shows a **doughnut chart** for usage trends.
- AI-generated insights provide mindful browsing suggestions.

## Files Overview

- `manifest.json` - Defines the extension configuration.
- `background.js` - Handles website tracking, alarms, and session storage.
- `popup.html` / `popup.js` - Main popup UI and functionality.
- `analytics.html` / `analytics.js` - Analytics dashboard with data visualization.
- `block.html` - Displays the blocked page when a time limit is exceeded.
- `timer.html` - UI for tracking and managing timers.
- `styles.css` - Styles for the extension UI.

## Dependencies

- **[Chart.js](https://www.chartjs.org/)** - Used for rendering visual analytics.
- **Chrome Storage API** - Saves user browsing history and preferences.

## Future Enhancements

- ⏩ **Detailed Weekly & Monthly Reports**
- 📅 **Customizable Scheduling for Blocks**
- 🎯 **Focus Mode with Productivity Insights**
- 📢 **Notifications for Break Reminders**

## Contributing

1. Fork this repository.
2. Create a new branch:
   ```bash
   git checkout -b feature-branch
   ```
3. Commit your changes:
   ```bash
   git commit -m "Added new feature"
   ```
4. Push to your branch:
   ```bash
   git push origin feature-branch
   ```
5. Create a Pull Request.
