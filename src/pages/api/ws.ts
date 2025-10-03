/**
 * WebSocket Server API
 * Handles real-time WebSocket connections for contractors module
 * API Route: /api/ws
 */

import { Server as ServerIO } from 'socket.io';
import { Server as NetServer } from 'http';
import { NextApiRequest, NextApiResponse } from 'next';
import { requireAuth } from '@/lib/auth';
import { log } from '@/lib/logger';

export type NextApiResponseWithSocket = NextApiResponse & {
  socket: {
    server: NetServer & {
      io?: ServerIO;
    };
  };
};

interface AuthenticatedSocket extends ServerIO.Socket {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

// Store active connections
const activeConnections = new Map<string, Set<string>>();

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponseWithSocket
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get the Socket.IO server instance or create one
    if (!res.socket.server.io) {
      log.info('Initializing Socket.IO server', {}, 'WebSocketAPI');

      const io = new ServerIO(res.socket.server, {
        path: '/api/ws',
        cors: {
          origin: process.env.NODE_ENV === 'production'
            ? process.env.NEXT_PUBLIC_APP_URL
            : 'http://localhost:3005',
          methods: ['GET', 'POST'],
          credentials: true
        },
        transports: ['websocket', 'polling'],
        pingTimeout: 60000,
        pingInterval: 25000
      });

      // Store server instance
      res.socket.server.io = io;

      // Authentication middleware
      io.use(async (socket: AuthenticatedSocket, next) => {
        try {
          // Extract token from handshake
          const token = socket.handshake.auth.token ||
                        socket.handshake.headers.authorization?.replace('Bearer ', '');

          if (!token) {
            return next(new Error('Authentication required'));
          }

          // For now, use a simple authentication check
          // In production, you would validate the token with your auth system
          socket.user = {
            id: socket.handshake.auth.userId || 'anonymous',
            email: socket.handshake.auth.email || 'anonymous@example.com',
            role: socket.handshake.auth.role || 'user'
          };

          log.info('Socket authenticated', {
            userId: socket.user.id,
            socketId: socket.id
          }, 'WebSocketAPI');

          next();
        } catch (error) {
          log.error('Socket authentication failed', {
            error: error instanceof Error ? error.message : 'Unknown error',
            socketId: socket.id
          }, 'WebSocketAPI');
          next(new Error('Authentication failed'));
        }
      });

      // Connection handler
      io.on('connection', (socket: AuthenticatedSocket) => {
        const userId = socket.user?.id || 'anonymous';

        log.info('Socket connected', {
          userId,
          socketId: socket.id,
          transport: socket.conn.transport.name
        }, 'WebSocketAPI');

        // Track active connections
        if (!activeConnections.has(userId)) {
          activeConnections.set(userId, new Set());
        }
        activeConnections.get(userId)!.add(socket.id);

        // Join user-specific room
        socket.join(`user:${userId}`);

        // Handle subscription requests
        socket.on('subscribe', (data) => {
          try {
            const { entityType, entityId } = data;
            const room = `${entityType}:${entityId}`;

            socket.join(room);
            log.info('Socket subscribed', {
              userId,
              socketId: socket.id,
              entityType,
              entityId
            }, 'WebSocketAPI');

            // Send acknowledgment
            socket.emit('subscribed', { entityType, entityId });
          } catch (error) {
            log.error('Subscription failed', {
              error: error instanceof Error ? error.message : 'Unknown error',
              data,
              userId,
              socketId: socket.id
            }, 'WebSocketAPI');

            socket.emit('subscription_error', {
              error: 'Failed to subscribe'
            });
          }
        });

        // Handle unsubscription requests
        socket.on('unsubscribe', (data) => {
          try {
            const { entityType, entityId } = data;
            const room = `${entityType}:${entityId}`;

            socket.leave(room);
            log.info('Socket unsubscribed', {
              userId,
              socketId: socket.id,
              entityType,
              entityId
            }, 'WebSocketAPI');

            // Send acknowledgment
            socket.emit('unsubscribed', { entityType, entityId });
          } catch (error) {
            log.error('Unsubscription failed', {
              error: error instanceof Error ? error.message : 'Unknown error',
              data,
              userId,
              socketId: socket.id
            }, 'WebSocketAPI');
          }
        });

        // Handle heartbeat/ping
        socket.on('ping', () => {
          socket.emit('pong');
        });

        // Handle manual broadcast change (for testing)
        socket.on('broadcast_change', (data) => {
          try {
            const { eventType, entityType, entityId, data: eventData } = data;
            const room = `${entityType}:${entityId}`;

            // Broadcast to all clients in the room except sender
            socket.to(room).emit('entity_change', {
              eventType,
              entityType,
              entityId,
              data: eventData,
              timestamp: new Date().toISOString(),
              triggeredBy: userId
            });

            log.info('Change broadcasted', {
              userId,
              socketId: socket.id,
              eventType,
              entityType,
              entityId
            }, 'WebSocketAPI');
          } catch (error) {
            log.error('Broadcast failed', {
              error: error instanceof Error ? error.message : 'Unknown error',
              data,
              userId,
              socketId: socket.id
            }, 'WebSocketAPI');
          }
        });

        // Handle disconnection
        socket.on('disconnect', (reason) => {
          log.info('Socket disconnected', {
            userId,
            socketId: socket.id,
            reason
          }, 'WebSocketAPI');

          // Remove from active connections
          const userConnections = activeConnections.get(userId);
          if (userConnections) {
            userConnections.delete(socket.id);
            if (userConnections.size === 0) {
              activeConnections.delete(userId);
            }
          }
        });

        // Send welcome message with initial state
        socket.emit('connected', {
          message: 'WebSocket connection established',
          userId,
          socketId: socket.id,
          timestamp: new Date().toISOString()
        });

        // Example: Send some initial data for contractors
        socket.emit('initial_data', {
          entityType: 'contractor',
          entityId: '*',
          data: {
            message: 'Contractors real-time updates enabled',
            activeConnections: activeConnections.size
          }
        });
      });

      log.info('Socket.IO server initialized successfully', {}, 'WebSocketAPI');
    }

    res.status(200).json({
      success: true,
      message: 'WebSocket server is running',
      path: '/api/ws'
    });

  } catch (error) {
    log.error('Failed to initialize WebSocket server', {
      error: error instanceof Error ? error.message : 'Unknown error'
    }, 'WebSocketAPI');

    res.status(500).json({
      error: 'Failed to initialize WebSocket server',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

// Helper function to broadcast events to specific rooms
export function broadcastToRoom(
  io: ServerIO,
  room: string,
  event: {
    eventType: 'added' | 'modified' | 'removed';
    entityType: string;
    entityId: string;
    data: any;
  }
): void {
  io.to(room).emit('entity_change', {
    ...event,
    timestamp: new Date().toISOString()
  });
}

// Helper function to get connection stats
export function getConnectionStats() {
  return {
    totalUsers: activeConnections.size,
    totalConnections: Array.from(activeConnections.values()).reduce((sum, connections) => sum + connections.size, 0),
    userConnections: Object.fromEntries(
      Array.from(activeConnections.entries()).map(([userId, connections]) => [
        userId,
        connections.size
      ])
    )
  };
}