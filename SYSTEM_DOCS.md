# Email Intelligence System

A comprehensive email management system with AI-powered analysis, semantic search, and real-time insights.

## Features Implemented

### ✅ Core Analysis
- **Sentiment Analysis** - Positive, neutral, negative detection
- **Emotion Detection** - Joy, anger, sadness, fear, surprise, neutral
- **Tone Detection** - Formal, informal, aggressive, passive, assertive, friendly
- **Intent Extraction** - Request, information, complaint, feedback, other
- **Urgency Detection** - Low, medium, high priority classification
- **Summary** - Quick one-line and detailed multi-sentence summaries

### ✅ Compliance & Security
- **Compliance Risk Detection** - Identifies potential compliance issues
- **PII Detection** - Detects personally identifiable information
- **Conversation Health Score** - 0-100 score for email thread health

### ✅ Intelligence & Automation
- **Keyword Extraction** - Automatic keyword identification
- **Auto Category** - Work, personal, finance, legal, support, marketing
- **Smart Reply** - AI-generated reply suggestions
- **Tone Correction** - Adjust reply tone (professional, friendly, formal, casual)

### ✅ Thread Management
- **Thread Detection** - Uses Gmail's threadId
- **Thread Summarization** - Comprehensive thread summaries
- **Thread Escalation Detection** - Identifies escalating threads
- **Sentiment Timeline** - Visual sentiment progression

### ✅ Search & Discovery
- **Semantic Search** - AI-powered contextual search
- **Entity Search** - Find emails by people/organizations
- **Topic Search** - Search by topics/themes
- **Role-based Search** - "doctor emails", "manager emails"
- **Company Search** - "ByteDocker emails"
- **Keyword Cloud** - Visual keyword representation

### ✅ Alerts & Notifications
- **PII Alerts** - Warnings for sensitive data
- **Compliance Alerts** - Risk notifications
- **Urgent Email Bot** - High-priority email identification

### ✅ Dashboard & UI
- **Real-time Sync** - Firestore real-time listeners
- **Dashboard Insights** - Analytics overview
- **Sidebar Filters** - Multi-criteria filtering
- **Sync Gmail Button** - Manual sync trigger

### ✅ Processing Pipeline
- **Concurrent Analysis** - Process 5 emails simultaneously
- **No Re-analysis** - Cached results in Firestore
- **Pass 1** - Quick analysis (sentiment, urgency, intent, category, keywords)
- **Pass 2** - Deep analysis (detailed summary, emotion, tone, compliance, PII, smart replies)
- **Pass 3** - Semantic context (entities, roles, companies, topics, search context)

## Architecture

### Firestore Schema

```typescript
users/{userId}/emails/{messageId}
{
  messageId: string
  threadId: string
  subject: string
  from: string
  to: string
  date: number
  body: string
  
  quickAnalysis: {
    sentiment: "positive" | "neutral" | "negative"
    urgency: "low" | "medium" | "high"
    intent: string
    category: string
    keywords: string[]
    summary: string
  }
  
  deepAnalysis: {
    detailedSummary: string
    emotion: string
    tone: string
    complianceRisk: {
      level: "low" | "medium" | "high"
      reason: string
      issues: string[]
    }
    piiDetected: string[]
    smartReplies: string[]
    conversationHealthScore: number
  }
  
  semanticContext: {
    entities: string[]
    roles: string[]
    companies: string[]
    topics: string[]
    keywords: string[]
    category: string
    search_context: string
  }
}

users/{userId}/threads/{threadId}
{
  threadId: string
  messageIds: string[]
  timeline: Array<{
    sentiment: string
    from: string
    date: number
  }>
  summary: string
  escalationRisk: "low" | "medium" | "high"
  updatedAt: timestamp
}

users/{userId}/semanticContext/{messageId}
{
  messageId: string
  search_context: string
  keywords: string[]
  roles: string[]
  entities: string[]
  companies: string[]
  topics: string[]
  category: string
}
```

## API Routes

### Gmail Integration
- `GET /api/gmail/messages` - Fetch last 20 email IDs
- `GET /api/gmail/full?messageId={id}` - Fetch full email content

### Analysis Pipeline
- `POST /api/analysis/pass1` - Quick analysis (batch of 5)
  - Input: `{ emails: [...] }`
  - Output: `{ results: [{ messageId, quickAnalysis }] }`

- `POST /api/analysis/pass2` - Deep analysis (single email)
  - Input: `{ email: {...} }`
  - Output: `{ messageId, deepAnalysis }`

- `POST /api/analysis/pass3` - Semantic context (single email)
  - Input: `{ email: {...} }`
  - Output: `{ messageId, semanticContext }`

### Search & Utilities
- `POST /api/search` - Semantic search
  - Input: `{ query: string, semanticContexts: [...] }`
  - Output: `{ searchIntent, results: [...] }`

- `POST /api/tone-correction` - Adjust tone
  - Input: `{ text: string, tone: string }`
  - Output: `{ correctedText: string }`

### Auth
- `GET /api/user` - Get current user profile
- `GET /api/oauth/google` - OAuth redirect
- `GET /api/auth/logout` - Sign out

## Pages

- `/` - Main inbox with sidebar, stats, email list, detail panel
- `/login` - OAuth login page
- `/search` - Semantic search interface
- `/thread/[threadId]` - Thread view with timeline and analytics
- `/emails/[id]` - Individual email detail page

## Components

- `<Sidebar />` - Filter controls and sync button
- `<StatsCard />` - Analytics cards
- `<EmailListItem />` - Email preview with badges
- `<EmailDetailPanel />` - Full email view with analysis
- `<SmartReplyBox />` - Reply composer with AI suggestions

## Setup

1. **Environment Variables** (`.env.local`):
```env
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI=http://localhost:3000/api/oauth/google

OPENAI_API_KEY=your_openai_api_key

NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...
```

2. **Install Dependencies**:
```bash
npm install
```

3. **Run Development Server**:
```bash
npm run dev
```

4. **Usage**:
   - Visit `http://localhost:3000/login`
   - Sign in with Google
   - Click "Sync Gmail Now" in sidebar
   - Watch emails populate with real-time analysis
   - Click any email to trigger deep analysis
   - Use search for semantic queries
   - Apply filters in sidebar

## Color Theme

- **Background**: `#000000` (OLED black)
- **Cards/Panels**: `#0b0b0e` (Dark navy)
- **Primary**: `#0b3d91` (Royal blue)
- **Hover**: `#2b58b8` (Lighter royal blue)
- **Borders**: `white/10` (10% white opacity)

## Processing Flow

1. **Sync** → Fetch email IDs from Gmail API
2. **Fetch Full** → Get complete email content
3. **Store Raw** → Save to Firestore (users/{email}/emails/{messageId})
4. **Pass 1** → Quick analysis on 5 emails concurrently
5. **Update UI** → Real-time listener shows analysis badges
6. **Pass 2** → Deep analysis when user opens email
7. **Pass 3** → Extract semantic context after Pass 2
8. **Search Index** → Store in semanticContext collection

## Future Enhancements

- [ ] Implement actual email sending via Gmail API
- [ ] Add email composition from scratch
- [ ] Implement thread auto-reply suggestions
- [ ] Add calendar integration for meeting detection
- [ ] Create analytics dashboard with charts
- [ ] Add export functionality (PDF, CSV)
- [ ] Implement email labeling/tagging
- [ ] Add attachment handling
- [ ] Create mobile responsive design
- [ ] Add dark/light mode toggle

## License

MIT
