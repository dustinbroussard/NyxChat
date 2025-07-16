
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { contextService, ContextData } from '@/services/contextService';
import { Eye, RefreshCw } from 'lucide-react';

export const ContextPreview = () => {
  const [contextData, setContextData] = useState<ContextData | null>(null);
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState(contextService.getSettings());

  const fetchContext = async () => {
    setLoading(true);
    try {
      const data = await contextService.fetchContextData();
      setContextData(data);
    } catch (error) {
      console.error('Failed to fetch context:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const currentSettings = contextService.getSettings();
    setSettings(currentSettings);
    
    if (currentSettings.weatherEnabled || currentSettings.newsEnabled) {
      fetchContext();
    }
  }, []);

  const formatPreview = () => {
    if (!contextData) return '';
    return contextService.formatContextForPrompt(contextData);
  };

  if (!settings.weatherEnabled && !settings.newsEnabled) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="w-5 h-5" />
            Context Preview
          </CardTitle>
          <CardDescription>
            No context sources enabled
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Eye className="w-5 h-5" />
          Context Preview
        </CardTitle>
        <CardDescription>
          This context will be automatically added to your AI conversations
        </CardDescription>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchContext}
          disabled={loading}
          className="ml-auto"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        ) : (
          <div className="space-y-4">
            {contextData?.weather && (
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-sm">
                  <strong>Weather:</strong> {contextData.weather.description}, {contextData.weather.temperature}°F in {contextData.weather.location}
                </p>
              </div>
            )}
            
            {contextData?.news && contextData.news.length > 0 && (
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-sm mb-2"><strong>Recent Headlines:</strong></p>
                <ul className="text-sm space-y-1">
                  {contextData.news.map((item, index) => (
                    <li key={index} className="text-muted-foreground">
                      • {item.title}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            {formatPreview() && (
              <div className="mt-4">
                <p className="text-sm font-medium mb-2">Raw Context (sent to AI):</p>
                <pre className="text-xs bg-muted p-3 rounded-lg overflow-x-auto whitespace-pre-wrap">
                  {formatPreview()}
                </pre>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
