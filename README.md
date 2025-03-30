# 📈 MarketVision: Stock Market Monitoring Platform

![Python Version](https://img.shields.io/badge/Python-3.9%2B-blue)
![Node Version](https://img.shields.io/badge/Node.js-16%2B-green)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A comprehensive stock market monitoring and analysis platform featuring real-time price tracking, technical indicator visualization, and historical data analysis capabilities.

![Platform Preview](https://github.com/user-attachments/assets/bcfeb363-f93a-4d39-8ba5-d7b4b5e111e2)

---
## 🚀 Quick Start

✅ Verified compatible versions:
- Python 3.9.13 
- Node.js v16.14.2+
- npm 8.5.0+

ℹ️ Lower/higher versions may work but are not fully tested

## 🛠 Installation Guide

### 1. Clone the Repository
```bash
git clone https://github.com/Julie3399/stock_monitor.git
cd stock-monitor
```

### 2. Initialize Environment
```bash
bash setup.sh
```
📌 The script will automatically:
- Install Python dependencies
- Install Node.js modules

## 🔥 Usage Guide
Start the system
```bash
python run.py
```
📌 The script will automatically:
- Start the backend service
- Start the frontend service
- Open your browser and display the platform interface
  
---
## 🧩 Technical Architecture

| Component | Tech Stack                    |
|-----------|------------------------------|
| Backend   | Python + FastAPI            | 
| Frontend  | React + TypeScript          | 
| Charts    | react-tradingview-widget    | 
| Data Source | yfinance                  | 

## ✨ Features

- Real-time stock price monitoring
- Technical indicator visualization
- Historical data analysis
- Custom watchlist management
- Market relationship tracking
- Daily task management
- Interactive charts and graphs
- Responsive and modern UI

## 🔧 Development

### Backend Development
```bash
cd backend
uvicorn main:app --reload --port 8002
```

### Frontend Development
```bash
cd frontend
npm start
```

The frontend will be available at http://localhost:3000

---
## ⚠️ Disclaimer

📌 **Important Legal Notice** 

This tool does **not constitute any investment advice**. Users should:

🔍 Verify data accuracy independently

💼 Consult with professional financial advisors

⚖️ Take full responsibility for all trading decisions

📉 Understand market volatility

The author is not liable for any direct/indirect losses incurred through the use of this software.

---
## 🤝 Contributing
Contributions are welcome! Please create an issue to discuss major changes before submitting pull requests.
