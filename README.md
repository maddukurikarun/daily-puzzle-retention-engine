# Daily Puzzle Retention Engine

A full-stack daily puzzle application featuring offline-first architecture, streak tracking, and engagement analytics.

## 🎯 Features

- **Core Puzzle Engine**: Deterministic daily puzzles with client-side validation
- **Streak System**: Track daily engagement with visual indicators
- **Daily Heatmap**: 365-day GitHub-style activity visualization
- **Offline First**: IndexedDB storage with background sync
- **Minimal Backend**: Efficient sync architecture for scale
- **Mobile Responsive**: Works seamlessly across devices

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Set up database
npx prisma generate
npx prisma db push

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## 📦 Tech Stack

- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Prisma ORM
- **Database**: SQLite (demo) / PostgreSQL (production)
- **Offline**: IndexedDB, Background Sync
- **Auth**: Google OAuth + Guest Mode

## 🏗️ Architecture

- Offline-first design
- Client-side puzzle validation
- Deterministic seed-based generation
- Efficient sync on reconnection

## 📊 Demo Flow

1. Login (Google or Guest)
2. Solve today's puzzle
3. Streak updates automatically
4. Heatmap reflects activity
5. Works offline, syncs when online

## 🎨 Project Structure

```
├── app/              # Next.js app directory
├── components/       # React components
├── lib/             # Utilities and services
├── prisma/          # Database schema
└── public/          # Static assets
```

## 📝 License

MIT
