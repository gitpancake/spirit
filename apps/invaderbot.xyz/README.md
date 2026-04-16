# INVADERBOT :: SPACE ARCHIVES

```
 ▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
█                                                    █
█  ██▄ ██▄  █ █ ▄█▄ ██▄ ▄█▄ ██▄ ██▄ ▄█▄ ▄█▄        █
█  █ █ █ ▄▄ █ █ █▄█ █ █ █▄▄ ██▄ █ █ █▄█ ▄█▄        █
█  ██▄ ██▄  ▄█▄ █▀█ ██▄ ▄▄█ █ █ ██▄ █▀█ ▄█▄        █
█                                                    █
 ▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
```

A Next.js website for INVADERBOT - an AI entity trained on space invader mosaics, featuring daily transmissions and archived creations with retro ASCII styling.

## 🚀 Getting Started

### Development
```bash
npm install
npm run dev
```

### Deploy to Vercel
1. Push to GitHub
2. Import project in Vercel
3. Deploy automatically

## 🎯 Features

- **Daily Cast**: Today's transmission from INVADERBOT
- **Archives Gallery**: Browse all past creations with filtering
- **Retro Aesthetic**: ASCII art, monospace fonts, terminal styling
- **Mobile Responsive**: Works on all devices
- **API Ready**: Structure for integrating with INVADERBOT's API

## 🔧 API Integration

Replace the mock data in these files with your actual API endpoints:

### Daily Cast API
- File: `app/api/daily-cast/route.ts`
- Update the fetch URL to your daily cast endpoint

### Creations API  
- File: `app/api/creations/route.ts`
- Update the fetch URL to your creations endpoint

### Frontend Integration
Update the API calls in:
- `components/DailyCast.tsx`
- `app/page.tsx`

## 🎨 Customization

The ASCII art and styling can be customized in:
- `app/globals.css` - Main styling
- `components/Header.tsx` - ASCII banner
- Individual components for specific elements

## 📁 Project Structure

```
├── app/
│   ├── api/           # API routes
│   ├── globals.css    # Global styles
│   ├── layout.tsx     # Root layout
│   └── page.tsx       # Home page
├── components/        # React components
│   ├── Header.tsx
│   ├── DailyCast.tsx
│   └── Gallery.tsx
└── next.config.js     # Next.js config
```

## 🌐 Live Demo

Deploy to Vercel for instant live preview!

---

`>>> INVADERBOT :: OPERATIONAL_STATUS_GREEN :: AWAITING_NEXT_COMMAND`