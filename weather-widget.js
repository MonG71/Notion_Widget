// weather-widget.js
console.log('✅ weather-widget.js loaded successfully!');

// ⚠️ IMPORTANT: Replace this with your actual OpenWeatherMap API key
// Get your free API key at: https://openweathermap.org/api
const API_KEY = 'YOUR_OPENWEATHERMAP_API_KEY';

// ========== IP-BASED GEOLOCATION (WORKS IN NOTION IFRAME) ==========
async function getLocationByIP() {
    console.log('🔍 Getting location from IP address...');
    try {
        const response = await fetch('https://ipapi.co/json/');
        if (!response.ok) throw new Error('IP geolocation request failed');
        const data = await response.json();
        console.log('📍 Location detected:', data.city + ', ' + data.country_name);
        console.log('   Coordinates:', data.latitude + ', ' + data.longitude);
        return {
            lat: data.latitude,
            lon: data.longitude,
            city: data.city,
            country: data.country_name
        };
    } catch (error) {
        console.warn('⚠️ IP geolocation failed, using fallback city (New York):', error);
        // Fallback to New York if IP lookup fails
        return { 
            lat: 40.7128, 
            lon: -74.0060, 
            city: 'New York', 
            country: 'US' 
        };
    }
}

// ========== FETCH WEATHER BY COORDINATES ==========
async function fetchWeatherByCoords(lat, lon, city) {
    console.log('🌤️ Fetching weather data for:', city);
    try {
        const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`;
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error('Weather API returned status: ' + response.status);
        }
        
        const data = await response.json();
        console.log('✅ Weather data received for:', data.name);
        updateUI(data, city);
        hideStatus();
    } catch (error) {
        console.error('❌ Error fetching weather:', error);
        showError('Failed to load weather data. Please try searching for a city.');
    }
}

// ========== FETCH WEATHER BY CITY NAME ==========
async function fetchWeatherByCity(city) {
    console.log('🔍 Searching for city:', city);
    try {
        const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${API_KEY}&units=metric`;
        const response = await fetch(url);
        
        if (!response.ok) {
            if (response.status === 404) {
                throw new Error('City not found');
            }
            throw new Error('Weather API returned status: ' + response.status);
        }
        
        const data = await response.json();
        console.log('✅ Weather data for:', data.name + ', ' + data.sys.country);
        updateUI(data, city);
        hideStatus();
    } catch (error) {
        console.error('❌ City search failed:', error);
        showError(`Could not find "${city}". Please try another city.`);
    }
}

// ========== UPDATE USER INTERFACE ==========
function updateUI(data, cityName) {
    const widget = document.getElementById('widget');
    widget.classList.remove('no-data');
    
    // Location name
    const locationName = `${cityName}, ${data.sys.country || ''}`;
    document.getElementById('loc-name').textContent = locationName;
    
    // Temperature
    const temp = Math.round(data.main.temp);
    document.getElementById('temp').textContent = `${temp}°`;
    
    // Weather description (capitalize first letter)
    const description = data.weather[0].description;
    document.getElementById('desc').textContent = description.charAt(0).toUpperCase() + description.slice(1);
    
    // Feels like
    const feelsLike = Math.round(data.main.feels_like);
    document.getElementById('feels-like').textContent = `Feels like ${feelsLike}°`;
    
    // Humidity
    document.getElementById('stat-humidity').textContent = `${data.main.humidity}%`;
    
    // Wind speed (convert from m/s to km/h)
    const windSpeed = Math.round(data.wind.speed * 3.6);
    document.getElementById('stat-wind').textContent = `${windSpeed} km/h`;
    
    // UV Index (OpenWeatherMap free tier doesn't include UV data)
    document.getElementById('stat-uv').textContent = '--';
    
    // Weather icon emoji
    const iconCode = data.weather[0].icon;
    document.getElementById('weather-icon').textContent = getWeatherEmoji(iconCode);
    
    // Update date and time
    updateDateTime();
    
    console.log('✅ UI updated successfully');
}

// ========== WEATHER EMOJI MAPPER ==========
function getWeatherEmoji(iconCode) {
    const map = {
        '01d': '☀️',   // clear sky day
        '01n': '🌙',   // clear sky night
        '02d': '⛅',   // few clouds day
        '02n': '☁️',   // few clouds night
        '03d': '☁️',   // scattered clouds
        '03n': '☁️',
        '04d': '☁️',   // broken clouds
        '04n': '☁️',
        '09d': '🌧️',   // shower rain
        '09n': '🌧️',
        '10d': '🌦️',   // rain day
        '10n': '🌧️',   // rain night
        '11d': '⛈️',   // thunderstorm
        '11n': '⛈️',
        '13d': '❄️',   // snow
        '13n': '❄️',
        '50d': '🌫️',   // mist
        '50n': '🌫️'
    };
    return map[iconCode] || '🌤️';
}

// ========== UPDATE DATE AND TIME ==========
function updateDateTime() {
    const now = new Date();
    const dateOptions = { 
        weekday: 'short', 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
    };
    document.getElementById('loc-date').textContent = now.toLocaleDateString('en-US', dateOptions);
    
    const timeOptions = { 
        hour: '2-digit', 
        minute: '2-digit' 
    };
    document.getElementById('loc-time').textContent = now.toLocaleTimeString('en-US', timeOptions);
}

// ========== STATUS BANNER CONTROLS ==========
function showError(message) {
    const banner = document.getElementById('status-banner');
    banner.textContent = message;
    banner.className = 'visible error';
}

function hideStatus() {
    const banner = document.getElementById('status-banner');
    banner.textContent = '';
    banner.className = '';
}

// ========== INITIALIZE WIDGET ==========
async function initWidget() {
    console.log('🚀 Initializing weather widget...');
    document.getElementById('loc-name').textContent = 'Locating…';
    
    // Check if API key is configured
    if (API_KEY === 'YOUR_OPENWEATHERMAP_API_KEY') {
        console.error('❌ Please replace YOUR_OPENWEATHERMAP_API_KEY with your actual API key!');
        showError('⚠️ API key not configured. Please set your OpenWeatherMap API key.');
        document.getElementById('loc-name').textContent = 'API Key Required';
        return;
    }
    
    // Get location from IP and fetch weather
    const location = await getLocationByIP();
    await fetchWeatherByCoords(location.lat, location.lon, location.city);
}

// ========== EVENT LISTENERS ==========
document.addEventListener('DOMContentLoaded', () => {
    console.log('📄 DOM is ready');
    
    // Update time every minute
    setInterval(updateDateTime, 60000);
    
    // Initialize the widget
    initWidget();
    
    // City search on Enter key
    const searchInput = document.getElementById('city-search');
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            const city = e.target.value.trim();
            if (city) {
                console.log('🔍 User searched for:', city);
                fetchWeatherByCity(city);
                document.getElementById('loc-name').textContent = 'Searching…';
            }
        }
    });
    
    // Also search when user clicks away (blur) if they typed something
    searchInput.addEventListener('blur', () => {
        const city = searchInput.value.trim();
        if (city && city.length > 2) {
            console.log('🔍 User typed:', city);
            fetchWeatherByCity(city);
        }
    });
});

// ========== NETWORK RECOVERY ==========
window.addEventListener('online', () => {
    console.log('🌐 Network connection restored');
    const currentLocation = document.getElementById('loc-name').textContent;
    if (currentLocation && currentLocation !== 'Locating…' && currentLocation !== 'Searching…' && currentLocation !== 'API Key Required') {
        // Re-fetch weather when connection is restored
        initWidget();
    }
});

console.log('✅ weather-widget.js setup complete! Waiting for DOM...');
