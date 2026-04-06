import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

const UUID_PATTERN =
  /\b[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\b/i;
const DEFAULT_DEV_MEMBER_ID = '7de24de3-a6ee-464e-88ad-004799281205';

function normalizeMemberId(candidate: unknown): string | null {
  if (!candidate) {
    return null;
  }
  const raw = Array.isArray(candidate) ? candidate.join(',') : String(candidate);
  const match = raw.match(UUID_PATTERN);
  return match ? match[0].toLowerCase() : null;
}

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext) {
    if (process.env.DEV_AUTH_BYPASS === 'true') {
      const request = context.switchToHttp().getRequest();
      // Allow portal to switch member via header (dev mode only)
      const headerMemberId = normalizeMemberId(request.headers['x-dev-member-id']);
      const envMemberId = normalizeMemberId(process.env.DEV_MEMBER_ID);
      request.user = {
        sub: headerMemberId || envMemberId || DEFAULT_DEV_MEMBER_ID,
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
