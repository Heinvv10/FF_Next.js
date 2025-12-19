// tests/api/ticketing/notes.test.ts
// Integration tests for ticket notes/comments API
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createMocks } from 'node-mocks-http';
import handler from '../../../pages/api/ticketing/tickets-notes';
import { getAuth } from '@clerk/nextjs/server';
import { mockSql } from '../../../vitest.setup';

// Mock dependencies
vi.mock('@clerk/nextjs/server');

describe('Ticket Notes API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSql.mockReset();
    mockSql.mockResolvedValue([]);
  });

  describe('Authentication', () => {
    it('should reject unauthenticated requests', async () => {
      (getAuth as any).mockReturnValueOnce({ userId: null });

      const { req, res } = createMocks({
        method: 'GET',
        query: { ticket_id: 'TICK-001' },
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(401);
      expect(JSON.parse(res._getData())).toMatchObject({
        success: false,
        error: { code: 'UNAUTHORIZED' },
      });
    });

    it('should accept authenticated requests', async () => {
      (getAuth as any).mockReturnValueOnce({ userId: 'user_123' });

      mockSql.mockResolvedValueOnce([]);

      const { req, res } = createMocks({
        method: 'GET',
        query: { ticket_id: 'TICK-001' },
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(200);
    });
  });

  describe('GET /api/ticketing/[ticketId]/notes (List Notes)', () => {
    beforeEach(() => {
      (getAuth as any).mockReturnValue({ userId: 'user_123' });
    });

    it('should return all notes for a ticket', async () => {
      const mockNotes = [
        {
          id: 'note_1',
          ticket_id: 'TICK-001',
          content: 'First note',
          created_by: 'user_123',
          created_at: '2025-01-15T10:00:00Z',
        },
        {
          id: 'note_2',
          ticket_id: 'TICK-001',
          content: 'Second note',
          created_by: 'user_456',
          created_at: '2025-01-15T11:00:00Z',
        },
      ];

      mockSql.mockResolvedValueOnce(mockNotes);

      const { req, res } = createMocks({
        method: 'GET',
        query: { ticket_id: 'TICK-001' },
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(200);
      const data = JSON.parse(res._getData()).data;
      expect(data.notes).toHaveLength(2);
    });

    it('should return notes in chronological order', async () => {
      const mockNotes = [
        {
          id: 'note_1',
          created_at: '2025-01-15T10:00:00Z',
        },
        {
          id: 'note_2',
          created_at: '2025-01-15T11:00:00Z',
        },
      ];

      mockSql.mockResolvedValueOnce(mockNotes);

      const { req, res } = createMocks({
        method: 'GET',
        query: { ticket_id: 'TICK-001' },
      });

      await handler(req, res);

      const data = JSON.parse(res._getData()).data;
      expect(data.notes[0].created_at).toBe('2025-01-15T10:00:00Z');
    });

    it('should include author information', async () => {
      const mockNotes = [
        {
          id: 'note_1',
          created_by: 'user_123',
          author_name: 'John Doe',
          author_email: 'john@example.com',
        },
      ];

      mockSql.mockResolvedValueOnce(mockNotes);

      const { req, res } = createMocks({
        method: 'GET',
        query: { ticket_id: 'TICK-001' },
      });

      await handler(req, res);

      const data = JSON.parse(res._getData()).data;
      expect(data.notes[0]).toHaveProperty('author_name', 'John Doe');
    });

    it('should return empty array for ticket without notes', async () => {
      mockSql.mockResolvedValueOnce([]);

      const { req, res } = createMocks({
        method: 'GET',
        query: { ticket_id: 'TICK-001' },
      });

      await handler(req, res);

      const data = JSON.parse(res._getData()).data;
      expect(data.notes).toEqual([]);
    });

    it('should handle invalid ticket ID', async () => {
      mockSql.mockResolvedValueOnce([]);

      const { req, res } = createMocks({
        method: 'GET',
        query: { ticket_id: 'INVALID' },
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(404);
    });
  });

  describe('POST /api/ticketing/[ticketId]/notes (Create Note)', () => {
    beforeEach(() => {
      (getAuth as any).mockReturnValue({ userId: 'user_123' });
    });

    it('should create a new note', async () => {
      const mockNote = {
        id: 'note_123',
        ticket_id: 'TICK-001',
        content: 'This is a new note',
        created_by: 'user_123',
        created_at: new Date().toISOString(),
      };

      mockSql.mockResolvedValueOnce([mockNote]);

      const { req, res } = createMocks({
        method: 'POST',
        query: { ticket_id: 'TICK-001' },
        body: {
          content: 'This is a new note',
        },
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(201);
      const data = JSON.parse(res._getData()).data;
      expect(data.id).toBe('note_123');
    });

    it('should require content', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        query: { ticket_id: 'TICK-001' },
        body: {},
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(400);
      expect(JSON.parse(res._getData())).toMatchObject({
        success: false,
        error: expect.objectContaining({ message: expect.stringContaining('content') }),
      });
    });

    it('should reject empty content', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        query: { ticket_id: 'TICK-001' },
        body: {
          content: '',
        },
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(400);
    });

    it('should trim whitespace from content', async () => {
      const mockNote = {
        id: 'note_123',
        content: 'Trimmed content',
      };

      mockSql.mockResolvedValueOnce([mockNote]);

      const { req, res } = createMocks({
        method: 'POST',
        query: { ticket_id: 'TICK-001' },
        body: {
          content: '  Trimmed content  ',
        },
      });

      await handler(req, res);

      const data = JSON.parse(res._getData()).data;
      expect(data.content).toBe('Trimmed content');
    });

    it('should set created_by to current user', async () => {
      const mockNote = {
        id: 'note_123',
        created_by: 'user_123',
      };

      mockSql.mockResolvedValueOnce([mockNote]);

      const { req, res } = createMocks({
        method: 'POST',
        query: { ticket_id: 'TICK-001' },
        body: {
          content: 'Test note',
        },
      });

      await handler(req, res);

      const data = JSON.parse(res._getData()).data;
      expect(data.created_by).toBe('user_123');
    });

    it('should support internal notes', async () => {
      const mockNote = {
        id: 'note_123',
        content: 'Internal note',
        is_internal: true,
      };

      mockSql.mockResolvedValueOnce([mockNote]);

      const { req, res } = createMocks({
        method: 'POST',
        query: { ticket_id: 'TICK-001' },
        body: {
          content: 'Internal note',
          is_internal: true,
        },
      });

      await handler(req, res);

      const data = JSON.parse(res._getData()).data;
      expect(data.is_internal).toBe(true);
    });

    it('should track ticket update timestamp', async () => {
      const mockNote = {
        id: 'note_123',
      };

      mockSql.mockResolvedValueOnce([mockNote]);
      mockSql.mockResolvedValueOnce([]); // Ticket update

      const { req, res } = createMocks({
        method: 'POST',
        query: { ticket_id: 'TICK-001' },
        body: {
          content: 'Test note',
        },
      });

      await handler(req, res);

      expect(mockSql).toHaveBeenCalledTimes(2); // Insert note + Update ticket
    });
  });

  describe('PATCH /api/ticketing/[ticketId]/notes/[noteId] (Update Note)', () => {
    beforeEach(() => {
      (getAuth as any).mockReturnValue({ userId: 'user_123' });
    });

    it('should update note content', async () => {
      const mockNote = {
        id: 'note_123',
        content: 'Updated content',
        created_by: 'user_123',
        updated_at: new Date().toISOString(),
      };

      mockSql.mockResolvedValueOnce([{ created_by: 'user_123' }]); // Check ownership
      mockSql.mockResolvedValueOnce([mockNote]); // Update

      const { req, res } = createMocks({
        method: 'PATCH',
        query: { ticket_id: 'TICK-001', noteId: 'note_123' },
        body: {
          content: 'Updated content',
        },
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(200);
      const data = JSON.parse(res._getData()).data;
      expect(data.content).toBe('Updated content');
    });

    it('should only allow author to edit', async () => {
      mockSql.mockResolvedValueOnce([{ created_by: 'user_456' }]); // Different user

      const { req, res } = createMocks({
        method: 'PATCH',
        query: { ticket_id: 'TICK-001', noteId: 'note_123' },
        body: {
          content: 'Updated content',
        },
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(403);
      expect(JSON.parse(res._getData())).toMatchObject({
        success: false,
        error: { code: 'FORBIDDEN' },
      });
    });

    it('should allow admin to edit any note', async () => {
      (getAuth as any).mockReturnValueOnce({
        userId: 'user_admin',
        sessionClaims: {
          metadata: { role: 'admin' },
        },
      });

      const mockNote = {
        id: 'note_123',
        content: 'Updated by admin',
      };

      mockSql.mockResolvedValueOnce([{ created_by: 'user_456' }]);
      mockSql.mockResolvedValueOnce([mockNote]);

      const { req, res } = createMocks({
        method: 'PATCH',
        query: { ticket_id: 'TICK-001', noteId: 'note_123' },
        body: {
          content: 'Updated by admin',
        },
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(200);
    });

    it('should track edit timestamp', async () => {
      const mockNote = {
        id: 'note_123',
        updated_at: new Date().toISOString(),
      };

      mockSql.mockResolvedValueOnce([{ created_by: 'user_123' }]);
      mockSql.mockResolvedValueOnce([mockNote]);

      const { req, res } = createMocks({
        method: 'PATCH',
        query: { ticket_id: 'TICK-001', noteId: 'note_123' },
        body: {
          content: 'Updated content',
        },
      });

      await handler(req, res);

      const data = JSON.parse(res._getData()).data;
      expect(data.updated_at).toBeDefined();
    });

    it('should handle non-existent note', async () => {
      mockSql.mockResolvedValueOnce([]);

      const { req, res } = createMocks({
        method: 'PATCH',
        query: { ticket_id: 'TICK-001', noteId: 'note_999' },
        body: {
          content: 'Updated content',
        },
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(404);
    });
  });

  describe('DELETE /api/ticketing/[ticketId]/notes/[noteId] (Delete Note)', () => {
    beforeEach(() => {
      (getAuth as any).mockReturnValue({ userId: 'user_123' });
    });

    it('should delete note', async () => {
      mockSql.mockResolvedValueOnce([{ created_by: 'user_123' }]); // Check ownership
      mockSql.mockResolvedValueOnce([]); // Delete

      const { req, res } = createMocks({
        method: 'DELETE',
        query: { ticket_id: 'TICK-001', noteId: 'note_123' },
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(200);
      expect(JSON.parse(res._getData())).toMatchObject({
        success: true,
        message: expect.stringContaining('deleted'),
      });
    });

    it('should only allow author to delete', async () => {
      mockSql.mockResolvedValueOnce([{ created_by: 'user_456' }]);

      const { req, res } = createMocks({
        method: 'DELETE',
        query: { ticket_id: 'TICK-001', noteId: 'note_123' },
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(403);
    });

    it('should allow admin to delete any note', async () => {
      (getAuth as any).mockReturnValueOnce({
        userId: 'user_admin',
        sessionClaims: {
          metadata: { role: 'admin' },
        },
      });

      mockSql.mockResolvedValueOnce([{ created_by: 'user_456' }]);
      mockSql.mockResolvedValueOnce([]);

      const { req, res } = createMocks({
        method: 'DELETE',
        query: { ticket_id: 'TICK-001', noteId: 'note_123' },
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(200);
    });

    it('should handle non-existent note', async () => {
      mockSql.mockResolvedValueOnce([]);

      const { req, res } = createMocks({
        method: 'DELETE',
        query: { ticket_id: 'TICK-001', noteId: 'note_999' },
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(404);
    });

    it('should soft delete by default', async () => {
      mockSql.mockResolvedValueOnce([{ created_by: 'user_123' }]);
      mockSql.mockResolvedValueOnce([
        {
          id: 'note_123',
          deleted: true,
          deleted_at: new Date().toISOString(),
        },
      ]);

      const { req, res } = createMocks({
        method: 'DELETE',
        query: { ticket_id: 'TICK-001', noteId: 'note_123' },
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(200);
    });

    it('should support hard delete with force parameter', async () => {
      (getAuth as any).mockReturnValueOnce({
        userId: 'user_admin',
        sessionClaims: {
          metadata: { role: 'admin' },
        },
      });

      mockSql.mockResolvedValueOnce([{ created_by: 'user_123' }]);
      mockSql.mockResolvedValueOnce([]);

      const { req, res } = createMocks({
        method: 'DELETE',
        query: {
          ticket_id: 'TICK-001',
          noteId: 'note_123',
          force: 'true',
        },
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(200);
    });
  });

  describe('Note Visibility', () => {
    beforeEach(() => {
      (getAuth as any).mockReturnValue({ userId: 'user_123' });
    });

    it('should hide internal notes from non-staff', async () => {
      const mockNotes = [
        {
          id: 'note_1',
          content: 'Public note',
          is_internal: false,
        },
        {
          id: 'note_2',
          content: 'Internal note',
          is_internal: true,
        },
      ];

      mockSql.mockResolvedValueOnce(mockNotes);

      const { req, res } = createMocks({
        method: 'GET',
        query: { ticket_id: 'TICK-001' },
      });

      await handler(req, res);

      const data = JSON.parse(res._getData()).data;
      expect(data.notes).toHaveLength(1);
      expect(data.notes[0].is_internal).toBe(false);
    });

    it('should show internal notes to staff', async () => {
      (getAuth as any).mockReturnValueOnce({
        userId: 'user_staff',
        sessionClaims: {
          metadata: { role: 'staff' },
        },
      });

      const mockNotes = [
        {
          id: 'note_1',
          content: 'Public note',
          is_internal: false,
        },
        {
          id: 'note_2',
          content: 'Internal note',
          is_internal: true,
        },
      ];

      mockSql.mockResolvedValueOnce(mockNotes);

      const { req, res } = createMocks({
        method: 'GET',
        query: { ticket_id: 'TICK-001' },
      });

      await handler(req, res);

      const data = JSON.parse(res._getData()).data;
      expect(data.notes).toHaveLength(2);
    });

    it('should filter by visibility with query parameter', async () => {
      (getAuth as any).mockReturnValueOnce({
        userId: 'user_staff',
        sessionClaims: {
          metadata: { role: 'staff' },
        },
      });

      const mockNotes = [
        {
          id: 'note_1',
          is_internal: true,
        },
      ];

      mockSql.mockResolvedValueOnce(mockNotes);

      const { req, res } = createMocks({
        method: 'GET',
        query: {
          ticket_id: 'TICK-001',
          internal_only: 'true',
        },
      });

      await handler(req, res);

      const data = JSON.parse(res._getData()).data;
      expect(data.notes.every((n: any) => n.is_internal)).toBe(true);
    });
  });

  describe('Note Attachments', () => {
    beforeEach(() => {
      (getAuth as any).mockReturnValue({ userId: 'user_123' });
    });

    it('should support file attachments', async () => {
      const mockNote = {
        id: 'note_123',
        content: 'Note with attachment',
        attachments: [
          {
            id: 'att_1',
            filename: 'screenshot.png',
            url: 'https://storage.example.com/screenshot.png',
          },
        ],
      };

      mockSql.mockResolvedValueOnce([mockNote]);

      const { req, res } = createMocks({
        method: 'POST',
        query: { ticket_id: 'TICK-001' },
        body: {
          content: 'Note with attachment',
          attachments: [
            {
              filename: 'screenshot.png',
              url: 'https://storage.example.com/screenshot.png',
            },
          ],
        },
      });

      await handler(req, res);

      const data = JSON.parse(res._getData()).data;
      expect(data.attachments).toHaveLength(1);
    });

    it('should validate attachment URLs', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        query: { ticket_id: 'TICK-001' },
        body: {
          content: 'Note with invalid attachment',
          attachments: [
            {
              filename: 'file.txt',
              url: 'javascript:alert(1)', // Invalid URL
            },
          ],
        },
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(400);
    });

    it('should limit attachment size', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        query: { ticket_id: 'TICK-001' },
        body: {
          content: 'Note',
          attachments: Array.from({ length: 11 }, (_, i) => ({
            filename: `file_${i}.txt`,
            url: `https://example.com/file_${i}.txt`,
          })),
        },
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(400);
      expect(JSON.parse(res._getData())).toMatchObject({
        success: false,
        error: expect.objectContaining({ message: expect.stringContaining('Maximum 10 attachments') }),
      });
    });
  });

  describe('Note Mentions', () => {
    beforeEach(() => {
      (getAuth as any).mockReturnValue({ userId: 'user_123' });
    });

    it('should parse @mentions in content', async () => {
      const mockNote = {
        id: 'note_123',
        content: 'Hey @user_456, can you check this?',
        mentions: ['user_456'],
      };

      mockSql.mockResolvedValueOnce([mockNote]);

      const { req, res } = createMocks({
        method: 'POST',
        query: { ticket_id: 'TICK-001' },
        body: {
          content: 'Hey @user_456, can you check this?',
        },
      });

      await handler(req, res);

      const data = JSON.parse(res._getData()).data;
      expect(data.mentions).toContain('user_456');
    });

    it('should send notifications to mentioned users', async () => {
      const mockNote = {
        id: 'note_123',
        content: 'Hey @user_456',
        mentions: ['user_456'],
      };

      mockSql.mockResolvedValueOnce([mockNote]);
      mockSql.mockResolvedValueOnce([]); // Notification insert

      const { req, res } = createMocks({
        method: 'POST',
        query: { ticket_id: 'TICK-001' },
        body: {
          content: 'Hey @user_456',
        },
      });

      await handler(req, res);

      expect(mockSql).toHaveBeenCalledTimes(2);
    });
  });

  describe('Error Handling', () => {
    beforeEach(() => {
      (getAuth as any).mockReturnValue({ userId: 'user_123' });
    });

    it('should handle database errors gracefully', async () => {
      mockSql.mockRejectedValueOnce(new Error('Database connection failed'));

      const { req, res } = createMocks({
        method: 'GET',
        query: { ticket_id: 'TICK-001' },
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(500);
      expect(JSON.parse(res._getData())).toMatchObject({
        success: false,
        error: expect.objectContaining({ code: expect.any(String) }),
      });
    });

    it('should log errors for debugging', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      mockSql.mockRejectedValueOnce(new Error('Test error'));

      const { req, res } = createMocks({
        method: 'GET',
        query: { ticket_id: 'TICK-001' },
      });

      await handler(req, res);

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Notes API error:',
        expect.any(Error)
      );

      consoleErrorSpy.mockRestore();
    });
  });

  describe('HTTP Method Validation', () => {
    it('should reject unsupported methods', async () => {
      const { req, res } = createMocks({
        method: 'PUT',
        query: { ticket_id: 'TICK-001' },
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(405);
      expect(JSON.parse(res._getData())).toMatchObject({
        success: false,
        error: { code: 'METHOD_NOT_ALLOWED' },
      });
    });
  });
});
