
const WEATHER_CACHE_KEY = 'nyx-weather-cache';
const WEATHER_CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

export interface WeatherData {
  location: string;
  temperature: number;
  description: string;
  humidity: number;
  timestamp: number;
}

interface WeatherCache {
  data: WeatherData;
  timestamp: number;
}

export class WeatherService {
  private apiKey: string | null = null;
  private defaultLocation = 'Welsh,LA,US';

  constructor() {
    this.apiKey = localStorage.getItem('openweather-api-key');
  }

  setApiKey(key: string) {
    this.apiKey = key;
    localStorage.setItem('openweather-api-key', key);
  }

  setDefaultLocation(location: string) {
    this.defaultLocation = location;
    localStorage.setItem('weather-location', location);
  }

  getDefaultLocation(): string {
    return localStorage.getItem('weather-location') || this.defaultLocation;
  }

  private getCachedWeather(): WeatherData | null {
    try {
      const cached = localStorage.getItem(WEATHER_CACHE_KEY);
      if (!cached) return null;

      const { data, timestamp }: WeatherCache = JSON.parse(cached);
      const now = Date.now();
      
      if (now - timestamp < WEATHER_CACHE_DURATION) {
        return data;
      }
    } catch (error) {
      console.error('Error reading weather cache:', error);
    }
    return null;
  }

  private setCachedWeather(data: WeatherData) {
    try {
      const cache: WeatherCache = {
        data,
        timestamp: Date.now()
      };
      localStorage.setItem(WEATHER_CACHE_KEY, JSON.stringify(cache));
    } catch (error) {
      console.error('Error caching weather:', error);
    }
  }

  async fetchWeather(location?: string): Promise<WeatherData | null> {
    if (!this.apiKey) {
      console.warn('OpenWeatherMap API key not set');
      return null;
    }

    // Check cache first
    const cached = this.getCachedWeather();
    if (cached) {
      return cached;
    }

    const targetLocation = location || this.getDefaultLocation();

    try {
      const response = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(targetLocation)}&appid=${this.apiKey}&units=imperial`
      );

      if (!response.ok) {
        throw new Error(`Weather API error: ${response.status}`);
      }

      const data = await response.json();
      
      const weatherData: WeatherData = {
        location: `${data.name}, ${data.sys.country}`,
        temperature: Math.round(data.main.temp),
        description: data.weather[0].description,
        humidity: data.main.humidity,
        timestamp: Date.now()
      };

      this.setCachedWeather(weatherData);
      return weatherData;
    } catch (error) {
      console.error('Failed to fetch weather:', error);
      return null;
    }
  }

  formatWeatherContext(weather: WeatherData): string {
    return `Weather in ${weather.location}: ${weather.description}, ${weather.temperature}°F, ${weather.humidity}% humidity`;
  }
}

export const weatherService = new WeatherService();
