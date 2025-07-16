
const NEWS_CACHE_KEY = 'nyx-news-cache';
const NEWS_CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

export interface NewsItem {
  title: string;
  link: string;
  pubDate: string;
  source: string;
}

interface NewsCache {
  data: NewsItem[];
  timestamp: number;
}

export class NewsService {
  private defaultFeeds = [
    'https://www.nola.com/arcio/rss/',
    'https://feeds.npr.org/1001/rss.xml',
    'https://rss.cnn.com/rss/edition.rss'
  ];

  private getRssFeeds(): string[] {
    const saved = localStorage.getItem('rss-feeds');
    return saved ? JSON.parse(saved) : this.defaultFeeds;
  }

  setRssFeeds(feeds: string[]) {
    localStorage.setItem('rss-feeds', JSON.stringify(feeds));
  }

  private getCachedNews(): NewsItem[] | null {
    try {
      const cached = localStorage.getItem(NEWS_CACHE_KEY);
      if (!cached) return null;

      const { data, timestamp }: NewsCache = JSON.parse(cached);
      const now = Date.now();
      
      if (now - timestamp < NEWS_CACHE_DURATION) {
        return data;
      }
    } catch (error) {
      console.error('Error reading news cache:', error);
    }
    return null;
  }

  private setCachedNews(data: NewsItem[]) {
    try {
      const cache: NewsCache = {
        data,
        timestamp: Date.now()
      };
      localStorage.setItem(NEWS_CACHE_KEY, JSON.stringify(cache));
    } catch (error) {
      console.error('Error caching news:', error);
    }
  }

  async fetchNews(): Promise<NewsItem[]> {
    // Check cache first
    const cached = this.getCachedNews();
    if (cached) {
      return cached;
    }

    const feeds = this.getRssFeeds();
    const allNews: NewsItem[] = [];

    for (const feedUrl of feeds) {
      try {
        // Use RSS2JSON service for CORS-free RSS parsing
        const proxyUrl = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(feedUrl)}`;
        const response = await fetch(proxyUrl);
        
        if (!response.ok) continue;
        
        const data = await response.json();
        
        if (data.status === 'ok' && data.items) {
          const feedNews = data.items.slice(0, 3).map((item: any) => ({
            title: item.title,
            link: item.link,
            pubDate: item.pubDate,
            source: data.feed?.title || 'Unknown'
          }));
          
          allNews.push(...feedNews);
        }
      } catch (error) {
        console.error(`Failed to fetch RSS feed ${feedUrl}:`, error);
      }
    }

    // Sort by date and take top 5
    const sortedNews = allNews
      .sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime())
      .slice(0, 5);

    this.setCachedNews(sortedNews);
    return sortedNews;
  }

  formatNewsContext(news: NewsItem[]): string {
    if (news.length === 0) return '';
    
    const headlines = news.map(item => `"${item.title}"`).join(', ');
    return `Recent headlines: ${headlines}`;
  }
}

export const newsService = new NewsService();
