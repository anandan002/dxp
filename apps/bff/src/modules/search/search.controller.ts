import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { SearchPort } from './ports/search.port';

@ApiTags('search')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('search')
export class SearchController {
  constructor(private readonly search: SearchPort) {}

  @Get()
  @ApiOperation({ summary: 'Full-text search across a table' })
  query(
    @Query('table') table: string,
    @Query('q') term: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    return this.search.search({
      table,
      term,
      page: page ? parseInt(page) : 1,
      pageSize: pageSize ? parseInt(pageSize) : 20,
    });
  }

  @Get('suggest')
  @ApiOperation({ summary: 'Autocomplete suggestions' })
  suggest(@Query('table') table: string, @Query('q') term: string) {
    return this.search.suggest(table, term);
  }
}
