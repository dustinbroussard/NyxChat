
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { contextService } from '@/services/contextService';
import type { ContextSettings as ContextSettingsType } from '@/services/contextService';
import { weatherService } from '@/services/weatherService';
import { Cloud, Newspaper, Key } from 'lucide-react';
import { toast } from 'sonner';

export const ContextSettings = () => {
  const [settings, setSettings] = useState<ContextSettingsType>(contextService.getSettings());
  const [weatherApiKey, setWeatherApiKey] = useState('');
  const [rssFeeds, setRssFeeds] = useState('');

  useEffect(() => {
    const currentSettings = contextService.getSettings();
    setSettings(currentSettings);
    setRssFeeds(currentSettings.rssFeeds.join('\n'));
    
    const savedWeatherKey = localStorage.getItem('openweather-api-key');
    if (savedWeatherKey) {
      setWeatherApiKey(savedWeatherKey);
    }
  }, []);

  const handleSettingChange = (key: keyof ContextSettingsType, value: any) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    contextService.updateSettings({ [key]: value });
  };

  const handleWeatherApiKeyChange = (key: string) => {
    setWeatherApiKey(key);
    weatherService.setApiKey(key);
    if (key) {
      toast.success('Weather API key saved');
    }
  };

  const handleRssFeedsChange = (feeds: string) => {
    setRssFeeds(feeds);
    const feedArray = feeds.split('\n').filter(url => url.trim().length > 0);
    handleSettingChange('rssFeeds', feedArray);
  };

  const testWeather = async () => {
    if (!weatherApiKey) {
      toast.error('Please enter your OpenWeatherMap API key first');
      return;
    }
    
    try {
      const weather = await weatherService.fetchWeather();
      if (weather) {
        toast.success(`Weather test successful: ${weather.temperature}°F in ${weather.location}`);
      } else {
        toast.error('Failed to fetch weather data');
      }
    } catch (error) {
      toast.error('Weather API test failed');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Context Awareness</h3>
        <p className="text-sm text-muted-foreground mb-6">
          Enable contextual information to be automatically included in your AI conversations.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Cloud className="w-5 h-5" />
            Weather Integration
          </CardTitle>
          <CardDescription>
            Get current weather information for your location
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="weather-enabled">Enable Weather Context</Label>
            <Switch
              id="weather-enabled"
              checked={settings.weatherEnabled}
              onCheckedChange={(checked) => handleSettingChange('weatherEnabled', checked)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="weather-api-key">OpenWeatherMap API Key</Label>
            <div className="flex gap-2">
              <Input
                id="weather-api-key"
                type="password"
                placeholder="Enter your API key"
                value={weatherApiKey}
                onChange={(e) => handleWeatherApiKeyChange(e.target.value)}
              />
              <Button variant="outline" onClick={testWeather}>
                Test
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Get a free API key at{' '}
              <a href="https://openweathermap.org/api" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                OpenWeatherMap
              </a>
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="weather-location">Default Location</Label>
            <Input
              id="weather-location"
              placeholder="e.g., Welsh,LA,US"
              value={settings.weatherLocation}
              onChange={(e) => handleSettingChange('weatherLocation', e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Newspaper className="w-5 h-5" />
            News Integration
          </CardTitle>
          <CardDescription>
            Include recent headlines from RSS feeds
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="news-enabled">Enable News Context</Label>
            <Switch
              id="news-enabled"
              checked={settings.newsEnabled}
              onCheckedChange={(checked) => handleSettingChange('newsEnabled', checked)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="rss-feeds">RSS Feed URLs (one per line)</Label>
            <Textarea
              id="rss-feeds"
              placeholder="https://www.nola.com/arcio/rss/&#10;https://feeds.npr.org/1001/rss.xml"
              value={rssFeeds}
              onChange={(e) => handleRssFeedsChange(e.target.value)}
              rows={4}
            />
            <p className="text-xs text-muted-foreground">
              Default feeds include NOLA.com, NPR, and CNN. Latest 5 headlines will be included.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
