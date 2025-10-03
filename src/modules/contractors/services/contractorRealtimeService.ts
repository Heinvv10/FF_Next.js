/**
 * Contractors Real-time Service
 * Provides real-time functionality specifically for the contractors module
 */

import { useEffect, useRef, useCallback } from 'react';
import { socketIOAdapter } from '@/services/realtime/socketIOAdapter';
import { pollingAdapter } from '@/services/realtime/pollingAdapter';
import { log } from '@/lib/logger';
import type { RealtimeEvent } from '@/services/realtime/websocketService';

export type ContractorEventType =
  | 'contractor_added'
  | 'contractor_updated'
  | 'contractor_deleted'
  | 'document_uploaded'
  | 'document_verified'
  | 'document_rejected'
  | 'application_submitted'
  | 'application_approved'
  | 'application_rejected'
  | 'rating_updated'
  | 'performance_updated';

export interface ContractorRealtimeEvent extends RealtimeEvent {
  eventType: ContractorEventType;
  entityType: 'contractor' | 'document' | 'application' | 'rating' | 'performance';
  entityId: string;
  data: any;
  userId?: string;
}

export interface ContractorRealtimeConfig {
  mode?: 'websocket' | 'polling' | 'auto';
  clientId?: string;
  enableLogging?: boolean;
}

class ContractorRealtimeService {
  private config: ContractorRealtimeConfig;
  private subscribers = new Map<string, Set<(event: ContractorRealtimeEvent) => void>>();
  private isInitialized = false;

