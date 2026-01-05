/**
 * Asset Module - Server-Side Exports
 *
 * This file exports all server-side code including types, services, utils, and constants.
 * Use this for API routes and backend logic.
 *
 * For client-side (React components), use './client' instead.
 */

// Types - safe for both client and server
export * from './types';

// Constants - safe for both client and server
export * from './constants';

// Services - SERVER ONLY (contains database access)
export * from './services';

// Utils - SERVER ONLY (contains db.ts)
export * from './utils';
