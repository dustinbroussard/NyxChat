
import { weatherService, WeatherData } from './weatherService';
import { newsService, NewsItem } from './newsService';

export interface ContextSettings {
  weatherEnabled: boolean;
  newsEnabled: boolean;
  weatherLocation: string;
  rssFeeds: string[];
}

export interface ContextData {
  weather: WeatherData | null;
  news: NewsItem[];
}

export class ContextService {
  private settings: ContextSettings = {
    weatherEnabled: false,
    newsEnabled: false,
    weatherLocation: 'Welsh,LA,US',
    rssFeeds: []
  };

  constructor() {
    this.loadSettings();
  }

  private loadSettings() {
    const saved = localStorage.getItem('context-settings');
    if (saved) {
      try {
        this.settings = { ...this.settings, ...JSON.parse(saved) };
      } catch (error) {
        console.error('Error loading context settings:', error);
      }
    }
  }

  private saveSettings() {
    localStorage.setItem('context-settings', JSON.stringify(this.settings));
  }

  getSettings(): ContextSettings {
    return { ...this.settings };
  }

  updateSettings(updates: Partial<ContextSettings>) {
    this.settings = { ...this.settings, ...updates };
    this.saveSettings();
    
    // Update services
    if (updates.weatherLocation) {
      weatherService.setDefaultLocation(updates.weatherLocation);
    }
    if (updates.rssFeeds) {
      newsService.setRssFeeds(updates.rssFeeds);
    }
  }

  async fetchContextData(): Promise<ContextData> {
    const contextData: ContextData = {
      weather: null,
      news: []
    };

    if (this.settings.weatherEnabled) {
      contextData.weather = await weatherService.fetchWeather();
    }

    if (this.settings.newsEnabled) {
      contextData.news = await newsService.fetchNews();
    }

    return contextData;
  }

  formatContextForPrompt(contextData: ContextData): string {
    const contextParts: string[] = [];

    if (contextData.weather) {
      contextParts.push(weatherService.formatWeatherContext(contextData.weather));
    }

    if (contextData.news.length > 0) {
      contextParts.push(newsService.formatNewsContext(contextData.news));
    }

    if (contextParts.length === 0) return '';

    return `[Context]\n${contextParts.join('\n')}\n[/Context]\n\n`;
  }
}

export const contextService = new ContextService();
