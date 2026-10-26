# Weatherly — Dynamic Weather Website

A responsive weather dashboard built with plain HTML, CSS and JavaScript. It uses the free Open-Meteo forecast and geocoding APIs, so no API key is needed for this starter project.

## Features
- Current conditions, feels-like temperature, humidity, wind and pressure
- City search with geocoding
- Browser location weather (permission required)
- Hourly forecast and 7-day forecast
- Sunrise, sunset and daylight duration
- Dark/light theme toggle
- Responsive desktop and mobile layout
- Loading and error messages

## Run locally
1. Download or extract this project.
2. Open the folder in VS Code.
3. Start it with the VS Code Live Server extension, or run `python -m http.server 5500` in the folder and visit `http://localhost:5500`.
4. Search for a city such as Delhi, Mumbai, London or Garhwa.

You can also open `index.html` directly, but a local server is recommended.

## Deploy using GitHub Pages
1. Create a new repository on GitHub, for example `weatherly-website`.
2. Upload `index.html`, `styles.css`, `app.js`, and `README.md` to the repository root.
3. In the repository, open **Settings → Pages**.
4. Under **Build and deployment**, choose **Deploy from a branch**.
5. Choose branch **main** and folder **/(root)**, then click **Save**.
6. Wait for the Pages build to finish. Your site URL will appear in the Pages section.

## Notes
- Weather data is retrieved live from Open-Meteo. An internet connection is required.
- Browser location requires user permission and normally works on HTTPS (GitHub Pages uses HTTPS).
- The first screen uses approximate coordinates for Garhwa, India as the default.
- The weekly list shows the daily UV index in its last column.
