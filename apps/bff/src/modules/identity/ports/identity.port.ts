export interface UserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  roles: string[];
  tenantId: string;
  enabled: boolean;
  createdAt: string;
}

export interface UpdateProfileDto {
  firstName?: string;
  lastName?: string;
  attributes?: Record<string, string>;
}

export abstract class IdentityPort {
  abstract getUser(userId: string): Promise<UserProfile>;
  abstract listUsers(tenantId: string, page?: number, pageSize?: number): Promise<{ data: UserProfile[]; total: number }>;
  abstract updateUser(userId: string, dto: UpdateProfileDto): Promise<UserProfile>;
  abstract resetPassword(userId: string): Promise<void>;
}
