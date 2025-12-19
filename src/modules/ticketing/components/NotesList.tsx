// src/modules/ticketing/components/NotesList.tsx
// Display and add notes/comments to tickets
'use client';

import React, { useState } from 'react';
import { useUser } from '@clerk/nextjs';
import type { TicketNote } from '../types';

interface NotesListProps {
  ticketId: string;
  notes: TicketNote[];
  onNoteAdded?: () => void;
}

export function NotesList({ ticketId, notes, onNoteAdded }: NotesListProps) {
  const { user } = useUser();
  const [showAddForm, setShowAddForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [content, setContent] = useState('');
  const [isInternal, setIsInternal] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!content.trim()) {
      alert('Please enter a note');
      return;
    }

    try {
      setLoading(true);

      const res = await fetch(`/api/ticketing/tickets/${ticketId}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: content.trim(),
          is_internal: isInternal,
        }),
      });

      const data = await res.json();

      if (data.success) {
        setContent('');
        setIsInternal(false);
        setShowAddForm(false);
        if (onNoteAdded) {
          onNoteAdded();
        } else {
          window.location.reload();
        }
      } else {
        alert(`Failed to add note: ${data.message}`);
      }
    } catch (error) {
      console.error('Failed to add note:', error);
      alert('An error occurred while adding note');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      {/* Add Note Button/Form */}
      {!showAddForm ? (
        <button
          onClick={() => setShowAddForm(true)}
          className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          Add Note / Comment
        </button>
      ) : (
        <form onSubmit={handleSubmit} className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Note Content <span className="text-red-500">*</span>
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={4}
              required
              placeholder="Enter your note or comment..."
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="isInternal"
              checked={isInternal}
              onChange={(e) => setIsInternal(e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="isInternal" className="ml-2 block text-sm text-gray-700">
              Internal Note (only visible to team members)
            </label>
          </div>

          {isInternal && (
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
              <p className="text-sm text-yellow-800">
                🔒 This note will only be visible to internal team members, not customers.
              </p>
            </div>
          )}

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => {
                setShowAddForm(false);
                setContent('');
                setIsInternal(false);
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !content.trim()}
              className={`px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition ${
                loading || !content.trim() ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {loading ? 'Adding...' : 'Add Note'}
            </button>
          </div>
        </form>
      )}

      {/* Notes List */}
      <div className="space-y-3">
        {notes.length === 0 ? (
          <div className="text-center py-8 bg-gray-50 rounded-lg border border-gray-200">
            <p className="text-sm text-gray-500">No notes or comments yet</p>
            <p className="text-xs text-gray-400 mt-1">Be the first to add a note!</p>
          </div>
        ) : (
          notes.map((note) => (
            <div
              key={note.id}
              className={`p-4 rounded-lg border ${
                note.is_internal
                  ? 'bg-yellow-50 border-yellow-200'
                  : 'bg-white border-gray-200'
              }`}
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center text-sm font-semibold text-gray-700">
                    {note.created_by_name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">
                      {note.created_by_name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(note.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>
                {note.is_internal && (
                  <span className="inline-flex px-2 py-1 text-xs font-semibold bg-yellow-200 text-yellow-800 rounded">
                    🔒 Internal
                  </span>
                )}
              </div>

              {/* Content */}
              <div className="text-sm text-gray-800 whitespace-pre-wrap mt-2">
                {note.content}
              </div>

              {/* Edited Indicator */}
              {note.updated_at && note.updated_at !== note.created_at && (
                <p className="text-xs text-gray-400 mt-2">
                  (edited {new Date(note.updated_at).toLocaleString()})
                </p>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