  constructor(config: ContractorRealtimeConfig = {}) {
    this.config = {
      mode: 'auto',
      clientId: `contractor_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      enableLogging: true,
      ...config
    };
  }

  /**
   * Initialize the real-time service
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      const adapter = this.config.mode === 'polling'
        ? pollingAdapter
        : socketIOAdapter;

      // Set up global event listeners
      adapter.on('connected', () => {
        this.log('Real-time service connected', { mode: this.config.mode });
      });

      adapter.on('disconnected', () => {
        this.log('Real-time service disconnected', { mode: this.config.mode });
      });

      adapter.on('error', (error) => {
        this.log('Real-time service error', { error, mode: this.config.mode });
      });

      adapter.on('event', (event: RealtimeEvent) => {
        this.handleEvent(event);
      });

      // Connect the adapter
      if (adapter === socketIOAdapter) {
        await adapter.connect();
      } else {
        adapter.start();
      }

      this.isInitialized = true;
      this.log('Contractor real-time service initialized', { config: this.config });

    } catch (error) {
      this.log('Failed to initialize contractor real-time service', { error });
      throw error;
    }
  }

  /**
   * Subscribe to contractor-related events
   */
  subscribeToContractor(
    contractorId: string,
    callback: (event: ContractorRealtimeEvent) => void
  ): () => void {
    const adapter = this.getCurrentAdapter();
    const key = `contractor:${contractorId}`;

    // Store local subscriber
    if (!this.subscribers.has(key)) {
      this.subscribers.set(key, new Set());
    }
    this.subscribers.get(key)!.add(callback);

    // Subscribe to adapter
    const unsubscribe = adapter.subscribe('contractor', contractorId, (event) => {
      this.handleEvent(event);
    });

    this.log('Subscribed to contractor events', { contractorId });

    // Return combined unsubscribe function
    return () => {
      unsubscribe();
      const subs = this.subscribers.get(key);
      if (subs) {
        subs.delete(callback);
        if (subs.size === 0) {
          this.subscribers.delete(key);
        }
      }
      this.log('Unsubscribed from contractor events', { contractorId });
    };
  }

  /**
   * Subscribe to all contractor events
   */
  subscribeToAllContractors(
    callback: (event: ContractorRealtimeEvent) => void
  ): () => void {
    const adapter = this.getCurrentAdapter();
    const key = 'contractor:*';

    // Store local subscriber
    if (!this.subscribers.has(key)) {
      this.subscribers.set(key, new Set());
    }
    this.subscribers.get(key)!.add(callback);

    // Subscribe to adapter
    const unsubscribe = adapter.subscribeToAll('contractor', (event) => {
      this.handleEvent(event);
    });

    this.log('Subscribed to all contractor events');

    // Return combined unsubscribe function
    return () => {
      unsubscribe();
      const subs = this.subscribers.get(key);
      if (subs) {
        subs.delete(callback);
        if (subs.size === 0) {
          this.subscribers.delete(key);
        }
      }
      this.log('Unsubscribed from all contractor events');
    };
  }

  /**
   * Subscribe to document events for a contractor
   */
  subscribeToContractorDocuments(
    contractorId: string,
    callback: (event: ContractorRealtimeEvent) => void
  ): () => void {
    return this.subscribeToContractor(contractorId, (event) => {
      if (event.entityType === 'document') {
        callback(event);
      }
    });
  }

  /**
   * Subscribe to application events for a contractor
   */
  subscribeToContractorApplications(
    contractorId: string,
    callback: (event: ContractorRealtimeEvent) => void
  ): () => void {
    return this.subscribeToContractor(contractorId, (event) => {
      if (event.entityType === 'application') {
        callback(event);
      }
    });
  }

  /**
   * Broadcast a contractor event (for manual triggering)
   */
  broadcastContractorEvent(event: {
    eventType: ContractorEventType;
    entityType: 'contractor' | 'document' | 'application' | 'rating' | 'performance';
    entityId: string;
    data: any;
  }): void {
    const adapter = this.getCurrentAdapter();

    if ('broadcastChange' in adapter) {
      adapter.broadcastChange(event);
    } else {
      // For polling adapter, we could store the event in a temporary cache
      this.log('Event broadcasted (polling mode)', { event });
    }
  }

  /**
   * Get current adapter based on configuration
   */
  private getCurrentAdapter() {
    if (this.config.mode === 'polling') {
      return pollingAdapter;
    } else {
      return socketIOAdapter;
    }
  }

  /**
   * Handle incoming events and convert to contractor-specific format
   */
  private handleEvent(event: RealtimeEvent): void {
    // Convert to contractor-specific event
    const contractorEvent: ContractorRealtimeEvent = {
      ...event,
      eventType: this.mapToContractorEventType(event),
      entityType: event.entityType as any,
      data: event.data
    };

    // Notify relevant subscribers
    this.notifySubscribers(contractorEvent);

    this.log('Contractor event handled', { event: contractorEvent });
  }

  /**
   * Map generic events to contractor-specific events
   */
  private mapToContractorEventType(event: RealtimeEvent): ContractorEventType {
    switch (event.entityType) {
      case 'contractor':
        if (event.type === 'added') return 'contractor_added';
        if (event.type === 'modified') return 'contractor_updated';
        if (event.type === 'removed') return 'contractor_deleted';
        break;

      case 'document':
        if (event.type === 'added') return 'document_uploaded';
        if (event.type === 'modified') {
          const status = event.data?.verificationStatus;
          if (status === 'verified') return 'document_verified';
          if (status === 'rejected') return 'document_rejected';
        }
        break;

      case 'application':
        if (event.type === 'added') return 'application_submitted';
        if (event.type === 'modified') {
          const status = event.data?.status;
          if (status === 'approved') return 'application_approved';
          if (status === 'rejected') return 'application_rejected';
        }
        break;

      case 'rating':
        return 'rating_updated';

      case 'performance':
        return 'performance_updated';
    }

    // Default to generic contractor update
    return 'contractor_updated' as ContractorEventType;
  }

  /**
   * Notify subscribers of an event
   */
  private notifySubscribers(event: ContractorRealtimeEvent): void {
    // Notify specific entity subscribers
    const specificKey = `${event.entityType}:${event.entityId}`;
    const specificSubs = this.subscribers.get(specificKey);
    if (specificSubs) {
      specificSubs.forEach(callback => callback(event));
    }

    // Notify wildcard subscribers
    const wildcardKey = `${event.entityType}:*`;
    const wildcardSubs = this.subscribers.get(wildcardKey);
    if (wildcardSubs) {
      wildcardSubs.forEach(callback => callback(event));
    }
  }

  /**
   * Check if service is connected
   */
  isConnected(): boolean {
    const adapter = this.getCurrentAdapter();

    if ('isConnected' in adapter) {
      return adapter.isConnected();
    } else if ('isActive' in adapter) {
      return adapter.isActive();
    }

    return false;
  }

  /**
   * Get connection mode
   */
  getConnectionMode(): 'websocket' | 'polling' {
    return this.config.mode === 'websocket' ? 'websocket' : 'polling';
  }

  /**
   * Log messages if logging is enabled
   */
  private log(message: string, data: any = {}): void {
    if (this.config.enableLogging) {
      log.info(`[ContractorRealtime] ${message}`, data, 'ContractorRealtimeService');
    }
  }

  /**
   * Cleanup and disconnect
   */
  cleanup(): void {
    try {
      socketIOAdapter.disconnect();
      pollingAdapter.stop();
      this.subscribers.clear();
      this.isInitialized = false;
      this.log('Contractor real-time service cleaned up');
    } catch (error) {
      this.log('Error during cleanup', { error });
    }
  }
}

// Export singleton instance
export const contractorRealtimeService = new ContractorRealtimeService();

// Export React hooks for easy usage
export function useContractorRealtime(config?: ContractorRealtimeConfig) {
  const serviceRef = useRef(contractorRealtimeService);

  // Initialize on mount
  useEffect(() => {
    const service = serviceRef.current;

    if (config) {
      // Update config if provided
      Object.assign(service.config, config);
    }

    service.initialize();

    return () => {
      // Cleanup on unmount
      service.cleanup();
    };
  }, [config]);

  // Subscribe to contractor events
  const subscribeToContractor = useCallback((
    contractorId: string,
    callback: (event: ContractorRealtimeEvent) => void
  ) => {
    return serviceRef.current.subscribeToContractor(contractorId, callback);
  }, []);

  // Subscribe to all contractor events
  const subscribeToAllContractors = useCallback((
    callback: (event: ContractorRealtimeEvent) => void
  ) => {
    return serviceRef.current.subscribeToAllContractors(callback);
  }, []);

  // Subscribe to document events
  const subscribeToContractorDocuments = useCallback((
    contractorId: string,
    callback: (event: ContractorRealtimeEvent) => void
  ) => {
    return serviceRef.current.subscribeToContractorDocuments(contractorId, callback);
  }, []);

  // Subscribe to application events
  const subscribeToContractorApplications = useCallback((
    contractorId: string,
    callback: (event: ContractorRealtimeEvent) => void
  ) => {
    return serviceRef.current.subscribeToContractorApplications(contractorId, callback);
  }, []);

  // Broadcast event
  const broadcastEvent = useCallback((
    event: {
      eventType: ContractorEventType;
      entityType: 'contractor' | 'document' | 'application' | 'rating' | 'performance';
      entityId: string;
      data: any;
    }
  ) => {
    serviceRef.current.broadcastContractorEvent(event);
  }, []);

  // Check connection status
  const isConnected = useCallback(() => {
    return serviceRef.current.isConnected();
  }, []);

  const getConnectionMode = useCallback(() => {
    return serviceRef.current.getConnectionMode();
  }, []);

  return {
    subscribeToContractor,
    subscribeToAllContractors,
    subscribeToContractorDocuments,
    subscribeToContractorApplications,
    broadcastEvent,
    isConnected,
    getConnectionMode
  };
}