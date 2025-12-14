# CashWise – AI Cash Flow Agent

A full-stack application for managing cash flow with AI-powered insights for micro & small businesses.

## Features

- 💰 Add income and expense transactions
- 📊 Real-time cash flow summary
- 🤖 AI-powered analysis using Google Gemini
- 📱 Responsive design
- ⚡ Fast and modern UI

## Tech Stack

- **Backend**: Node.js, Express
- **Frontend**: React (with Vite) OR HTML/CSS/JS
- **AI**: Google Gemini API
- **Storage**: In-memory (ready for Firestore)

## Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables:**
   - Copy `.env.example` to `.env`
   - Add your `GEMINI_API_KEY`

3. **Choose your frontend:**

   ### Option 1: React Version (Recommended)
   ```bash
   # Build React app
   npm run build
   
   # Start server (serves React build)
   npm start
   ```
   
   Or for development:
   ```bash
   # Terminal 1: Start backend
   npm start
   
   # Terminal 2: Start React dev server
   npm run dev
   ```
   Then visit `http://localhost:5173`

   ### Option 2: HTML Version
   ```bash
   # Just start the server
   npm start
   ```
   Then visit `http://localhost:3000`

## Project Structure

```
cashwise-agent/
├── server.js           # Express backend
├── public/            # HTML/CSS/JS version
│   ├── index.html
│   ├── style.css
│   └── script.js
├── src/               # React version
│   ├── main.jsx
│   ├── App.jsx
│   ├── index.css
│   └── components/
│       ├── Header.jsx
│       ├── TransactionForm.jsx
│       ├── Summary.jsx
│       ├── Transactions.jsx
│       ├── AIInsights.jsx
│       └── Footer.jsx
└── dist/              # React build output (after npm run build)
```

## API Endpoints

- `GET /api/health` - Health check
- `GET /api/transactions` - Get all transactions
- `POST /api/transactions` - Add transaction
- `DELETE /api/transactions/:id` - Delete transaction
- `GET /api/summary` - Get cash flow summary
- `POST /api/analyze` - Run AI analysis
- `GET /api/models` - List available AI models

## Usage

1. Add transactions (income/expense)
2. View cash flow summary
3. Click "Run AI Analysis" to get insights
4. Review AI recommendations

## Notes

- Transactions are stored in-memory (reset on server restart)
- The server automatically detects and serves React build if available
- Both frontend versions share the same backend API
- AI analysis uses automatic model selection for best compatibility

## License

Built for hackathon demonstration.

<img width="897" height="881" alt="CashWise – AI Cash Flow Agent - Google Chrome 12_14_2025 9_26_55 PM" src="https://github.com/user-attachments/assets/5510220a-c65b-4317-8bac-48c3cbfebbf7" />

