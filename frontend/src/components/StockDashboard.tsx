import React, { useState, useEffect, useCallback } from 'react';
import { Card, Row, Col, Select, Spin, message, Layout, Menu, Input, Button, Modal, Form, Dropdown, Space, notification, Badge, AutoComplete, DatePicker, Tree, Tooltip } from 'antd';
import { PlusOutlined, DeleteOutlined, FolderOutlined, MoreOutlined, AlertOutlined, StockOutlined, ExpandOutlined, CompressOutlined, EditOutlined, ReloadOutlined } from '@ant-design/icons';
import { AdvancedRealTimeChart } from 'react-ts-tradingview-widgets';
import type { CardProps } from 'antd';
import StockAnalysis from './StockAnalysis';
import dayjs from 'dayjs';
import type { RangePickerProps } from 'antd/es/date-picker';
import type { DataNode, TreeProps, EventDataNode } from 'antd/es/tree';
import type { Key } from 'rc-tree/lib/interface';
import type { MenuProps } from 'antd';
import { StockSearch } from './StockSearch';
import '../css/StockDashboard.css';

const { Sider, Content } = Layout;
const { Search, TextArea } = Input;

interface StockCardProps {
  symbol: string;
  timeframe: "1" | "3" | "5" | "15" | "30" | "60" | "120" | "180" | "240" | "D" | "W" | "BACKTEST";
  backTestRange?: [dayjs.Dayjs | null, dayjs.Dayjs | null];
}

interface StockGroup {
  description: string;
  stocks: string[];
  subGroups?: { [key: string]: StockGroup };  // 添加子文件夹
}

interface GroupData {
  [key: string]: StockGroup;
}

interface AlertData {
  type: string;
  message: string;
  value: number;
  threshold: number;
}

// 添加 WatchlistData 接口
interface WatchlistData {
  groups: {
    [key: string]: StockGroup;
  };
}

const timeframeOptions = [
  { label: '历史', options: [
    { value: "D", label: '日线' },
    { value: "W", label: '周线' }
  ]},
];

