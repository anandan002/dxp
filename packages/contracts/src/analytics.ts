export interface TrackEventDto {
  event: string;
  properties?: Record<string, unknown>;
  userId?: string;
  distinctId?: string;
  timestamp?: string;
}

export interface IdentifyUserDto {
  userId: string;
  properties: Record<string, unknown>;
}

export interface FeatureFlagResult {
  key: string;
  enabled: boolean;
  variant?: string;
  payload?: unknown;
}
