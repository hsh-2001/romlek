import { Inject, Injectable, OnModuleDestroy } from '@nestjs/common';
import { Pool, QueryConfig, QueryResult, QueryResultRow } from 'pg';
import { POSTGRES_POOL } from './database.constants';

@Injectable()
export class DatabaseService implements OnModuleDestroy {
  constructor(@Inject(POSTGRES_POOL) private readonly pool: Pool) {}

  query<T extends QueryResultRow = QueryResultRow>(
    text: string,
    params?: unknown[],
  ): Promise<QueryResult<T>> {
    const queryConfig: QueryConfig<unknown[]> = {
      text,
      values: params,
    };

    return this.pool.query<T, unknown[]>(queryConfig);
  }

  async onModuleDestroy() {
    await this.pool.end();
  }
}
