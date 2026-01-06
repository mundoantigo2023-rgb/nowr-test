# NOWR - Deployment Guide

## Overview

NOWR is a React + Vite application with Lovable Cloud (Supabase) backend.

## Prerequisites

- Node.js 18+ and npm
- Vercel account (for deployment)
- Lovable Cloud (already configured)

## Environment Variables

The following environment variables are required:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-key
VITE_SUPABASE_PROJECT_ID=your-project-id
```

> Note: These are already configured in Lovable Cloud and will be automatically available.

## Local Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

## Build for Production

```bash
# Build the app
npm run build

# Preview production build locally
npm run preview
```

## Deploy to Vercel

### Option 1: Via Lovable (Recommended)

1. In Lovable, click **Share → Publish**
2. Your app will be deployed automatically

### Option 2: Manual Vercel Deployment

1. Push your code to GitHub
2. Import the repository in Vercel
3. Configure environment variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_PUBLISHABLE_KEY`
   - `VITE_SUPABASE_PROJECT_ID`
4. Deploy

### Vercel Configuration

The project uses standard Vite configuration. Vercel will auto-detect:

- **Framework**: Vite
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`

## Database Schema

### Core Tables

| Table | Description |
|-------|-------------|
| `profiles` | User profiles with presence data |
| `matches` | User matches with chat timing |
| `messages` | Chat messages |
| `interests` | User interest expressions |
| `boosts` | NowPick/ForYou boost records |
| `analytics_events` | Event tracking |

### Storage Buckets

| Bucket | Public | Description |
|--------|--------|-------------|
| `profile-photos` | Yes | User profile photos |
| `private-albums` | Yes | Private album photos |
| `nowpik-images` | No | Ephemeral NowPik images |

## Security

- All tables have Row Level Security (RLS) enabled
- Authentication via Supabase Auth (email/password)
- Storage policies restrict access appropriately

## Analytics Events Tracked

- `signup_completed` - User registration
- `profile_viewed` - Profile page views
- `match_created` - New matches
- `chat_message_sent` - Messages sent
- `chat_expired` - Chat expiration
- `nowpick_activated` - Boost activation
- `prime_page_viewed` - Prime subscription views

## PWA Support

The app includes PWA support with:
- Service worker for offline capability
- App manifest for installation
- Icons for home screen

## Troubleshooting

### Build Errors

```bash
# Clear cache and reinstall
rm -rf node_modules
npm install
npm run build
```

### Environment Variables Not Loading

Ensure all `VITE_` prefixed variables are set in Vercel dashboard.

### Auth Issues

Check that Supabase Auth settings match your deployment URL in the redirect configuration.
