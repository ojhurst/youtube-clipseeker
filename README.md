# YouTube ClipSeeker

**Find the exact moment in your videos** - Search across YouTube video transcripts and jump straight to the timestamp.

![ClipSeeker](https://img.shields.io/badge/ClipSeeker-YouTube%20Transcript%20Search-red?style=for-the-badge&logo=youtube)

## Features

- 🔍 **Full-text search** across all indexed video transcripts
- 📺 **Import videos** via URL or entire YouTube channels
- ⏱️ **Timestamp navigation** - Click any result to jump to that moment
- 🎯 **Highlighted results** - See search terms in context
- 📱 **Responsive design** - Works on desktop and mobile
- 💾 **Persistent storage** - Your library is saved locally (or in Supabase)

## Tech Stack

- **Frontend**: React + Vite + Tailwind CSS
- **State**: Zustand + IndexedDB (or Supabase)
- **Search**: Fuse.js for fuzzy matching
- **Backend**: Node.js + Python transcript fetcher

## Getting Started

### Prerequisites

- Node.js 18+
- Python 3.8+

### Local Development

1. Clone the repository:
```bash
git clone https://github.com/yourusername/youtube-clipseeker.git
cd youtube-clipseeker
```

2. Install dependencies:
```bash
npm install
pip install youtube-transcript-api
```

3. Create a `.env` file with your configuration:
```env
# Supabase (optional - for cloud storage)
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

4. Start the development servers:
```bash
npm run dev
```

This starts:
- Frontend on http://localhost:3000
- API server on http://localhost:3002
- Transcript service on http://localhost:3003

## Deployment

### Vercel (Frontend)

1. Push to GitHub
2. Connect to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy!

### Supabase (Database)

1. Create a new Supabase project
2. Run the SQL schema (see `supabase/schema.sql`)
3. Copy your project URL and anon key to environment variables

### Backend Options

The transcript fetching requires a backend. Options:

1. **Vercel Serverless Functions** - Include in `/api` folder
2. **Railway/Render** - Deploy the Node.js server
3. **Self-hosted** - Run on your own server

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `VITE_SUPABASE_URL` | Supabase project URL | For cloud storage |
| `VITE_SUPABASE_ANON_KEY` | Supabase anonymous key | For cloud storage |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key (server only) | For admin operations |

## Project Structure

```
├── src/
│   ├── components/     # React components
│   ├── pages/          # Page components
│   ├── services/       # API services
│   └── store/          # Zustand store
├── api/                # Vercel serverless functions
├── supabase/           # Database schema
├── server.js           # Express API server
└── transcript-fetcher.py  # Python transcript service
```

## License

MIT

---

Built with ❤️ for content creators and researchers
