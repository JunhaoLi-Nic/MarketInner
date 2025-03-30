import React, { useState, useEffect } from 'react';
import { Card, List, Typography, Spin, Empty, Tag, message } from 'antd';
import { GlobalOutlined } from '@ant-design/icons';
import axios from 'axios';

const { Title, Text } = Typography;

interface NewsItem {
  title: string;
  link: string;
  source: string;
  publishedDate: string;
}

const StockNews: React.FC = () => {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchNews = async () => {
      try {
        setLoading(true);
        const response = await axios.get('http://localhost:8002/api/stock/news');
        
        if (response.data.success && response.data.data) {
          setNews(response.data.data);
        } else {
          throw new Error('Failed to fetch news data');
        }
      } catch (error) {
        console.error("Error fetching news:", error);
        message.error('Failed to load stock news. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchNews();
    
    // Refresh news every 5 minutes
    const interval = setInterval(fetchNews, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  return (
    <Card title={<Title level={4}>Latest Stock News</Title>} className="stock-news-card">
      {loading ? (
        <div style={{ textAlign: 'center', padding: '20px' }}>
          <Spin size="large" />
          <div style={{ marginTop: '10px' }}>Fetching latest news...</div>
        </div>
      ) : news.length > 0 ? (
        <List
          itemLayout="vertical"
          dataSource={news}
          renderItem={(item) => (
            <List.Item
              extra={<Tag color="blue"><GlobalOutlined /> {item.source}</Tag>}
            >
              <List.Item.Meta
                title={<a href={item.link} target="_blank" rel="noopener noreferrer">{item.title}</a>}
                description={<Text type="secondary">Published: {item.publishedDate}</Text>}
              />
            </List.Item>
          )}
        />
      ) : (
        <Empty description="No news available at the moment" />
      )}
    </Card>
  );
};

export default StockNews; 