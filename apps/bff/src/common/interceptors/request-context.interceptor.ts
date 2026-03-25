import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { Request } from 'express';

export interface DxpRequestContext {
  tenantId: string;
  userId: string;
  requestId: string;
  roles: string[];
}

declare module 'express' {
  interface Request {
    dxpContext?: DxpRequestContext;
  }
}

@Injectable()
export class RequestContextInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<Request>();

    request.dxpContext = {
      tenantId: (request.user as Record<string, string>)?.tenant_id || '',
      userId: (request.user as Record<string, string>)?.sub || '',
      requestId: (request.headers['x-request-id'] as string) || '',
      roles: this.extractRoles(request.user),
    };

    return next.handle();
  }

  private extractRoles(user: unknown): string[] {
    if (!user || typeof user !== 'object') return [];
    const u = user as Record<string, unknown>;
    const realmAccess = u.realm_access as { roles?: string[] } | undefined;
    return realmAccess?.roles || [];
  }
}
