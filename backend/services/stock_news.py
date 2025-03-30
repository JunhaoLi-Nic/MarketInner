import logging
from datetime import datetime, timedelta
from jb_news.news import CJBNews
from typing import List, Dict, Any
import os
from dotenv import load_dotenv
import time

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.DEBUG)  # Set to DEBUG level
logger = logging.getLogger(__name__)

# Cache to store news and reduce API calls
news_cache = {
    'data': [],
    'last_updated': None,
    'last_api_call': None
}

def get_yahoo_finance_news(max_retries: int = 3, cache_ttl_seconds: int = 3600) -> List[Dict[str, Any]]:
    """
    Fetch stock news using JB-News API
    
    Args:
        max_retries: Maximum number of retries if request fails
        cache_ttl_seconds: Time to live for cache in seconds (default: 1 hour)
        
    Returns:
        List of news items with title, link, source, and published date
    """
    # Check if we have cached data that's still valid
    if news_cache['data'] and news_cache['last_updated']:
        cache_age = (datetime.now() - news_cache['last_updated']).total_seconds()
        if cache_age < cache_ttl_seconds:
            logger.info(f"Returning cached news data ({len(news_cache['data'])} items)")
            return news_cache['data']
    
    # Check rate limit (5 minutes for free tier)
    if news_cache['last_api_call']:
        time_since_last_call = (datetime.now() - news_cache['last_api_call']).total_seconds()
        if time_since_last_call < 300:  # 300 seconds = 5 minutes
            wait_time = 300 - time_since_last_call
            logger.warning(f"Rate limit: Waiting {wait_time:.0f} seconds before making next API call")
            time.sleep(wait_time)
    
    try:
        # Get API key from environment
        api_key = os.getenv('NEWS_API_KEY')
        if not api_key:
            logger.error("NEWS_API_KEY not found in environment variables")
            return []
            
        logger.debug(f"Using API key: {api_key[:10]}...")
        
        # Initialize JB-News client
        jb = CJBNews()
        jb.offset = 7  # EST timezone offset
        
        # Update last API call time
        news_cache['last_api_call'] = datetime.now()
        
        # Get calendar data for today and tomorrow
        logger.debug("Fetching calendar data...")
        if not jb.calendar(api_key, today=True):
            logger.error("Failed to connect to JB-News API")
            return []
            
        logger.debug(f"Received {len(jb.calendar_info)} calendar events")
        
        # Try to get events for tomorrow as well
        tomorrow = datetime.now() + timedelta(days=1)
        if jb.calendar(api_key, date=tomorrow.strftime('%Y-%m-%d')):
            logger.debug(f"Received {len(jb.calendar_info)} events for tomorrow")
        
        all_news = []
        
        # Process the calendar events
        for event in jb.calendar_info:
            try:
                logger.debug(f"Processing event: {event.name} ({event.eventID})")
                logger.debug(f"Event details: Date={event.date}, Category={event.category}")
                
                news_item = {
                    'title': event.name,
                    'link': f"https://www.jblanked.com/news/event/{event.eventID}",
                    'source': 'JB-News',
                    'publishedDate': event.date,
                    'category': event.category,
                    'summary': f"Forecast: {event.forecast}, Previous: {event.previous}, Actual: {event.actual}"
                }
                
                logger.debug(f"Created news item: {news_item}")
                
                # Check for duplicates
                if not any(existing['title'] == news_item['title'] for existing in all_news):
                    all_news.append(news_item)
                    logger.debug("Added news item to list")
                    
            except Exception as e:
                logger.error(f"Error processing news item: {e}")
                continue
        
        # Update cache if we got data
        if all_news:
            news_cache['data'] = all_news
            news_cache['last_updated'] = datetime.now()
            logger.info(f"Updated news cache with {len(all_news)} items")
        else:
            logger.warning("No news items found")
            
        return all_news
        
    except Exception as e:
        logger.error(f"Error fetching news: {e}")
        return []

# For testing
if __name__ == "__main__":
    news = get_yahoo_finance_news()
    for item in news:
        print(f"{item['title']} - {item['source']} ({item['publishedDate']})")
        print(f"Link: {item['link']}")
        print(f"Category: {item.get('category', 'N/A')}")
        if item.get('summary'):
            print(f"Summary: {item['summary']}")
        print("-" * 80) 