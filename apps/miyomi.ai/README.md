# Miyomi Agent Dashboard

A Next.js TypeScript application for Miyomi, an autonomous agent specializing in contrarian market analysis and AI-powered video generation.

## Features

- **Dashboard Overview** - Key performance metrics and recent picks
- **Live Trading Interface** - Real-time trading data and position tracking  
- **AI Video Generation** - Generate market analysis videos using Eden API
- **Concept Generator** - Cinematic video concept creation
- **Risk Controls** - Configurable risk tolerance and sector weights
- **Performance Analytics** - Daily performance tracking and export

## Video Generation

The application integrates with Eden API (api.eden.art) to generate AI-powered videos for market analysis content.

### Setup

1. Get your Eden API key from [https://api.eden.art](https://api.eden.art)
2. Copy `.env.local.example` to `.env.local` 
3. Add your API key:

```bash
NEXT_PUBLIC_EDEN_API_KEY=your_eden_api_key_here
```

### Video Generation Flow

1. **User generates video** - Click generate button in any tab
2. **Task is created** - Video generation task is queued 
3. **Background processing** - Eden API processes the video
4. **User notification** - Toast notification when complete
5. **Video viewing** - Click to view generated video in modal

### Video Styles

- **Fast Generation** - Quick turnaround, good quality
- **Creative Mode** - Higher quality, longer processing  
- **Data-Driven** - Chart-focused, professional
- **Artistic Framework** - Cinematic quality, multi-phase creation

### Video Formats

- **Short Form (9:16)** - TikTok, YouTube Shorts, Instagram
- **Landscape (16:9)** - YouTube, Twitter, general sharing

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser.

## Project Structure

```
src/
├── app/
│   ├── admin/          # Admin dashboard 
│   └── page.tsx        # Main site
├── lib/
│   └── eden-api.ts     # Eden API integration
├── hooks/
│   └── useVideoGeneration.ts  # Video generation hook
└── components/
    ├── VideoTaskProgress.tsx   # Video task UI
    └── VideoViewer.tsx         # Video viewing modal
```

## Admin Dashboard

Access the admin dashboard at `/admin` for:

- **Overview** - Metrics and recent activity
- **Trading** - Live trading interface  
- **Concepts** - AI video concept generation
- **Videos** - Custom video creation
- **Testing** - Eden API testing tools
- **Training** - Risk and strategy controls
- **Performance** - Daily performance data
- **Revenue** - Video generation task history

## API Integration

The app uses Eden API for video generation with robust error handling:

- Connection testing and validation
- Background task processing with polling  
- Progress tracking and notifications
- Persistent task storage in localStorage
- Automatic retry on failures

## Tech Stack

- **Next.js 15** - React framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Eden API** - AI video generation

## License

© 2025 MIYOMI
