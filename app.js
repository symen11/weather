const $ = (id) => document.getElementById(id);
const state = { latitude: 23.83, longitude: 83.93, city: "Garhwa", country: "India", timezone: "Asia/Kolkata" };

const weatherCodes = {
  0: ["Clear sky", "☀️"], 1: ["Mainly clear", "🌤️"], 2: ["Partly cloudy", "⛅"], 3: ["Overcast", "☁️"],
  45: ["Fog", "🌫️"], 48: ["Rime fog", "🌫️"], 51: ["Light drizzle", "🌦️"], 53: ["Drizzle", "🌦️"], 55: ["Dense drizzle", "🌧️"],
  56: ["Freezing drizzle", "🌧️"], 57: ["Freezing drizzle", "🌧️"], 61: ["Light rain", "🌦️"], 63: ["Rain", "🌧️"], 65: ["Heavy rain", "🌧️"],
  66: ["Freezing rain", "🌧️"], 67: ["Heavy freezing rain", "🌧️"], 71: ["Light snow", "🌨️"], 73: ["Snow", "🌨️"], 75: ["Heavy snow", "❄️"],
  77: ["Snow grains", "🌨️"], 80: ["Rain showers", "🌦️"], 81: ["Rain showers", "🌧️"], 82: ["Heavy showers", "⛈️"],
  85: ["Snow showers", "🌨️"], 86: ["Heavy snow showers", "❄️"], 95: ["Thunderstorm", "⛈️"], 96: ["Thunderstorm with hail", "⛈️"], 99: ["Thunderstorm with hail", "⛈️"]
};
function weatherInfo(code) { return weatherCodes[code] || ["Conditions unavailable", "🌡️"]; }
function setStatus(message, isError = false) { $("status").textContent = message; $("status").classList.toggle("error", isError); }
function formatTime(iso) { if (!iso) return "--:--"; const time = iso.split("T")[1]; return time ? time.slice(0, 5) : "--:--"; }
function weekday(iso, short = true) { return new Date(`${iso}T12:00:00`).toLocaleDateString("en-US", { weekday: short ? "short" : "long" }); }
function safeNum(n, suffix = "") { return Number.isFinite(n) ? `${Math.round(n)}${suffix}` : `--${suffix}`; }

