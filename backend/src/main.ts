import * as dotenv from 'dotenv';
import * as path from 'path';

// Load .env defensively from possible relative paths in development and built structures
dotenv.config({ path: path.resolve(__dirname, '../../../.env') }); // monorepo root from built dist/
dotenv.config({ path: path.resolve(__dirname, '../../.env') });  // monorepo root from src/
dotenv.config({ path: path.resolve(__dirname, '../.env') });   // current workspace folder
dotenv.config();                                                 // active runtime working directory

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors();
  await app.listen(process.env.PORT ?? 3001);
}
bootstrap();
