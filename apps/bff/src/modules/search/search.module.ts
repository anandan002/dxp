import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SearchPort } from './ports/search.port';
import { PostgresFtsAdapter } from './adapters/postgres-fts.adapter';
import { SearchController } from './search.controller';

@Module({
  controllers: [SearchController],
  providers: [
    {
      provide: SearchPort,
      useFactory: (config: ConfigService) => new PostgresFtsAdapter(config),
      inject: [ConfigService],
    },
  ],
  exports: [SearchPort],
})
export class SearchModule {}