async function geocodeCity(query) {
  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=1&language=en&format=json`;
  const response = await fetch(url);
  if (!response.ok) throw new Error("Could not search for that city. Try again.");
  const data = await response.json();
  if (!data.results?.length) throw new Error("City not found. Check the spelling and try again.");
  const place = data.results[0];
  return { latitude: place.latitude, longitude: place.longitude, city: place.name, country: place.country || "", timezone: place.timezone || "auto" };
}
async function loadWeather(place = state) {
  setStatus(`Loading live weather for ${place.city}…`);
  $("cityName").textContent = `${place.city}${place.country ? `, ${place.country}` : ""}`;
  try {
    const params = new URLSearchParams({
      latitude: place.latitude, longitude: place.longitude, timezone: place.timezone || "auto",
      current: "temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,pressure_msl,wind_speed_10m,wind_direction_10m",
      hourly: "temperature_2m,precipitation_probability,weather_code",
      daily: "weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,uv_index_max",
      forecast_days: "7", forecast_hours: "24", wind_speed_unit: "kmh"
    });
    const response = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`);
    if (!response.ok) throw new Error("Weather service is temporarily unavailable.");
    const data = await response.json();
    if (!data.current || !data.daily) throw new Error("No forecast data was returned for this location.");
    Object.assign(state, place);
    renderWeather(data, place);
    setStatus(`Weather updated for ${place.city}. Data refreshes whenever you search.`);
  } catch (error) {
    setStatus(error.message || "Something went wrong. Please try again.", true);
  }
}
function renderWeather(data, place) {
  const c = data.current, d = data.daily, h = data.hourly;
  const [description, icon] = weatherInfo(c.weather_code);
  $("temperature").textContent = safeNum(c.temperature_2m);
  $("feelsLike").textContent = `${safeNum(c.apparent_temperature)}°C`;
  $("condition").textContent = description;
  $("conditionPill").textContent = description;
  $("mainWeatherIcon").textContent = c.is_day ? icon : (c.weather_code === 0 ? "🌙" : icon);
  $("humidity").textContent = safeNum(c.relative_humidity_2m, "%");
  $("wind").textContent = `${safeNum(c.wind_speed_10m)} km/h`;
  $("windDirection").textContent = `Direction ${safeNum(c.wind_direction_10m, "°")}`;
  $("pressure").textContent = safeNum(c.pressure_msl, " hPa");
  $("uv").textContent = safeNum(d.uv_index_max?.[0]);
  const uv = d.uv_index_max?.[0] ?? 0;
  $("uvLabel").textContent = uv < 3 ? "Low" : uv < 6 ? "Moderate" : uv < 8 ? "High" : "Very high";
  $("highTemp").textContent = `${safeNum(d.temperature_2m_max?.[0])}°`;
  $("lowTemp").textContent = `${safeNum(d.temperature_2m_min?.[0])}°`;
  $("localDate").textContent = new Date().toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric", year: "numeric" });
  $("updatedAt").textContent = `As of ${formatTime(c.time)}`;
  $("sunrise").textContent = formatTime(d.sunrise?.[0]);
  $("sunset").textContent = formatTime(d.sunset?.[0]);
  if (d.sunrise?.[0] && d.sunset?.[0]) {
    const mins = (new Date(d.sunset[0]) - new Date(d.sunrise[0])) / 60000;
    $("daylight").textContent = `${Math.floor(mins / 60)} h ${Math.round(mins % 60)} m`;
  }
  renderHourly(h, c.time);
  renderWeekly(d);
}
function renderHourly(hourly, currentTime) {
  const container = $("hourlyList");
  const start = Math.max(0, hourly.time.findIndex(t => t >= currentTime));
  const times = hourly.time.slice(start, start + 6);
  container.innerHTML = times.map((time, offset) => {
    const i = start + offset, [desc, icon] = weatherInfo(hourly.weather_code[i]);
    const label = offset === 0 ? "Now" : formatTime(time);
    const rain = hourly.precipitation_probability?.[i] ?? 0;
    return `<div class="hour-card" title="${desc}"><div class="hour">${label}</div><div class="weather-icon">${icon}</div><strong>${safeNum(hourly.temperature_2m[i])}°</strong><small>💧 ${rain}%</small></div>`;
  }).join("");
}
function renderWeekly(daily) {
  $("weeklyList").innerHTML = daily.time.map((date, i) => {
    const [desc, icon] = weatherInfo(daily.weather_code[i]);
    const label = i === 0 ? "Today" : weekday(date);
    return `<div class="day-row"><span class="day-name">${label}</span><span class="day-icon" title="${desc}">${icon}</span><span class="day-condition">${desc}</span><span class="day-temps"><strong>${safeNum(daily.temperature_2m_max[i])}°</strong> / ${safeNum(daily.temperature_2m_min[i])}°</span><span class="rain">↑ ${safeNum(daily.uv_index_max?.[i])} UV</span></div>`;
  }).join("");
}
$("searchForm").addEventListener("submit", async (event) => {
  event.preventDefault();
  const query = $("cityInput").value.trim();
  if (!query) { setStatus("Please enter a city name.", true); $("cityInput").focus(); return; }
  try { const place = await geocodeCity(query); await loadWeather(place); }
  catch (error) { setStatus(error.message || "Could not find that city.", true); }
});
$("locationBtn").addEventListener("click", () => {
  if (!navigator.geolocation) { setStatus("Your browser does not support location access. Search for a city instead.", true); return; }
  setStatus("Requesting location permission…");
  navigator.geolocation.getCurrentPosition(async (position) => {
    const { latitude, longitude } = position.coords;
    const place = { latitude, longitude, city: "Your location", country: "", timezone: "auto" };
    // Reverse geocoding is optional; coordinates are enough for accurate weather.
    await loadWeather(place);
  }, () => setStatus("Location access was denied or unavailable. Search for a city instead.", true), { enableHighAccuracy: false, timeout: 10000 });
});
$("themeToggle").addEventListener("click", () => {
  document.body.classList.toggle("light");
  $("themeToggle").textContent = document.body.classList.contains("light") ? "☾" : "☼";
});
loadWeather();
