import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { FootballController } from './sports/football.controller';

@Module({
  imports: [],
  controllers: [AppController, FootballController],
  providers: [AppService],
})
export class AppModule {}
