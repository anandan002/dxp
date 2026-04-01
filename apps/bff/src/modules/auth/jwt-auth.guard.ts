import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext) {
    if (process.env.DEV_AUTH_BYPASS === 'true') {
      const request = context.switchToHttp().getRequest();
      // Allow portal to switch member via header (dev mode only)
      const headerMemberId = request.headers['x-dev-member-id'] as string | undefined;
      request.user = {
        sub: headerMemberId || process.env.DEV_MEMBER_ID || 'dev-member',
        email: 'dev@local',
        tenant_id: 'dev',
        realm_access: { roles: ['member', 'provider', 'care-manager', 'pa-reviewer'] },
        given_name: 'Dev',
        family_name: 'User',
      };
      return true;
    }
    return super.canActivate(context);
  }
}
