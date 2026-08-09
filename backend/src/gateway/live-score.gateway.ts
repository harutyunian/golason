import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { MomentumService } from '../sports/momentum.service';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class LiveScoreGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(LiveScoreGateway.name);

  // Static tracking for active connected browser sessions to optimize background cron jobs
  static activeClients = 0;

  constructor(private readonly momentumService: MomentumService) {}

  handleConnection(client: Socket) {
    LiveScoreGateway.activeClients++;
    this.logger.log(
      `Client connected: ${client.id}. Total active users: ${LiveScoreGateway.activeClients}`,
    );
  }

  handleDisconnect(client: Socket) {
    LiveScoreGateway.activeClients = Math.max(
      0,
      LiveScoreGateway.activeClients - 1,
    );
    this.logger.log(
      `Client disconnected: ${client.id}. Total active users: ${LiveScoreGateway.activeClients}`,
    );
  }

  broadcastMatchUpdate(updatedMatch: any) {
    this.logger.log(
      `Broadcasting match update for match ID: ${updatedMatch.id}`,
    );

    // Calculate real-time momentum points before broadcasting to WebSockets
    try {
      const homePossession = updatedMatch.stats?.home?.possessionPercent || 50;
      updatedMatch.momentum = {
        points: this.momentumService.calculateMomentum(
          updatedMatch.elapsedTime || 0,
          updatedMatch.events || [],
          homePossession,
        )
      };
    } catch (err: any) {
      this.logger.error(
        `Failed to append momentum during real-time broadcast: ${err.message}`,
      );
    }

    this.server.emit('match:update', updatedMatch);
  }
}
