import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';
import { IdentityPort, UserProfile, UpdateProfileDto } from '../ports/identity.port';

@Injectable()
export class KeycloakAdminAdapter extends IdentityPort {
  private readonly logger = new Logger(KeycloakAdminAdapter.name);
  private readonly client: AxiosInstance;
  private readonly realm: string;

  constructor(private config: ConfigService) {
    super();
    const baseURL = this.config.get<string>('KEYCLOAK_URL', 'http://localhost:8080');
    this.realm = this.config.get<string>('KEYCLOAK_REALM', 'dxp');
    this.client = axios.create({ baseURL: `${baseURL}/admin/realms/${this.realm}` });
  }

  async getUser(userId: string): Promise<UserProfile> {
    // In production: get admin token, then GET /users/{id}
    this.logger.debug(`Get user: ${userId}`);
    return {
      id: userId,
      email: '',
      firstName: '',
      lastName: '',
      roles: [],
      tenantId: '',
      enabled: true,
      createdAt: '',
    };
  }

  async listUsers(tenantId: string, page = 1, pageSize = 20): Promise<{ data: UserProfile[]; total: number }> {
    this.logger.debug(`List users for tenant: ${tenantId}`);
    // GET /users?q=tenant_id:${tenantId}&first=${offset}&max=${pageSize}
    return { data: [], total: 0 };
  }

  async updateUser(userId: string, dto: UpdateProfileDto): Promise<UserProfile> {
    this.logger.debug(`Update user: ${userId}`);
    // PUT /users/{id} with updated fields
    return this.getUser(userId);
  }

  async resetPassword(userId: string): Promise<void> {
    this.logger.debug(`Reset password for: ${userId}`);
    // PUT /users/{id}/execute-actions-email with ["UPDATE_PASSWORD"]
  }
}
