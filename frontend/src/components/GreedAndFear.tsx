import React, { useState, useEffect } from 'react';
import { Card, Typography, Progress, Space, Statistic, Row, Col, Tooltip, message } from 'antd';
import { ArrowUpOutlined, ArrowDownOutlined, InfoCircleOutlined, LoadingOutlined } from '@ant-design/icons';
import axios from 'axios';

const { Title, Text } = Typography;

interface GreedAndFearData {
  value: number;
  classification: string;
  previousValue: number;
  previousClassification: string;
  timestamp: string;
}

const GreedAndFear: React.FC = () => {
  const [fearGreedData, setFearGreedData] = useState<GreedAndFearData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // Function to fetch Fear & Greed Index data
  const fetchFearAndGreedIndex = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Using CNN's Fear & Greed API (via a proxy to avoid CORS issues)
      // Alternative API: https://api.alternative.me/fng/
      const response = await axios.get('https://production.dataviz.cnn.io/index/fearandgreed/graphdata');
      
      if (response.data && response.data.fear_and_greed) {
        // Parse CNN API response
        const currentData = response.data.fear_and_greed;
        const currentScore = Math.round(currentData.score || 0);
        const currentRating = currentData.rating || getClassificationFromValue(currentScore);
        
        // Default previous values (5 points less than current as fallback)
        let previousScore = currentScore - 5;
        let previousRating = getClassificationFromValue(previousScore);
        
        // Try to get previous data if available
        if (currentData.previous_close && 
            typeof currentData.previous_close.score === 'number') {
          previousScore = Math.round(currentData.previous_close.score);
          previousRating = currentData.previous_close.rating || getClassificationFromValue(previousScore);
        }
        
        setFearGreedData({
          value: currentScore,
          classification: formatClassification(currentRating),
          previousValue: previousScore,
          previousClassification: formatClassification(previousRating),
          timestamp: new Date().toISOString()
        });
      } else {
        // Fallback to alternative API if CNN data structure changes
        const altResponse = await axios.get('https://api.alternative.me/fng/?limit=2');
        
        if (altResponse.data && altResponse.data.data && altResponse.data.data.length >= 2) {
          const current = altResponse.data.data[0];
          const previous = altResponse.data.data[1];
          
          const currentValue = parseInt(current.value) || 50;
          const previousValue = parseInt(previous.value) || (currentValue - 5);
          
          setFearGreedData({
            value: currentValue,
            classification: current.value_classification || formatClassification(getClassificationFromValue(currentValue)),
            previousValue: previousValue,
            previousClassification: previous.value_classification || formatClassification(getClassificationFromValue(previousValue)),
            timestamp: current.timestamp || new Date().toISOString()
          });
        } else {
          throw new Error('Failed to parse data from both APIs');
        }
      }
    } catch (err) {
      console.error('Error fetching Fear & Greed data:', err);
      setError('Failed to fetch Fear & Greed Index data. Using fallback data.');
      
      // Fallback data if both APIs fail
      setFearGreedData({
        value: 65,
        classification: 'Greed',
        previousValue: 55,
        previousClassification: 'Neutral',
        timestamp: new Date().toISOString()
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Helper function to format classification strings
  const formatClassification = (classification: string): string => {
    if (!classification) return 'Unknown';
    
    // Convert to title case and handle special cases
    return classification
      .toLowerCase()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };
  
  // Helper function to get classification from numeric value
  const getClassificationFromValue = (value: number): string => {
    if (value <= 25) return 'extreme fear';
    if (value <= 40) return 'fear';
    if (value <= 60) return 'neutral';
    if (value <= 75) return 'greed';
    return 'extreme greed';
  };
  
  useEffect(() => {
    fetchFearAndGreedIndex();
    
    // Refresh data every 30 minutes
    const intervalId = setInterval(fetchFearAndGreedIndex, 30 * 60 * 1000);
    
    return () => clearInterval(intervalId);
  }, []);

  const getProgressColor = (value: number) => {
    if (value <= 25) return '#ff4d4f'; // Extreme Fear
    if (value <= 40) return '#faad14'; // Fear
    if (value <= 60) return '#1890ff'; // Neutral
    if (value <= 75) return '#52c41a'; // Greed
    return '#389e0d'; // Extreme Greed
  };

  const getClassificationDescription = (classification: string) => {
    switch (classification.toLowerCase()) {
      case 'extreme fear':
        return 'Investors are in a state of panic, potentially overselling. This could represent a buying opportunity.';
      case 'fear':
        return 'Investors are worried, showing caution in the market.';
      case 'neutral':
        return 'The market sentiment is balanced between optimism and pessimism.';
      case 'greed':
        return 'Investors are showing confidence, possibly leading to higher prices.';
      case 'extreme greed':
        return 'Investors are excessively optimistic, potentially creating a bubble. This could represent a selling opportunity.';
      default:
        return '';
    }
  };

  const renderValueChange = () => {
    if (!fearGreedData) return null;
    
    // Ensure we have valid numbers
    const currentValue = isNaN(fearGreedData.value) ? 0 : fearGreedData.value;
    const previousValue = isNaN(fearGreedData.previousValue) ? currentValue : fearGreedData.previousValue;
    
    const change = currentValue - previousValue;
    const isPositive = change > 0;
    
    // If there's no real change, don't show the indicator
    if (change === 0) {
      return <Text>No change</Text>;
    }
    
    return (
      <Statistic
        value={Math.abs(change)}
        precision={1}
        valueStyle={{ color: isPositive ? '#3f8600' : '#cf1322' }}
        prefix={isPositive ? <ArrowUpOutlined /> : <ArrowDownOutlined />}
        suffix="pts"
      />
    );
  };

  if (loading && !fearGreedData) {
    return (
      <div className="greed-fear-container">
        <Title level={2}>Fear & Greed Index</Title>
        <Card style={{ textAlign: 'center', padding: '40px 0' }}>
          <LoadingOutlined style={{ fontSize: 36 }} />
          <p style={{ marginTop: 16 }}>Loading Fear & Greed Index data...</p>
        </Card>
      </div>
    );
  }

  if (error && !fearGreedData) {
    return (
      <div className="greed-fear-container">
        <Title level={2}>Fear & Greed Index</Title>
        <Card style={{ textAlign: 'center', padding: '20px' }}>
          <Text type="danger">{error}</Text>
          <div style={{ marginTop: 16 }}>
            <button onClick={fetchFearAndGreedIndex}>Retry</button>
          </div>
        </Card>
      </div>
    );
  }

  if (!fearGreedData) return null;

  return (
    <div className="greed-fear-container" style={{ width: '100%' }}>
      <Title level={2}>Fear & Greed Index</Title>
      {error && <Text type="warning" style={{ display: 'block', marginBottom: 16 }}>{error}</Text>}
      <Text type="secondary">
        The Fear & Greed Index measures market sentiment. Extreme fear can be a buying signal, while extreme greed can be a selling opportunity.
      </Text>
      
      <Card style={{ marginTop: 16, width: '100%' }}>
        <Row gutter={[24, 24]} style={{ width: '100%' }}>
          <Col xs={24} md={12}>
            <Space direction="vertical" style={{ width: '100%', height: '100%' }}>
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <Title level={3}>{fearGreedData.classification}</Title>
                <Progress
                  type="dashboard"
                  percent={fearGreedData.value}
                  format={percent => `${percent}`}
                  strokeColor={getProgressColor(fearGreedData.value)}
                  width={250}
                />
              </div>
              <Text style={{ fontSize: '16px', textAlign: 'center', display: 'block', marginTop: '16px' }}>
                {getClassificationDescription(fearGreedData.classification)}
              </Text>
            </Space>
          </Col>
          
          <Col xs={24} md={12}>
            <Card title="Index Details" style={{ height: '100%' }}>
              <Space direction="vertical" style={{ width: '100%', fontSize: '16px' }}>
                <div>
                  <Text strong style={{ fontSize: '16px' }}>Current Value: </Text>
                  <Text style={{ fontSize: '16px' }}>{isNaN(fearGreedData.value) ? 'N/A' : fearGreedData.value}</Text>
                </div>
                <div>
                  <Text strong style={{ fontSize: '16px' }}>Previous Value: </Text>
                  <Text style={{ fontSize: '16px' }}>{isNaN(fearGreedData.previousValue) ? 'N/A' : fearGreedData.previousValue}</Text>
                </div>
                <div>
                  <Text strong style={{ fontSize: '16px' }}>Change: </Text>
                  {renderValueChange()}
                </div>
                <div>
                  <Text strong style={{ fontSize: '16px' }}>Previous Classification: </Text>
                  <Text style={{ fontSize: '16px' }}>{fearGreedData.previousClassification || 'N/A'}</Text>
                </div>
                <div>
                  <Text strong style={{ fontSize: '16px' }}>Last Updated: </Text>
                  <Text style={{ fontSize: '16px' }}>{new Date(fearGreedData.timestamp).toLocaleString()}</Text>
                </div>
                {loading && <div><LoadingOutlined /> Refreshing data...</div>}
              </Space>
            </Card>
          </Col>
        </Row>
        
        <Row style={{ marginTop: 24, width: '100%' }}>
          <Col span={24}>
            <Card 
              title={
                <span style={{ fontSize: '16px' }}>
                  Index Scale
                  <Tooltip title="The Fear & Greed Index ranges from 0-100, with 0 representing Extreme Fear and 100 representing Extreme Greed">
                    <InfoCircleOutlined style={{ marginLeft: 8 }} />
                  </Tooltip>
                </span>
              }
              extra={<a onClick={fetchFearAndGreedIndex} style={{ fontSize: '16px' }}>Refresh Data</a>}
              style={{ width: '100%' }}
            >
              <div style={{ height: 40, background: 'linear-gradient(to right, #ff4d4f, #faad14, #1890ff, #52c41a, #389e0d)', borderRadius: 4 }} />
              <Row justify="space-between" style={{ marginTop: 12, width: '100%' }}>
                <Col><Text style={{ fontSize: '16px' }}>0-25: Extreme Fear</Text></Col>
                <Col><Text style={{ fontSize: '16px' }}>26-40: Fear</Text></Col>
                <Col><Text style={{ fontSize: '16px' }}>41-60: Neutral</Text></Col>
                <Col><Text style={{ fontSize: '16px' }}>61-75: Greed</Text></Col>
                <Col><Text style={{ fontSize: '16px' }}>76-100: Extreme Greed</Text></Col>
              </Row>
            </Card>
          </Col>
        </Row>
      </Card>
    </div>
  );
};

export default GreedAndFear; 