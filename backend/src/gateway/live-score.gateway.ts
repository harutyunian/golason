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

  constructor(private readonly momentumService: MomentumService) {}

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
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
