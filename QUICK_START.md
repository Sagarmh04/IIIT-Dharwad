# Quick Start Guide

## 🚀 Getting Started

### 1. Add Your OpenAI API Key

Open `.env.local` and replace:
```
OPENAI_API_KEY=your_openai_api_key_here
```

With your actual OpenAI API key from https://platform.openai.com/api-keys

### 2. Start the Development Server

```bash
npm run dev
```

### 3. Access the Application

Visit: http://localhost:3000/login

### 4. First-Time Setup

1. **Login**: Click "Sign in with Google"
2. **Authorize**: Grant Gmail read permissions
3. **Sync**: Once logged in, click "Sync Gmail Now" in the left sidebar
4. **Wait**: First sync fetches 20 emails and runs Quick Analysis (Pass 1)
5. **Explore**: Click any email to trigger Deep Analysis (Pass 2)
6. **Search**: Use the search page for semantic queries

## 📊 Features Overview

### Main Dashboard (`/`)
- **Left Sidebar**: Filters and "Sync Gmail Now" button
- **Top Bar**: Analytics cards showing:
  - Analyzed emails count
  - High priority emails
  - Compliance risks
  - PII detections
- **Email List**: Shows all emails with badges for sentiment/urgency
- **Detail Panel**: Full email view with all analysis data
- **Smart Reply Box**: AI-generated reply suggestions

### Filters (Sidebar)
- ✅ Sentiment: positive, neutral, negative
- ✅ Urgency: low, medium, high
- ✅ Category: work, personal, finance, legal, support, marketing
- ✅ Alerts: Compliance Risk, Contains PII

### Search Page (`/search`)
Try queries like:
- "urgent emails from doctors"
- "ByteDocker compliance issues"
- "financial emails"
- "emails about meetings"

### Thread View (`/thread/[threadId]`)
- Thread summary
- Sentiment timeline
- Escalation risk assessment
- All messages in thread

## 🔄 Analysis Pipeline

### Pass 1: Quick Analysis (Automatic on Sync)
Runs on 5 emails concurrently, extracts:
- Sentiment
- Urgency
- Intent
- Category
- Keywords
- Quick summary

### Pass 2: Deep Analysis (Triggered on Email Open)
Single email analysis with:
- Detailed summary
- Emotion detection
- Tone analysis
- Compliance risk assessment
- PII detection
- Smart reply suggestions
- Conversation health score

### Pass 3: Semantic Context (After Pass 2)
Extracts for search:
- Entities (people, organizations)
- Roles (doctor, manager, etc.)
- Companies
- Topics
- Search context string

## 💡 Tips

1. **First Sync Takes Time**: Initial sync processes 20 emails with AI analysis
2. **Real-time Updates**: Email list updates automatically as analysis completes
3. **Selective Deep Analysis**: Deep analysis only runs when you open an email
4. **Cached Results**: Re-opening analyzed emails is instant (no re-analysis)
5. **Concurrent Processing**: Pass 1 processes 5 emails at a time for speed

## 🎨 UI Elements

### Email List Item Badges
- **Green**: Positive sentiment
- **Red**: Negative sentiment
- **Gray**: Neutral sentiment
- **Red Badge**: High urgency
- **Yellow Badge**: Medium urgency
- **Gray Badge**: Low urgency

### Color Scheme
- Background: Pure black (`#000000`)
- Panels: Dark navy (`#0b0b0e`)
- Highlight: Royal blue (`#0b3d91`)
- Hover: Light royal blue (`#2b58b8`)

## 🔧 Troubleshooting

### "Not authenticated" Error
- Re-login at `/login`
- Check if access_token cookie is set

### Analysis Not Running
- Verify `OPENAI_API_KEY` in `.env.local`
- Check browser console for API errors
- Restart dev server after adding API key

### Emails Not Syncing
- Check Gmail API quotas in Google Cloud Console
- Verify OAuth scopes include `gmail.readonly`
- Check network tab for API call failures

### Firestore Errors
- Verify Firebase config in `.env.local`
- Check Firestore rules allow read/write
- Ensure user.email is valid

## 📝 Next Steps

1. ✅ Sync your first emails
2. ✅ Open an email to see deep analysis
3. ✅ Try the search functionality
4. ✅ Apply filters to organize emails
5. ✅ View thread analytics
6. ✅ Use smart reply suggestions

## 🚨 Important Notes

- **API Costs**: Each analysis makes OpenAI API calls (costs apply)
- **Rate Limits**: Gmail API has quotas (typically 250 quota units per user per second)
- **Caching**: Once analyzed, emails are cached in Firestore (no re-analysis)
- **Privacy**: All data stored in your Firebase project

Enjoy your AI-powered email intelligence system! 🎉
