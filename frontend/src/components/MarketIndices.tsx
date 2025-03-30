import React, { useEffect } from 'react';
import { Row, Col, Card, Typography, Divider } from 'antd';

const { Title, Text } = Typography;

declare global {
  interface Window {
    TradingView: any;
  }
}

interface ChartConfig {
  symbol: string;
  name: string;
  containerId: string;
  description?: string;
}

const MarketIndices: React.FC = () => {
  const breadthCharts: ChartConfig[] = [
    {
      symbol: 'INDEX:S5TH',
      name: 'S&P 500 Stocks Above 200-Day MA',
      containerId: 'breadth-chart-200d',
      description: 'Percentage of S&P 500 stocks trading above their 20-day moving average'
    },
    {
      symbol: 'INDEX:S5FI',
      name: 'S&P 500 Stocks Above 50-Day MA',
      containerId: 'breadth-chart-50d',
      description: 'Percentage of S&P 500 stocks trading above their 50-day moving average'
    },
    {
      symbol: 'INDEX:S5TW',
      name: 'S&P 500 Stocks Above 20-Day MA',
      containerId: 'breadth-chart-20d',
      description: 'Percentage of S&P 500 stocks trading above their 200-day moving average'
    }
  ];

  const indices: ChartConfig[] = [
    {
      symbol: 'CME_MINI:ES1!',
      name: 'S&P 500 E-mini Futures',
      containerId: 'sp500-chart'
    },
    {
      symbol: 'CME_MINI:NQ1!',
      name: 'NASDAQ E-mini Futures',
      containerId: 'nasdaq-chart'
    },
    {
      symbol: 'CBOT_MINI:YM1!',
      name: 'Dow Jones E-mini Futures',
      containerId: 'dowjones-chart'
    },
    {
      symbol: 'CME_MINI:RTY1!',
      name: 'Russell 2000 E-mini Futures',
      containerId: 'russell-chart'
    }
  ];

  const additionalCharts: ChartConfig[] = [
    {
      symbol: 'CAPITALCOM:DXY',
      name: 'US Dollar Index (DXY)',
      containerId: 'dxy-chart',
      description: 'Measures the value of the US dollar relative to a basket of foreign currencies'
    },
    {
      symbol: 'NASDAQ:VGSH',
      name: 'Vanguard Short-Term Treasury ETF (VGSH)',
      containerId: 'vgsh-chart',
      description: 'Tracks the performance of short-term U.S. Treasury bonds'
    },
    {
      symbol: 'NASDAQ:IEF',
      name: 'iShares 7-10 Year Treasury Bond ETF (IEF)',
      containerId: 'ief-chart',
      description: 'Tracks the investment results of an index composed of U.S. Treasury bonds with remaining maturities between 7-10 years'
    },
    {
      symbol: 'NASDAQ:VGLT',
      name: 'Vanguard Long-Term Treasury ETF (VGLT)',
      containerId: 'vglt-chart',
      description: 'Tracks the performance of long-term U.S. Treasury bonds'
    }
  ];

  const createTradingViewWidget = (chartConfig: ChartConfig) => {
    return new window.TradingView.widget({
      autosize: true,
      symbol: chartConfig.symbol,
      interval: 'D',
      timezone: 'Etc/UTC',
      theme: 'light',
      style: '1',
      locale: 'en',
      toolbar_bg: '#f1f3f6',
      enable_publishing: false,
      allow_symbol_change: false,
      container_id: chartConfig.containerId,
      hide_top_toolbar: false,
      hide_side_toolbar: false,
      withdateranges: true,
      save_image: false,
      height: 300,
      
      // Advanced chart configuration
      drawings_access: { type: 'black', tools: [{ name: 'Regression Trend' }] },
      enabled_features: ['use_localstorage_for_settings'],
      disabled_features: [
        'header_symbol_search',
        'header_compare',
        'header_screenshot',
        'header_undo_redo',
        'header_saveload'
      ],
      
      // Load chart with indicators
      loading_screen: { backgroundColor: "#f4f4f4", foregroundColor: "#2962FF" },
      
      // Chart settings
      charts_storage_url: 'https://saveload.tradingview.com',
      charts_storage_api_version: '1.1',
      client_id: 'tradingview.com',
      user_id: 'public_user',
      
      // Add indicators directly
      studies: [
        { id: 'MASimple@tv-basicstudies', inputs: { length: 50 }, displayName: '50 MA' },
        { id: 'MASimple@tv-basicstudies', inputs: { length: 200 }, displayName: '200 MA' }
      ],
      
      // Override study settings
      studies_overrides: {
        'volume.volume.color.0': '#ef5350',
        'volume.volume.color.1': '#26a69a',
        'volume.volume.transparency': 50,
        'volume.volume ma.color': '#FF9800',
        'volume.volume ma.transparency': 30,
        'volume.volume ma.linewidth': 2,
        
        // MA settings - Updated colors
        'MA Cross.ma1.color': '#00BCD4',  // Cyan for 20 MA
        'MA Cross.ma1.linewidth': 2,
        'MA Cross.ma2.color': '#FF5722',  // Deep Orange for 50 MA
        'MA Cross.ma2.linewidth': 2,
        
        // Individual MA colors
        'moving_average.ma.color.0': '#FF5722',  // Orange for 50 MA
        'moving_average.ma.color.1': '#673AB7',  // Purple for 200 MA
        'moving_average.ma.linewidth.0': 2,
        'moving_average.ma.linewidth.1': 2
      }
    });
  };

  useEffect(() => {
    const loadTradingViewWidget = () => {
      // Create breadth charts
      breadthCharts.forEach(chart => {
        createTradingViewWidget(chart);
      });
      
      // Create main index charts
      indices.forEach(index => {
        createTradingViewWidget(index);
      });
      
      // Create additional charts
      additionalCharts.forEach(chart => {
        createTradingViewWidget(chart);
      });
    };

    // Load TradingView script
    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/tv.js';
    script.async = true;
    script.onload = loadTradingViewWidget;
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  return (
    <div className="market-indices-container" style={{ width: '100%' }}>
      <Title level={2}>S&P 500 Breadth Indicators</Title>
      <Text type="secondary" style={{ display: 'block', marginBottom: '16px' }}>
        Percentage of S&P 500 stocks trading above their key moving averages
      </Text>
      <Row gutter={[24, 16]} style={{ width: '100%' }}>
        {breadthCharts.map(chart => (
          <Col xs={24} key={chart.symbol} style={{ marginBottom: '12px' }}>
            <Card 
              title={<span style={{ fontSize: '18px', fontWeight: 'bold' }}>{chart.name}</span>} 
              style={{ width: '100%' }}
              bodyStyle={{ padding: '0' }}
            >
              <div id={chart.containerId} style={{ height: '300px', width: '100%' }}></div>
            </Card>
          </Col>
        ))}
      </Row>
      
      <Divider style={{ margin: '40px 0 20px' }} />
      
      <Title level={2}>Market Indices</Title>
      <Row gutter={[24, 24]} style={{ width: '100%' }}>
        {indices.map(index => (
          <Col xs={24} lg={12} key={index.symbol} style={{ marginBottom: '16px' }}>
            <Card 
              title={<span style={{ fontSize: '18px', fontWeight: 'bold' }}>{index.name}</span>} 
              style={{ width: '100%', height: '100%' }}
              bodyStyle={{ padding: '0' }}
            >
              <div id={index.containerId} style={{ height: '550px', width: '100%' }}></div>
            </Card>
          </Col>
        ))}
      </Row>
      
      <Divider style={{ margin: '40px 0 20px' }} />
      
      <Title level={2}>Currency & Treasury Bonds</Title>
      <Row gutter={[24, 24]} style={{ width: '100%' }}>
        {additionalCharts.map(chart => (
          <Col xs={24} lg={12} key={chart.symbol} style={{ marginBottom: '16px' }}>
            <Card 
              title={
                <div>
                  <div style={{ fontSize: '18px', fontWeight: 'bold' }}>{chart.name}</div>
                  <div style={{ fontSize: '14px', color: '#888', marginTop: '4px' }}>{chart.description}</div>
                </div>
              }
              style={{ width: '100%', height: '100%' }}
              bodyStyle={{ padding: '0' }}
            >
              <div id={chart.containerId} style={{ height: '550px', width: '100%' }}></div>
            </Card>
          </Col>
        ))}
      </Row>
    </div>
  );
};

export default MarketIndices; 