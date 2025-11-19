// lib/types.ts

export interface EmailMessage {
  messageId: string;
  threadId: string;
  subject: string;
  from: string;
  to: string;
  date: string;
  body: string;
  quickAnalysis?: QuickAnalysis;
  deepAnalysis?: DeepAnalysis;
  semanticContext?: SemanticContext;
}

export interface QuickAnalysis {
  sentiment: "positive" | "negative" | "neutral";
  emotion: string;
  tone: string;
  intent: string;
  urgency: "high" | "medium" | "low";
  category: string;
  keywords: string[];
  quickSummary: string;
}

export interface DeepAnalysis {
  detailedSummary: string;
  complianceRisk: boolean;
  complianceIssues: string[];
  piiDetected: boolean;
  piiEntities: string[];
  smartReply: string[];
  toneCorrectedReply: string;
}

export interface SemanticContext {
  entities: string[];
  roles: string[];
  companies: string[];
  topics: string[];
  keywords: string[];
  category: string;
  search_context: string;
}

export interface Thread {
  threadId: string;
  messageIds: string[];
  timeline: TimelineEvent[];
  summary: string;
  escalationRisk: "high" | "medium" | "low";
  updatedAt: string;
}

export interface TimelineEvent {
  messageId: string;
  date: string;
  sentiment: string;
  summary: string;
}

export interface UserSemanticContext {
  messageId: string;
  search_context: string;
  keywords: string[];
  roles: string[];
  entities: string[];
  companies: string[];
  topics: string[];
  category: string;
}

export interface DashboardStats {
  totalEmails: number;
  unreadCount: number;
  urgentCount: number;
  sentimentDistribution: {
    positive: number;
    negative: number;
    neutral: number;
  };
  categoryDistribution: Record<string, number>;
  complianceAlerts: number;
  piiAlerts: number;
}
