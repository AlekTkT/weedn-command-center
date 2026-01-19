// Types centralisés Weedn Command Center

// ============ AGENTS ============
export type AgentStatus = 'online' | 'idle' | 'busy' | 'error';

export interface Agent {
  id: string;
  name: string;
  icon: string;
  status: AgentStatus;
  color: string;
  q: number; // Position hexagonale
  r: number;
  tasksCompleted: number;
  tasksTotal: number;
  level: number;
  xp: number;
}

export interface AgentConfig {
  id: string;
  name: string;
  icon: string;
  description: string;
  color: string;
  capabilities: string[];
  dataSources: string[];
  actions: string[];
  systemPrompt: string;
}

// ============ ACTIVITÉS ============
export type ActivityResult = 'success' | 'pending' | 'error';

export interface Activity {
  id: string;
  agent: string;
  agentIcon: string;
  action: string;
  result: ActivityResult;
  timestamp: string;
  details?: string;
}

// ============ MÉTRIQUES ============
export type TrendDirection = 'up' | 'down' | 'stable';

export interface Metric {
  title: string;
  value: string | number;
  trend: TrendDirection;
  trendValue: string;
  icon?: React.ReactNode;
}

// ============ ACTIONS ============
export type ActionStatus = 'pending_approval' | 'pending_execution' | 'executing' | 'completed' | 'failed';

export interface ActionRequest {
  id: string;
  type: string;
  action: string;
  params: Record<string, any>;
  status: ActionStatus;
  createdAt: string;
  approvedAt?: string;
  executedAt?: string;
  result?: any;
  error?: string;
}

// ============ SHOPIFY ============
export interface ShopifyOrder {
  id: string;
  number: number;
  total: string;
  currency: string;
  financialStatus: string;
  fulfillmentStatus: string;
  customerEmail: string;
  itemCount: number;
  createdAt: string;
}

export interface ShopifyProduct {
  id: string;
  title: string;
  handle: string;
  status: string;
  productType: string;
  vendor: string;
  inventory: number;
  variants: number;
  priceRange: {
    min: number;
    max: number;
  };
  images: number;
  createdAt: string;
  updatedAt: string;
}

export interface ShopifyCustomer {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  ordersCount: number;
  totalSpent: string;
  createdAt: string;
}

// ============ KLAVIYO ============
export interface KlaviyoSegment {
  id: string;
  name: string;
  profileCount?: number;
}

export interface KlaviyoList {
  id: string;
  name: string;
  profileCount?: number;
}

export interface KlaviyoCampaign {
  id: string;
  name: string;
  status: string;
  channel: string;
  createdAt: string;
}

// ============ TEAM ============
export interface TeamMember {
  name: string;
  role: string;
  phone: string;
  channels: string[];
  notifications: {
    alerts: boolean;
    dailyReports: boolean;
    urgentOnly: boolean;
  };
}

// ============ API RESPONSES ============
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  details?: string;
}

export interface ClaudeResponse {
  response: string;
  agentId: string;
  timestamp: string;
  tokensUsed?: number;
}
