import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import {
  HealthCheck,
  HealthCheckService,
  HttpHealthIndicator,
} from '@nestjs/terminus';
import { ConfigService } from '@nestjs/config';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private http: HttpHealthIndicator,
    private config: ConfigService,
  ) {}

  @Get()
  @HealthCheck()
  @ApiOperation({ summary: 'Aggregated health check' })
  check() {
    const keycloakUrl = this.config.get<string>('KEYCLOAK_URL', 'http://localhost:5025');

    return this.health.check([
      () => this.http.pingCheck('keycloak', `${keycloakUrl}/health/ready`),
    ]);
  }
}

