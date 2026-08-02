import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { FootballController } from './sports/football.controller';
import { LiveScoreGateway } from './gateway/live-score.gateway';
import { ApiFootballClientService } from './sports/api-football-client.service';

@Module({
  imports: [],
  controllers: [AppController, FootballController],
  providers: [AppService, LiveScoreGateway, ApiFootballClientService],
})
export class AppModule {}