const StockCard: React.FC<StockCardProps> = ({ symbol, timeframe, backTestRange }) => {
  const [note, setNote] = useState<string>("");
  const [isEditingNote, setIsEditingNote] = useState(false);
  const [editedNote, setEditedNote] = useState<string>("");
  const noteEditorRef = React.useRef<HTMLDivElement>(null);
  const analysisColRef = React.useRef<HTMLDivElement>(null);

  // 计算编辑窗口位置的函数
  const calculateEditorPosition = () => {
    if (analysisColRef.current) {
      const rect = analysisColRef.current.getBoundingClientRect();
      return {
        top: rect.top - 210, // 在分析报告上方20px
        left: rect.left,
      };
    }
    return null;
  };

  // 修改点击外部处理函数
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (noteEditorRef.current && !noteEditorRef.current.contains(event.target as Node)) {
        setIsEditingNote(true);  
      }
    };

    if (isEditingNote) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isEditingNote]);

  // 获取备注
  useEffect(() => {
    const fetchNote = async () => {
      try {
        const response = await fetch(`${process.env.REACT_APP_API_URL}/api/stock/note/${symbol}`);
        if (response.ok) {
          const data = await response.json();
          setNote(data.note);
        }
      } catch (error) {
        console.error('获取备注失败:', error);
      }
    };
    fetchNote();
  }, [symbol]);

  // 更新备注
  const updateNote = async (newNote: string) => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/stock/note`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          symbol,
          note: newNote,
        }),
      });

      if (response.ok) {
        setNote(newNote);
        message.success('备注已更新');
      } else {
        message.error('更新备注失败');
      }
    } catch (error) {
      console.error('更新备注失败:', error);
      message.error('更新备注失败');
    }
  };

  // 处理备注编辑
  const handleNoteEdit = () => {
    setEditedNote(note);
    setIsEditingNote(true);
  };

  // 处理备注保存
  const handleNoteSave = () => {
    updateNote(editedNote);
    setIsEditingNote(false);
  };

  // 添加自动调整高度的函数
  const autoAdjustHeight = (element: HTMLTextAreaElement) => {
    element.style.height = 'auto';
    element.style.height = `${element.scrollHeight}px`;
  };

  const getChartRange = () => {
    if (timeframe === "BACKTEST" && backTestRange && backTestRange[0] && backTestRange[1]) {
      const diffDays = backTestRange[1].diff(backTestRange[0], 'day');
      if (diffDays <= 30) return "1M";
      if (diffDays <= 90) return "3M";
      if (diffDays <= 180) return "6M";
      return "12M";
    }
    return timeframe === "D" ? "12M" : 
           timeframe === "W" ? "60M" : "1D";
  };

  // 计算开始时间和结束时间
  const getFromTo = () => {
    if (timeframe === "BACKTEST" && backTestRange && backTestRange[0] && backTestRange[1]) {
      return {
        from: backTestRange[0].format('YYYY-MM-DD'),
        to: backTestRange[1].format('YYYY-MM-DD')
      };
    }
    return undefined;
  };

  const dateRange = getFromTo();

  return (
    <Card 
      title={
        <div className="stock-card-title">
          <span className="stock-card-symbol">{symbol}</span>
          <div className="stock-card-note-container">
            {isEditingNote ? (
              <div 
                ref={noteEditorRef}
                className="note-editor"
                style={calculateEditorPosition() || {}}
              >
                <div className="note-editor-header">
                  <span>编辑备注</span>
                  <span className="note-editor-symbol">{symbol}</span>
                </div>
                <TextArea
                  value={editedNote}
                  onChange={(e) => {
                    setEditedNote(e.target.value);
                    autoAdjustHeight(e.target);
                  }}
                  placeholder="在此输入备注内容..."
                  autoFocus
                  autoSize={{ minRows: 3 }}
                  className="note-editor-textarea"
                />
                <div className="note-editor-buttons">
                  <Button onClick={() => setIsEditingNote(false)}>取消</Button>
                  <Button type="primary" onClick={handleNoteSave}>保存</Button>
                </div>
              </div>
            ) : (
              <Tooltip title={note || '点击添加备注'} placement="topRight">
                <div
                  onClick={handleNoteEdit}
                  style={{
                    cursor: 'pointer',
                    color: '#666',
                    fontSize: '14px',
                    maxWidth: 500,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    textAlign: 'right'
                  }}
                >
                  {note ? note.split('\n')[0].slice(0, 30) + (note.split('\n')[0].length > 30 ? '...' : '') : '+ 添加备注'}
                </div>
              </Tooltip>
            )}
          </div>
        </div>
      }
      className="stock-card"
      bodyStyle={{ padding: '12px' }}
    >
      <Row gutter={16}>
        <Col span={16}>
          <div className="stock-card-chart">
            <AdvancedRealTimeChart
              symbol={symbol}
              interval={timeframe === "BACKTEST" ? "D" : timeframe}
              theme="light"
              width="100%"
              height={400}
              allow_symbol_change={true}
              hide_side_toolbar={false}
              range={getChartRange()}
              timezone="America/New_York"
            />
          </div>
        </Col>
        <Col span={8} ref={analysisColRef} className="stock-card-analysis">
          <StockAnalysis symbol={symbol} />
        </Col>
      </Row>
    </Card>
  );
};

const StockDashboard: React.FC = () => {
  const [watchlist, setWatchlist] = useState<WatchlistData>({ groups: {} });
  const [loading, setLoading] = useState(true);
  const [selectedStock, setSelectedStock] = useState<string | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [expandedKeys, setExpandedKeys] = useState<string[]>([]);
  const [timeframe, setTimeframe] = useState<StockCardProps['timeframe']>("D");
  const [selectedKeys, setSelectedKeys] = useState<Key[]>([]);

  // 添加 ref 映射来存储每个股票卡片的引用
  const stockRefs = React.useRef<{ [key: string]: HTMLDivElement | null }>({});

  // 滚动到指定股票的函数
  const scrollToStock = (symbol: string) => {
    const element = stockRefs.current[symbol];
    if (element) {
      element.scrollIntoView({ 
        behavior: 'smooth',
        block: 'start'
      });
    }
  };

  // 获取观察列表
  const fetchWatchlist = useCallback(async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/watchlist`, {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json; charset=utf-8'
        }
      });
      if (!response.ok) {
        throw new Error('获取观察列表失败');
      }
      const data = await response.json();
      
      // 完全替换现有的 watchlist 状态
      setWatchlist({ groups: data.groups || {} });
      
      // 清理 stockRefs
      stockRefs.current = {};
      
      // 清除选中状态
      setSelectedStock(null);
      setSelectedKeys([]);
      
      // 默认展开所有分组
      setExpandedKeys(getAllFolderKeys(data.groups));
    } catch (error) {
      console.error('获取观察列表失败:', error);
      message.error('获取观察列表失败');
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchWatchlist();
  }, []);

  // 获取所有唯一的股票
  const getAllStocks = () => {
    const allStocks = new Set<string>();
    
    const addStocksFromGroup = (group: StockGroup) => {
      // 添加当前分组的股票
      group.stocks.forEach(stock => allStocks.add(stock));
      
      // 递归处理子分组
      if (group.subGroups) {
        Object.values(group.subGroups).forEach(subGroup => {
          addStocksFromGroup(subGroup);
        });
      }
    };
    
    Object.values(watchlist.groups).forEach(group => {
      addStocksFromGroup(group);
    });
    
    return Array.from(allStocks);
  };

  // 获取已分组的股票
  const getGroupedStocks = () => {
    const groupedStocks = new Set<string>();
    
    const addStocksFromGroup = (group: StockGroup) => {
      // 添加当前分组的股票
      group.stocks.forEach(stock => groupedStocks.add(stock));
      
      // 递归处理子分组
      if (group.subGroups) {
        Object.values(group.subGroups).forEach(subGroup => {
          addStocksFromGroup(subGroup);
        });
      }
    };
    
    Object.entries(watchlist.groups).forEach(([groupName, group]) => {
      if (groupName !== "默认分组") {
        addStocksFromGroup(group);
      }
    });
    
    return groupedStocks;
  };

  // 获取未分组的股票
  const getUngroupedStocks = () => {
    const allStocks = getAllStocks();
    const groupedStocks = getGroupedStocks();
    return allStocks.filter(stock => !groupedStocks.has(stock));
  };

  // 修改 handleDeleteStock 函数
  const handleDeleteStock = async (groupName: string, symbol: string) => {
    try {
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/api/watchlist/${encodeURIComponent(groupName)}/${encodeURIComponent(symbol)}`,
        {
          method: 'DELETE',
        }
      );
  
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || '删除股票失败');
      }
  
      await fetchWatchlist();
      message.success('删除成功');
    } catch (error) {
      console.error('删除股票失败:', error);
      message.error(error instanceof Error ? error.message : '删除股票失败');
    }
  };

  // 修改 onDrop 处理函数
  const onDrop: TreeProps['onDrop'] = async (info) => {
    const dropKey = info.node.key as string;
    const dragKey = info.dragNode.key as string;
    const dropPos = info.node.pos.split('-');
    const dropPosition = info.dropPosition - Number(dropPos[dropPos.length - 1]);
    
    // 处理文件夹的拖拽
    if (dragKey.startsWith('folder-')) {
        const sourceFolder = dragKey.replace('folder-', '');
        const targetFolder = dropKey.replace(/^(folder|stock)-/, '');
        
        // 如果是重新排序（放在另一个文件夹的前面或后面）
        if (dropPosition === -1 || dropPosition === 1) {
            try {
                const response = await fetch(`${process.env.REACT_APP_API_URL}/api/groups/reorder`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        source_group: sourceFolder,
                        target_group: targetFolder,
                        position: dropPosition === -1 ? 'before' : 'after'
                    }),
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || '重新排序失败');
                }

                const data = await response.json();
                setWatchlist({ groups: data.groups });
                message.success('重新排序成功');
            } catch (error) {
                console.error('重新排序失败:', error);
                message.error(error instanceof Error ? error.message : '重新排序失败');
            }
            return;
        }
        
        // 如果是移动到另一个文件夹内部
        try {
            const response = await fetch(`${process.env.REACT_APP_API_URL}/api/groups/move`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    source_group: sourceFolder,
                    target_group: dropPosition === 0 ? targetFolder : ''
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || '移动文件夹失败');
            }

            const data = await response.json();
            setWatchlist({ groups: data.groups });
            message.success('移动成功');
        } catch (error) {
            console.error('移动文件夹失败:', error);
            message.error(error instanceof Error ? error.message : '移动文件夹失败');
        }
        return;
    }
    
    // 处理股票的拖拽
    if (dragKey.startsWith('stock-')) {
      const symbol = dragKey.replace('stock-', '');
      let fromGroup = '';
      let toGroup = '';

      // 确定源分组
      for (const [groupName, group] of Object.entries(watchlist.groups)) {
        if (group.stocks.includes(symbol)) {
          fromGroup = groupName;
          break;
        }
      }

      // 确定目标位置和分组
      if (dropKey.startsWith('folder-')) {
        // 如果拖到文件夹上，移动到该文件夹
        toGroup = dropKey.replace('folder-', '');
      } else if (dropKey.startsWith('stock-')) {
        // 如果拖到另一个股票上，可能是重新排序或移动到其他分组
        const targetSymbol = dropKey.replace('stock-', '');
        
        // 找到目标股票所在的分组
        for (const [groupName, group] of Object.entries(watchlist.groups)) {
          if (group.stocks.includes(targetSymbol)) {
            toGroup = groupName;
            break;
          }
        }

        // 如果在同一个分组内，执行重新排序
        if (fromGroup === toGroup) {
          try {
            // 构建完整的分组路径
            let fullGroupPath = '';
            for (const [groupName, group] of Object.entries(watchlist.groups)) {
              if (group.stocks.includes(targetSymbol)) {
                fullGroupPath = groupName;
                break;
              }
              if (group.subGroups) {
                for (const [subGroupName, subGroup] of Object.entries(group.subGroups)) {
                  if (subGroup.stocks.includes(targetSymbol)) {
                    fullGroupPath = `${groupName}/${subGroupName}`;
                    break;
                  }
                }
                if (fullGroupPath) break;
              }
            }

            const response = await fetch(`${process.env.REACT_APP_API_URL}/api/watchlist/reorder`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                group: fullGroupPath,
                source_symbol: symbol,
                target_symbol: targetSymbol,
                position: dropPosition === -1 ? 'before' : 'after'
              }),
            });

            if (!response.ok) {
              const errorData = await response.json();
              throw new Error(errorData.error || '重新排序失败');
            }

            const data = await response.json();
            setWatchlist({ groups: data.groups });
            message.success('重新排序成功');
            return;
          } catch (error) {
            console.error('重新排序失败:', error);
            message.error(error instanceof Error ? error.message : '重新排序失败');
            return;
          }
        }
      } else {
        // 如果拖到未分组区域
        toGroup = '默认分组';
      }

      // 如果源分组和目标分组相同，不执行移动
      if (fromGroup === toGroup) {
        return;
      }

      try {
        // 获取要移动的所有股票
        let stocksToMove: string[] = [];
        if (selectedKeys.length > 1 && selectedKeys.includes(dragKey)) {
          // 如果有多个选中项且包含被拖拽的项，移动所有选中的股票
          stocksToMove = selectedKeys
            .filter(key => typeof key === 'string' && key.startsWith('stock-'))
            .map(key => (key as string).replace('stock-', ''));
        } else {
          // 否则只移动被拖拽的股票
          stocksToMove = [symbol];
        }

        // 依次移动每个股票
        for (const stockSymbol of stocksToMove) {
          console.log(`Moving stock ${stockSymbol} from ${fromGroup} to ${toGroup}`);
          const response = await fetch(`${process.env.REACT_APP_API_URL}/api/watchlist/move`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              symbol: stockSymbol,
              from_group: fromGroup,
              to_group: toGroup,
            }),
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || '移动股票失败');
          }
        }

        // 移动成功后立即更新状态
        setWatchlist(prevState => {
          const newState = {
            groups: { ...prevState.groups }
          };

          // 从源分组中移除股票
          if (newState.groups[fromGroup]) {
            newState.groups[fromGroup] = {
              ...newState.groups[fromGroup],
              stocks: newState.groups[fromGroup].stocks.filter(s => !stocksToMove.includes(s))
            };
          }

          // 添加到目标分组
          if (newState.groups[toGroup]) {
            newState.groups[toGroup] = {
              ...newState.groups[toGroup],
              stocks: [...newState.groups[toGroup].stocks, ...stocksToMove]
            };
          }

          return newState;
        });

        message.success(`成功移动 ${stocksToMove.length} 个股票到 ${toGroup}`);
        setSelectedKeys([]); // 清除选中状态
      } catch (error) {
        console.error('移动股票失败:', error);
        message.error(error instanceof Error ? error.message : '移动股票失败');
      }
    }
  };

  // 新建文件夹
  const handleAddFolder = async (values: { name: string; description: string }) => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/groups`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: values.name,
          description: values.description,
        }),
      });

      if (!response.ok) throw new Error('创建分组失败');

      await fetchWatchlist();
      setIsModalVisible(false);
      form.resetFields();
      message.success('创建分组成功');
    } catch (error) {
      console.error('创建分组失败:', error);
      message.error('创建分组失败');
    }
  };

  // 修改 Tree 的 onSelect 处理函数
  const handleTreeSelect = (selectedKeys: Key[]) => {
    const key = selectedKeys[0] as string;
    if (key?.startsWith('stock-')) {
      const symbol = key.replace('stock-', '');
      setSelectedStock(symbol);
      scrollToStock(symbol);
    }
  };

  // 添加 handleExpand 函数
  const handleExpand = (
    expandedKeys: Key[],
    info: {
      node: EventDataNode<DataNode>;
      expanded: boolean;
      nativeEvent: MouseEvent;
    }
  ) => {
    setExpandedKeys(expandedKeys.map(key => String(key)));
  };

  // 修改删除文件夹的处理函数
  const handleDeleteFolder = async (groupPath: string) => {
    try {
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/api/groups/${encodeURIComponent(groupPath)}`, 
        {
          method: 'DELETE',
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '删除文件夹失败');
      }

      await fetchWatchlist();
      message.success('删除成功');
    } catch (error) {
      console.error('删除文件夹失败:', error);
      message.error(error instanceof Error ? error.message : '删除文件夹失败');
    }
  };

  // 修改 handleRenameFolder 函数
  const handleRenameFolder = async (groupPath: string, newName: string) => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/groups/rename`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          old_path: encodeURIComponent(groupPath),  // 编码路径中的特殊字符
          new_name: newName,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '重命名文件夹失败');
      }

      await fetchWatchlist();
      message.success('重命名成功');
    } catch (error) {
      console.error('重命名文件夹失败:', error);
      message.error(error instanceof Error ? error.message : '重命名文件夹失败');
    }
  };

  // 修改 generateTreeData 函数
  const generateTreeData = (group: StockGroup, groupPath: string): DataNode => {
    const stockNodes: DataNode[] = group.stocks.map((stock: string) => ({
      title: (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <StockOutlined />
            <span>{stock}</span>
          </div>
          <Dropdown
            menu={{
              items: [
                {
                  key: 'delete',
                  icon: <DeleteOutlined />,
                  label: '删除',
                  onClick: () => handleDeleteStock(groupPath, stock)
                }
              ]
            }}
            trigger={['click']}
          >
            <MoreOutlined
              onClick={(e: React.MouseEvent) => e.stopPropagation()}
              style={{ cursor: 'pointer' }}
            />
          </Dropdown>
        </div>
      ),
      key: `stock-${stock}`,
      isLeaf: true,
    }));

    // 创建子文件夹节点
    const subGroupNodes: DataNode[] = group.subGroups ? 
      Object.entries(group.subGroups).map(([subName, subGroup]) =>
        generateTreeData(subGroup, `${groupPath}/${subName}`)
      ) : [];

    // 返回当前文件夹节点
    return {
      title: (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FolderOutlined />
            <span>{groupPath.split('/').pop()}</span>
          </div>
          <Dropdown
            menu={{
              items: [
                {
                  key: 'rename',
                  icon: <EditOutlined />,
                  label: '重命名',
                  onClick: () => {
                    const currentName = groupPath.split('/').pop() || '';
                    let inputRef: any = null;

                    Modal.confirm({
                      title: '重命名文件夹',
                      icon: <EditOutlined />,
                      content: (
                        <Input 
                          placeholder="请输入新名称"
                          defaultValue={currentName}
                          ref={node => {
                            if (node) {
                              inputRef = node;
                              setTimeout(() => node.select(), 100);
                            }
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              const value = inputRef.input.value.trim();
                              if (value) {
                                handleRenameFolder(groupPath, value);
                                Modal.destroyAll();
                              }
                            }
                          }}
                        />
                      ),
                      async onOk() {
                        const value = inputRef.input.value.trim();
                        if (value) {
                          await handleRenameFolder(groupPath, value);
                        }
                      },
                      okButtonProps: {
                        disabled: false
                      }
                    });
                  }
                },
                {
                  key: 'delete',
                  icon: <DeleteOutlined />,
                  label: '删除文件夹',
                  onClick: () => {
                    Modal.confirm({
                      title: '确认删除',
                      content: '删除文件夹后，其中的股票将被移动到默认分组。确定要删除吗？',
                      onOk: () => handleDeleteFolder(groupPath),
                    });
                  }
                }
              ]
            }}
            trigger={['click']}
          >
            <MoreOutlined
              onClick={(e: React.MouseEvent) => e.stopPropagation()}
              style={{ cursor: 'pointer' }}
            />
          </Dropdown>
        </div>
      ),
      key: `folder-${groupPath}`,
      children: [...stockNodes, ...subGroupNodes],
      selectable: false
    };
  };

  // 修改 treeData 的生成
  const treeData: DataNode[] = [
    // 未分组的股票
    ...getUngroupedStocks().map((stock: string): DataNode => ({
      title: (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <StockOutlined />
            <span>{stock}</span>
          </div>
          <Dropdown
            menu={{
              items: [
                {
                  key: 'delete',
                  icon: <DeleteOutlined />,
                  label: '删除',
                  onClick: () => handleDeleteStock('默认分组', stock)
                }
              ]
            }}
            trigger={['click']}
          >
            <MoreOutlined
              onClick={(e: React.MouseEvent) => e.stopPropagation()}
              style={{ cursor: 'pointer' }}
            />
          </Dropdown>
        </div>
      ),
      key: `stock-${stock}`,
      isLeaf: true,
    })),
    // 分组的股票和子分组
    ...Object.entries(watchlist.groups)
      .filter(([groupName]) => groupName !== "默认分组")
      .map(([groupName, group]) => generateTreeData(group, groupName))
  ];

  // 添加获取所有文件夹 key 的函数
  const getAllFolderKeys = (groups: GroupData): string[] => {
    const keys: string[] = [];
    
    const addFolderKeys = (groupPath: string, group: StockGroup) => {
      keys.push(`folder-${groupPath}`);
      if (group.subGroups) {
        Object.entries(group.subGroups).forEach(([subName, subGroup]) => {
          addFolderKeys(`${groupPath}/${subName}`, subGroup);
        });
      }
    };

    Object.entries(groups)
      .filter(([groupName]) => groupName !== "默认分组")
      .forEach(([groupName, group]) => {
        addFolderKeys(groupName, group);
      });

    return keys;
  };

  // 添加展开/折叠所有文件夹的处理函数
  const handleExpandAll = (expand: boolean) => {
    if (expand) {
      // 展开所有文件夹
      const allKeys = getAllFolderKeys(watchlist.groups);
      setExpandedKeys(allKeys);
    } else {
      // 折叠所有文件夹
      setExpandedKeys([]);
    }
  };

  // 添加刷新目录的函数
  const handleRefreshDirectory = async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/watchlist`);
      if (!response.ok) {
        throw new Error('获取观察列表失败');
      }
      const data = await response.json();
      setWatchlist({ groups: data.groups || {} });
      message.success('目录刷新成功');
    } catch (error) {
      console.error('刷新目录失败:', error);
      message.error('刷新目录失败');
    }
  };

  return (
    <Layout className="stock-dashboard-layout">
      <Sider width={300} theme="light" className="stock-dashboard-sider">
        <div className="stock-dashboard-controls">
          <StockSearch 
            onSelect={(symbol) => {
              setSelectedStock(symbol);
              fetchWatchlist();
            }} 
            style={{ width: '100%' }}
          />
          
          <div className="stock-dashboard-buttons">
            <Button 
              type="primary" 
              icon={<PlusOutlined />}
              onClick={() => setIsModalVisible(true)}
              className="new-folder-button"
            >
              新建文件夹
            </Button>
            <Tooltip title="刷新目录" placement="bottom">
              <Button
                icon={<ReloadOutlined />}
                onClick={handleRefreshDirectory}
              />
            </Tooltip>
            <Tooltip 
              title={expandedKeys.length === 0 ? "展开所有文件夹" : "折叠所有文件夹"}
              placement="bottom"
            >
              <Button
                onClick={() => handleExpandAll(expandedKeys.length === 0)}
                icon={expandedKeys.length === 0 ? <ExpandOutlined /> : <CompressOutlined />}
              />
            </Tooltip>
          </div>
        </div>
        
        {loading ? (
          <Spin />
        ) : (
          <Tree
            treeData={treeData}
            expandedKeys={expandedKeys}
            selectedKeys={selectedKeys}
            onExpand={handleExpand}
            onSelect={(keys) => {
              const validKeys = keys.filter(key => 
                typeof key === 'string' && key.startsWith('stock-')
              );
              setSelectedKeys(validKeys);
              
              if (validKeys.length === 1) {
                const symbol = (validKeys[0] as string).replace('stock-', '');
                setSelectedStock(symbol);
                scrollToStock(symbol);
              }
            }}
            draggable
            onDrop={onDrop}
            showIcon
          />
        )}

        <Modal
          title="新建文件夹"
          open={isModalVisible}
          onCancel={() => setIsModalVisible(false)}
          onOk={() => form.submit()}
        >
          <Form form={form} onFinish={handleAddFolder}>
            <Form.Item
              name="name"
              label="名称"
              rules={[{ required: true, message: '请输入文件夹名称' }]}
            >
              <Input />
            </Form.Item>
            <Form.Item
              name="description"
              label="描述"
            >
              <Input />
            </Form.Item>
          </Form>
        </Modal>
      </Sider>

      <Content className="stock-dashboard-content">
        <div>
          <Select
            className="timeframe-select"
            value={timeframe}
            onChange={setTimeframe}
            options={timeframeOptions}
          />
        </div>
        
        {/* 渲染未分组股票 */}
        {getUngroupedStocks().length > 0 && (
          <div>
            <h2 className="group-title">未分组股票</h2>
            {getUngroupedStocks().map(symbol => (
              <div 
                key={symbol}
                ref={(el: HTMLDivElement | null) => {
                  stockRefs.current[symbol] = el;
                  return undefined;
                }}
                id={`stock-${symbol}`}
              >
                <StockCard
                  symbol={symbol}
                  timeframe={timeframe}
                />
              </div>
            ))}
          </div>
        )}
        
        {/* 渲染分组和子分组的股票 */}
        {Object.entries(watchlist.groups)
          .filter(([groupName]) => groupName !== "默认分组")
          .map(([groupName, group]) => {
            const renderStockGroup = (stocks: string[], indent: number = 0) => (
              <>
                {stocks.map(symbol => (
                  <div 
                    key={symbol}
                    ref={(el: HTMLDivElement | null) => {
                      stockRefs.current[symbol] = el;
                      return undefined;
                    }}
                    id={`stock-${symbol}`}
                    className={indent > 0 ? "stock-list-item" : ""}
                  >
                    <StockCard
                      symbol={symbol}
                      timeframe={timeframe}
                    />
                  </div>
                ))}
              </>
            );

            return (
              <div key={groupName}>
                <h2 className="group-title">{groupName}</h2>
                {/* 渲染当前分组的股票 */}
                {renderStockGroup(group.stocks)}
                
                {/* 渲染子分组的股票 */}
                {group.subGroups && Object.entries(group.subGroups).map(([subGroupName, subGroup]) => (
                  <div key={`${groupName}-${subGroupName}`}>
                    <h3 className="subgroup-title">{subGroupName}</h3>
                    {renderStockGroup(subGroup.stocks, 20)}
                  </div>
                ))}
              </div>
            );
          })}
      </Content>
    </Layout>
  );
};

export default StockDashboard; 