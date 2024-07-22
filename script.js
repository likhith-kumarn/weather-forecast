// Initialize Firebase
const firebaseConfig = {
    apiKey: "AIzaSyC5rlGd6OhHtt-RPXWdYwEC2tmTus3P-bM",
    authDomain: "weather-forecast-e9084.firebaseapp.com",
    projectId: "weather-forecast-e9084",
    storageBucket: "weather-forecast-e9084.appspot.com",
    messagingSenderId: "1027619420467",
    appId: "1:1027619420467:web:b8bb8c24d729328112e646",
    measurementId: "G-1P8QHZ93LH"
  };
  
  // Initialize Firebase
  firebase.initializeApp(firebaseConfig);
  const analytics = firebase.analytics();
  const db = firebase.firestore();
  
  // Your HTML element references
  const cityInput = document.querySelector(".city-input");
  const searchButton = document.querySelector(".search-btn");
  const locationButton = document.querySelector(".location-btn");
  const currentWeatherDiv = document.querySelector(".current-weather");
  const weatherCardsDiv = document.querySelector(".weather-cards");
  const weatherDataDiv = document.querySelector(".weather-data");
  
  const API_KEY = "99162618a27de3250ef17df53b0aefcb"; // API key for OpenWeatherMap API
  
  // Function to create weather cards
  const createWeatherCard = (cityName, weatherItem, index) => {
    if (index === 0) {
      return `<div class="details">
                  <h2>${cityName} (${weatherItem.dt_txt.split(" ")[0]})</h2>
                  <h6>Temperature: ${(weatherItem.main.temp - 273.15).toFixed(2)}°C</h6>
                  <h6>Wind: ${weatherItem.wind.speed} M/S</h6>
                  <h6>Humidity: ${weatherItem.main.humidity}%</h6>
              </div>
              <div class="icon">
                  <img src="https://openweathermap.org/img/wn/${weatherItem.weather[0].icon}@4x.png" alt="weather-icon">
                  <h6>${weatherItem.weather[0].description}</h6>
              </div>`;
    } else {
      return `<li class="card">
                  <h3>(${weatherItem.dt_txt.split(" ")[0]})</h3>
                  <img src="https://openweathermap.org/img/wn/${weatherItem.weather[0].icon}@4x.png" alt="weather-icon">
                  <h6>Temp: ${(weatherItem.main.temp - 273.15).toFixed(2)}°C</h6>
                  <h6>Wind: ${weatherItem.wind.speed} M/S</h6>
                  <h6>Humidity: ${weatherItem.main.humidity}%</h6>
              </li>`;
    }
  };
  
  // Function to get weather details
  const getWeatherDetails = (cityName, latitude, longitude) => {
    const WEATHER_API_URL = `https://api.openweathermap.org/data/2.5/forecast?lat=${latitude}&lon=${longitude}&appid=${API_KEY}`;
  
    fetch(WEATHER_API_URL)
      .then(response => response.json())
      .then(data => {
        // Filter the forecasts to get only one forecast per day
        const uniqueForecastDays = [];
        const fiveDaysForecast = data.list.filter(forecast => {
          const forecastDate = new Date(forecast.dt_txt).getDate();
          if (!uniqueForecastDays.includes(forecastDate)) {
            return uniqueForecastDays.push(forecastDate);
          }
        });
  
        // Clearing previous weather data
        cityInput.value = "";
        currentWeatherDiv.innerHTML = "";
        weatherCardsDiv.innerHTML = "";
  
        // Creating weather cards and adding them to the DOM
        fiveDaysForecast.forEach((weatherItem, index) => {
          const html = createWeatherCard(cityName, weatherItem, index);
          if (index === 0) {
            currentWeatherDiv.insertAdjacentHTML("beforeend", html);
          } else {
            weatherCardsDiv.insertAdjacentHTML("beforeend", html);
          }
        });
  
        // Show the weather data section
        weatherDataDiv.classList.remove("hidden");
  
        // Save weather data to Firestore
        saveWeatherDataToFirestore(cityName, fiveDaysForecast);
      })
      .catch(() => {
        alert("An error occurred while fetching the weather forecast!");
      });
  };
  
  // Function to save weather data to Firestore
  const saveWeatherDataToFirestore = async (cityName, weatherData) => {
    try {
      const docRef = await firebase.firestore().collection("weather").add({
        city: cityName,
        weather: weatherData,
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
      });
      console.log("Document written with ID: ", docRef.id);
    } catch (e) {
      console.error("Error adding document: ", e);
    }
  };
  
  // Function to get city coordinates
  const getCityCoordinates = () => {
    const cityName = cityInput.value.trim();
    if (cityName === "") return;
    const API_URL = `https://api.openweathermap.org/geo/1.0/direct?q=${cityName}&limit=1&appid=${API_KEY}`;
  
    fetch(API_URL)
      .then(response => response.json())
      .then(data => {
        if (!data.length) return alert(`No coordinates found for ${cityName}`);
        const { lat, lon, name } = data[0];
        getWeatherDetails(name, lat, lon);
      })
      .catch(() => {
        alert("An error occurred while fetching the coordinates!");
      });
  };
  
  // Function to get user coordinates
  const getUserCoordinates = () => {
    navigator.geolocation.getCurrentPosition(
      position => {
        const { latitude, longitude } = position.coords; // Get coordinates of user location
        const API_URL = `https://api.openweathermap.org/geo/1.0/reverse?lat=${latitude}&lon=${longitude}&limit=1&appid=${API_KEY}`;
        fetch(API_URL)
          .then(response => response.json())
          .then(data => {
            const { name } = data[0];
            getWeatherDetails(name, latitude, longitude);
          })
          .catch(() => {
            alert("An error occurred while fetching the city name!");
          });
      },
      error => {
        if (error.code === error.PERMISSION_DENIED) {
          alert("Geolocation request denied. Please reset location permission to grant access again.");
        } else {
          alert("Geolocation request error. Please reset location permission.");
        }
      }
    );
  };
  
  // Initially hide the weather data section
  weatherDataDiv.classList.add("hidden");
  
  locationButton.addEventListener("click", getUserCoordinates);
  searchButton.addEventListener("click", getCityCoordinates);
  
