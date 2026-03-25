import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { DxpRequestContext } from '../interceptors/request-context.interceptor';

export const DxpContext = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): DxpRequestContext => {
    const request = ctx.switchToHttp().getRequest();
    return request.dxpContext;
  },
);
