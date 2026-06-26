import { Global, Module } from '@nestjs/common';
import { Pool } from 'pg';
import { DatabaseService } from './database.service';
import { POSTGRES_POOL } from './database.constants';

@Global()
@Module({
  providers: [
    {
      provide: POSTGRES_POOL,
      useFactory: () => {
        const connectionString = process.env.DATABASE_URL;

        if (!connectionString) {
          throw new Error('DATABASE_URL is required to connect PostgreSQL.');
        }

        return new Pool({ connectionString });
      },
    },
    DatabaseService,
  ],
  exports: [DatabaseService, POSTGRES_POOL],
})
export class DatabaseModule {}
