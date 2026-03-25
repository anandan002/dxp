// Common types shared across all platform services

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

export interface ApiError {
  code: string;
  message: string;
  detail?: string;
  traceId?: string;
}

export interface RequestContext {
  tenantId: string;
  userId: string;
  requestId: string;
  roles: string[];
}

export interface HealthStatus {
  status: 'healthy' | 'unhealthy';
  service: string;
  checks: HealthCheck[];
}

export interface HealthCheck {
  name: string;
  status: 'up' | 'down';
  latency?: string;
  error?: string;
}

export type EntityBase = {
  id: string;
  tenantId: string;
  createdAt: string;
  updatedAt: string;
};
