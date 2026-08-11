import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, Inject } from '@nestjs/common';
import Redis from 'ioredis';
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

  constructor(
    private readonly momentumService: MomentumService,
    @Inject('REDIS_CLIENT') private readonly redis: Redis,
  ) {}

  async handleConnection(client: Socket) {
    LiveScoreGateway.activeClients++;
    this.logger.log(
      `[WebSocket] Client connected: ${client.id}. Total active users: ${LiveScoreGateway.activeClients}`,
    );

    // Initial Live Fixtures Cached delivery on first connect
    try {
      const cached = await this.redis.get('live:fixtures');
      if (cached) {
        const liveFixtures = JSON.parse(cached);
        client.emit('live:fixtures', liveFixtures);
        this.logger.log(`[WebSocket] Sent ${liveFixtures.length} initial cached live matches to client ${client.id}`);
      } else {
        client.emit('live:fixtures', []);
      }
    } catch (err: any) {
      this.logger.error(`[WebSocket] Failed to retrieve cached live matches on connect: ${err.message}`);
      client.emit('live:fixtures', []);
    }
  }

  handleDisconnect(client: Socket) {
    LiveScoreGateway.activeClients = Math.max(
      0,
      LiveScoreGateway.activeClients - 1,
    );
    this.logger.log(
      `[WebSocket] Client disconnected: ${client.id}. Total active users: ${LiveScoreGateway.activeClients}`,
    );
  }

  broadcastMatchUpdate(updatedMatch: any) {
    this.logger.log(
      `[WebSocket] Broadcasting match update for match ID: ${updatedMatch.id}`,
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

    // 1. Broadcast to general live fixtures stream
    this.server.emit('match:update', updatedMatch);

    // 2. Broadcast to specific subscribed match room
    this.server.to(`match:${updatedMatch.id}`).emit('fixture:update', updatedMatch);
  }

  @SubscribeMessage('subscribe:fixture')
  handleSubscribeFixture(client: Socket, payload: { fixtureId: number }) {
    this.logger.log(`[WebSocket] Client ${client.id} subscribing to specific Match ID ${payload.fixtureId}`);
    client.join(`match:${payload.fixtureId}`);
    return { status: 'subscribed', fixtureId: payload.fixtureId };
  }

  @SubscribeMessage('unsubscribe:fixture')
  handleUnsubscribeFixture(client: Socket, payload: { fixtureId: number }) {
    this.logger.log(`[WebSocket] Client ${client.id} unsubscribing from specific Match ID ${payload.fixtureId}`);
    client.leave(`match:${payload.fixtureId}`);
    return { status: 'unsubscribed', fixtureId: payload.fixtureId };
  }

  @SubscribeMessage('subscribeNews')
  handleSubscribeNews(client: Socket, payload: { articleId: number }) {
    client.join(`news:${payload.articleId}`);
    return { status: 'subscribed' };
  }

  @SubscribeMessage('unsubscribeNews')
  handleUnsubscribeNews(client: Socket, payload: { articleId: number }) {
    client.leave(`news:${payload.articleId}`);
    return { status: 'unsubscribed' };
  }

  broadcastNewComment(articleId: number, commentPayload: any) {
    this.server.to(`news:${articleId}`).emit('newComment', commentPayload);
  }
}
