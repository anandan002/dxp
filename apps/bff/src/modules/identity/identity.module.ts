import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IdentityPort } from './ports/identity.port';
import { KeycloakAdminAdapter } from './adapters/keycloak-admin.adapter';
import { IdentityController } from './identity.controller';

@Module({
  controllers: [IdentityController],
  providers: [
    {
      provide: IdentityPort,
      useFactory: (config: ConfigService) => new KeycloakAdminAdapter(config),
      inject: [ConfigService],
    },
  ],
  exports: [IdentityPort],
})
export class IdentityModule {}
