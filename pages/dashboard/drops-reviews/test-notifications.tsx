'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { Bell, Send, AlertCircle, CheckCircle, RefreshCw } from 'lucide-react';

const TestNotificationsPage: React.FC = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [testResults, setTestResults] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const testWhatsAppNotification = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/drops/notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          submission_id: 'test-submission-id',
          drop_id: 'test-drop-id',
          contractor_id: 'test-contractor-id',
          status: 'needs-rectification',
          feedback: 'Test feedback: Missing steps 1, 3, and 7. Please rectify and resubmit.',
          missing_steps: [1, 3, 7],
          reviewed_by: 'Test Agent'
        })
      });

      const result = await response.json();
      setTestResults(result);

      if (!response.ok) {
        setError(result.error || 'Failed to send test notification');
      }
    } catch (err) {
      setError('Network error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const testBrowserNotification = async () => {
    try {
      setLoading(true);
      setError(null);

      // Test browser notification directly
      if ('Notification' in window) {
        if (Notification.permission === 'default') {
          await Notification.requestPermission();
        }

        if (Notification.permission === 'granted') {
          new Notification('DROPS Quality Control Test', {
            body: 'Test: Drop TEST001 needs rectification for missing steps 1, 3, and 7.',
            icon: '/favicon.ico',
            badge: '/favicon.ico',
            tag: 'drops-test',
            requireInteraction: true,
            actions: [
              {
                action: 'view',
                title: 'View Details'
              }
            ]
          });
          setTestResults({ success: true, message: 'Browser notification test completed' });
        } else {
          setError('Browser notification permission denied');
        }
      } else {
        setError('Browser notifications not supported');
      }
    } catch (err) {
      setError('Error testing browser notification: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const testSystemEndpoint = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/drops/notifications');
      const result = await response.json();
      setTestResults(result);

      if (!response.ok) {
        setError(result.error || 'Failed to test system');
      }
    } catch (err) {
      setError('Network error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">DROPS Notification Testing</h1>
              <p className="text-gray-600 mt-2">
                Test the notification system for DROPS quality control
              </p>
            </div>
            <button
              onClick={() => router.back()}
              className="text-blue-600 hover:text-blue-800"
            >
              ← Back to Dashboard
            </button>
          </div>
        </div>

        {/* Test Options */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center space-x-3 mb-4">
              <Bell className="w-6 h-6 text-green-600" />
              <h3 className="text-lg font-semibold text-gray-900">WhatsApp Notifications</h3>
            </div>
            <p className="text-gray-600 mb-4">
              Test WhatsApp notifications for contractors when reviews are submitted
            </p>
            <button
              onClick={testWhatsAppNotification}
              disabled={loading}
              className="w-full bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              {loading ? <RefreshCw className="w-4 h-4 animate-spin mx-auto" /> : 'Test WhatsApp'}
            </button>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center space-x-3 mb-4">
              <Bell className="w-6 h-6 text-blue-600" />
              <h3 className="text-lg font-semibold text-gray-900">Browser Notifications</h3>
            </div>
            <p className="text-gray-600 mb-4">
              Test browser notifications for real-time updates
            </p>
            <button
              onClick={testBrowserNotification}
              disabled={loading}
              className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? <RefreshCw className="w-4 h-4 animate-spin mx-auto" /> : 'Test Browser'}
            </button>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center space-x-3 mb-4">
              <RefreshCw className="w-6 h-6 text-purple-600" />
              <h3 className="text-lg font-semibold text-gray-900">System Test</h3>
            </div>
            <p className="text-gray-600 mb-4">
              Test the complete notification system health
            </p>
            <button
              onClick={testSystemEndpoint}
              disabled={loading}
              className="w-full bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 disabled:opacity-50"
            >
              {loading ? <RefreshCw className="w-4 h-4 animate-spin mx-auto" /> : 'Test System'}
            </button>
          </div>
        </div>

        {/* Results */}
        {testResults && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <div className="flex items-center space-x-3 mb-4">
              <CheckCircle className="w-6 h-6 text-green-600" />
              <h3 className="text-lg font-semibold text-gray-900">Test Results</h3>
            </div>
            <pre className="bg-gray-100 p-4 rounded-lg overflow-auto text-sm">
              {JSON.stringify(testResults, null, 2)}
            </pre>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <div className="flex items-center space-x-3 mb-4">
              <AlertCircle className="w-6 h-6 text-red-600" />
              <h3 className="text-lg font-semibold text-red-900">Error</h3>
            </div>
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Configuration Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-4">Configuration Requirements</h3>
          <div className="space-y-3">
            <div>
              <h4 className="font-medium text-blue-800">Twilio WhatsApp</h4>
              <p className="text-blue-700 text-sm">
                Ensure TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_PHONE_NUMBER are configured
              </p>
            </div>
            <div>
              <h4 className="font-medium text-blue-800">Pusher Browser Notifications</h4>
              <p className="text-blue-700 text-sm">
                Ensure NEXT_PUBLIC_PUSHER_APP_KEY and NEXT_PUBLIC_PUSHER_CLUSTER are configured
              </p>
            </div>
            <div>
              <h4 className="font-medium text-blue-800">Database</h4>
              <p className="text-blue-700 text-sm">
                notification_logs table should be created and accessible
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestNotificationsPage;