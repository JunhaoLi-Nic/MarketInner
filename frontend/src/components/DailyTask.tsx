import React from 'react';
import { Card, List, Typography, Tag, Space, Divider } from 'antd';
import { CheckCircleOutlined, ClockCircleOutlined } from '@ant-design/icons';
import MarketRelationships from './MarketRelationships';
import ICTKillZones from './ICTKillZones';
import MarketIndices from './MarketIndices';
import GreedAndFear from './GreedAndFear';
import StockNews from './StockNews';

const { Title } = Typography;

const DailyTask: React.FC = () => {
  

  const getStatusTag = (status: string) => {
    switch (status) {
      case 'pending':
        return <Tag color="default"><ClockCircleOutlined /> Pending</Tag>;
      case 'ongoing':
        return <Tag color="processing"><ClockCircleOutlined /> In Progress</Tag>;
      case 'completed':
        return <Tag color="success"><CheckCircleOutlined /> Completed</Tag>;
      default:
        return null;
    }
  };

  return (
    <div className="daily-task-container" style={{ padding: '24px' }}>
      <Title level={2}>Daily Tasks</Title>
      
      
      <Divider style={{ margin: '40px 0 20px' }} />
      
      {/* Market Indices Component */}
      <MarketIndices />
      
      <Divider style={{ margin: '40px 0 20px' }} />
      
      {/* Greed and Fear Component */}
      <GreedAndFear />
      
      <Divider style={{ margin: '40px 0 20px' }} />
      
      {/* ICT Kill Zones Component */}
      <ICTKillZones />
      
      <Divider style={{ margin: '40px 0 20px' }} />
      
      {/* Market Relationships Component */}
      <MarketRelationships />

      {/* Stock News */}  
      <StockNews />
    </div>
  );
};

export default DailyTask;
