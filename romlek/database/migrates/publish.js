'use strict';

const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const connectionString =
  process.env.DATABASE_URL ||
  'postgresql://postgres:senghong@localhost:2050/romlek';

const alreadyExistsErrorCodes = new Set([
  '42P07', // duplicate_table
  '42701', // duplicate_column
  '42710', // duplicate_object
]);

const migrationOrder = new Map([
  ['users.sql', 1],
  ['trips.sql', 2],
  ['location.sql', 3],
]);

async function runMigrations() {
  const client = new Client({
    connectionString,
  });
  const failedMigrations = [];

  try {
    await client.connect();
    console.log('Connected to the database.');

    const migrationsDir = path.join(__dirname, '../tables');
    const migrationFiles = fs
      .readdirSync(migrationsDir)
      .filter((file) => file.endsWith('.sql'))
      .sort(
        (a, b) =>
          (migrationOrder.get(a) ?? Number.MAX_SAFE_INTEGER) -
            (migrationOrder.get(b) ?? Number.MAX_SAFE_INTEGER) ||
          a.localeCompare(b),
      );

    for (const file of migrationFiles) {
      const filePath = path.join(migrationsDir, file);
      const sql = fs.readFileSync(filePath, 'utf-8');

      try {
        await client.query(sql);
        console.log(`Executed migration: ${file}`);
      } catch (error) {
        if (alreadyExistsErrorCodes.has(error.code)) {
          console.log(`Skipped existing migration: ${file} (${error.message})`);
          continue;
        }

        failedMigrations.push({ file, error });
        console.error(`Failed migration: ${file}`, error.message);
      }
    }

    if (failedMigrations.length > 0) {
      process.exitCode = 1;
      console.error(`${failedMigrations.length} migration(s) failed.`);
      return;
    }

    console.log('All migrations checked successfully.');
  } catch (error) {
    console.error('Error executing migrations:', error);
    process.exitCode = 1;
  } finally {
    await client.end();
    console.log('Database connection closed.');
  }
}

runMigrations();
