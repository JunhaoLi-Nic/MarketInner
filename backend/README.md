# MarketVision Backend

This is the backend service for the MarketVision Stock Market Monitoring Platform. It provides API endpoints for capturing and managing chart screenshots.

## Features

- Screenshot capture of TradingView charts
- Screenshot storage and retrieval
- Integration with frontend note-taking functionality

## Setup

1. Install dependencies:

```bash
pip install -r requirements.txt
```

2. Install Chrome browser (required for Selenium)

3. Install ChromeDriver (compatible with your Chrome version)
   - You can use webdriver-manager which is included in requirements.txt

## Running the Server

Start the FastAPI server:

```bash
cd backend
uvicorn app.main:app --reload
```

The server will run at http://localhost:8000

## API Endpoints

- `POST /api/screenshots` - Create a new screenshot
- `GET /api/screenshots/view/{filename}` - View a screenshot
- `DELETE /api/screenshots/{note_id}` - Delete a screenshot

## Integration with Frontend

The frontend React application communicates with these endpoints to:
1. Capture screenshots when saving notes
2. Display screenshots when viewing notes
3. Delete screenshots when deleting notes

## Database Integration

Future versions will integrate with a database to store screenshot metadata and paths. 