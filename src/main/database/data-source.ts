import 'reflect-metadata'
import * as dotenv from 'dotenv'
dotenv.config()
import path from 'path'
import { DataSource } from 'typeorm'
// No auto-create DB; expect existing database

const isTsRuntime = __filename.endsWith('.ts')
const entitiesGlob = isTsRuntime
  ? ['src/main/database/entities/*.ts']
  : [path.join(__dirname, 'entities/*.{js,cjs}')]
const migrationsGlob = isTsRuntime
  ? ['src/main/database/migrations/*.ts']
  : [path.join(__dirname, 'migrations/*.{js,cjs}')]

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT || 5432),
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  entities: entitiesGlob,
  migrations: migrationsGlob,
  synchronize: false,
  logging: false
})

export async function createConnection(): Promise<DataSource> {
  await AppDataSource.initialize()

  return AppDataSource
}
