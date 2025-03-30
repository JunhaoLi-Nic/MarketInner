import logging
import pandas as pd
import requests
from time import sleep

# Configure logging
logger = logging.getLogger(__name__)

def get_market_prices():
    """
    Fetches market prices for various financial instruments and returns them in a structured format.
    
    Returns:
        dict: A dictionary containing market price data or an error message
    """
    # Define the tickers we want to fetch
    tickers = {
        'Bonds': '^TYX',  # 30-Year Treasury Yield
        'US Treasury Yields': '^TNX',  # 10-Year Treasury Yield
        'US 10-Year Yield': '^TNX',  # 10-Year Treasury Yield
        'Federal Funds Rate': '^IRX',  # 13-Week Treasury Bill
        'USD Index': 'DX-Y.NYB',  # US Dollar Index
        'Gold': 'GC=F',  # Gold Futures
        'Crude Oil': 'CL=F',  # Crude Oil Futures
        'Commodities': 'GSG',  # iShares S&P GSCI Commodity-Indexed Trust
        'Copper Prices': 'HG=F',  # Copper Futures
        'VIX (Volatility Index)': '^VIX',  # CBOE Volatility Index
        'S&P 500': 'SPY',  # S&P 500 Index
        'Growth Stocks': 'IWF',  # iShares Russell 1000 Growth ETF
        'Value Stocks': 'IWD',  # iShares Russell 1000 Value ETF
        'US Multinational Companies': 'XLK',  # Technology Select Sector SPDR Fund
        'AUD/USD': 'AUDUSD=X',  # Australian Dollar to US Dollar
        'NZD/AUD': 'NZDAUD=X',  # New Zealand Dollar to Australian Dollar
        'CAD': 'CADUSD=X',  # Canadian Dollar to US Dollar
        'NOK (Norwegian Krone)': 'NOKUSD=X',  # Norwegian Krone to US Dollar
        'CHF (Swiss Franc)': 'CHFUSD=X',  # Swiss Franc to US Dollar
        'Emerging Market Currencies': 'CEW',  # WisdomTree Emerging Currency Strategy Fund
        'TIPS (Treasury Inflation-Protected Securities)': 'TIP',  # iShares TIPS Bond ETF
        'Real Estate': 'IYR',  # iShares U.S. Real Estate ETF
        'Stocks': '^GSPC',  # S&P 500 as a proxy for stocks
        'USD/JPY': 'JPY=X',  # US Dollar to Japanese Yen
        'Inflation': 'RINF',  # ProShares Inflation Expectations ETF
        'Currency Pair': 'EURUSD=X',  # EUR/USD as a generic currency pair
        'Currency Strength': 'DX-Y.NYB',  # USD Index as a proxy for currency strength
        'Risk Sentiment': 'VIX'  # VIX as a proxy for risk sentiment
    }
    
    # Set up headers for requests
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:89.0) Gecko/20100101 Firefox/89.0",
        "Accept": "application/json"
    }
    
    # Fetch the data
    prices = {}
    try:
        for name, ticker in tickers.items():
            try:
                sleep(1)  # Add delay to avoid rate limiting
                logger.info(f"Fetching data for {name} ({ticker})")
                
                # Build URL with parameters
                url = f"https://query1.finance.yahoo.com/v8/finance/chart/{ticker}"
                params = {
                    "interval": "1d",
                    "includePrePost": True,
                    "events": "div,splits,capitalGains"
                }
                
                # Send request
                response = requests.get(url, headers=headers, params=params)
                
                if response.status_code != 200:
                    logger.error(f"Failed to fetch {name} ({ticker}), status code: {response.status_code}")
                    prices[name] = {'price': 0, 'change': 0, 'change_percent': 0}
                    continue
                
                data = response.json()
                
                try:
                    chart_data = data['chart']['result'][0]
                    timestamps = chart_data['timestamp']
                    quote = chart_data['indicators']['quote'][0]
                    
                    # Create DataFrame
                    df = pd.DataFrame({
                        'Open': quote.get('open', []),
                        'High': quote.get('high', []),
                        'Low': quote.get('low', []),
                        'Close': quote.get('close', []),
                        'Volume': quote.get('volume', [])
                    }, index=pd.to_datetime(timestamps, unit='s'))
                    
                    if not df.empty:
                        # Calculate price changes
                        latest_close = df['Close'].iloc[-1]
                        latest_open = df['Open'].iloc[-1]
                        price_change = latest_close - latest_open
                        change_percent = (price_change / latest_open) * 100
                        
                        prices[name] = {
                            'price': float(round(latest_close, 2)),
                            'change': float(round(price_change, 2)),
                            'change_percent': float(round(change_percent, 2))
                        }
                    else:
                        prices[name] = {'price': 0, 'change': 0, 'change_percent': 0}
                        logger.warning(f"Empty data for {name} ({ticker})")
                        
                except (KeyError, IndexError) as e:
                    logger.error(f"Error parsing data for {name} ({ticker}): {str(e)}")
                    prices[name] = {'price': 0, 'change': 0, 'change_percent': 0}
                    
            except Exception as e:
                logger.error(f"Error fetching {name} ({ticker}): {str(e)}")
                prices[name] = {'price': 0, 'change': 0, 'change_percent': 0}
        
        return {'success': True, 'data': prices}
    except Exception as e:
        logger.error(f"General error: {str(e)}")
        return {'success': False, 'error': str(e)} 