import { useState } from 'react';
import { usePOSStore } from '@/stores/posStore';
import { useAuth } from '@/contexts/authContext';

export function SessionManager() {
  const { authState } = useAuth();
  const [selectedCustomerID, setSelectedCustomerID] = useState<number | undefined>();
  const [showNewSession, setShowNewSession] = useState(false);

  const {
    currentSessionID,
    getActiveSessions,
    createSession,
    switchSession,
    deleteSession,
    abandonSession,
  } = usePOSStore();

  const activeSessions = getActiveSessions();

  const handleNewSession = () => {
    if (!authState.user) return;

    const sessionID = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    createSession(
      sessionID,
      authState.user.id,
      `${authState.user.first_name} ${authState.user.last_name}`,
      selectedCustomerID
    );

    setShowNewSession(false);
    setSelectedCustomerID(undefined);
  };

  const handleDeleteSession = (sessionID: string) => {
    if (confirm('Are you sure you want to delete this session? All items will be lost.')) {
      deleteSession(sessionID);
    }
  };

  const handleAbandonSession = (sessionID: string) => {
    if (confirm('Are you sure you want to abandon this session?')) {
      abandonSession(sessionID);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h2 className="text-xl font-semibold mb-4">POS Sessions</h2>

      {/* New Session Button */}
      <div className="mb-4">
        {!showNewSession ? (
          <button
            onClick={() => setShowNewSession(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 font-medium"
          >
            + New Session
          </button>
        ) : (
          <div className="border rounded p-4 bg-gray-50">
            <h3 className="font-semibold mb-3">Create New Session</h3>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Customer (Optional)</label>
              <input
                type="number"
                placeholder="Customer ID"
                value={selectedCustomerID || ''}
                onChange={(e) => setSelectedCustomerID(e.target.value ? parseInt(e.target.value) : undefined)}
                className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleNewSession}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 font-medium"
              >
                Create
              </button>
              <button
                onClick={() => setShowNewSession(false)}
                className="px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400 font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Sessions List */}
      <div className="mt-6">
        <h3 className="font-semibold mb-3">Active Sessions ({activeSessions.length})</h3>

        {activeSessions.length === 0 ? (
          <p className="text-gray-500 text-sm">No active sessions</p>
        ) : (
          <div className="space-y-2">
            {activeSessions.map((session) => (
              <div
                key={session.sessionID}
                className={`p-3 border rounded cursor-pointer transition ${
                  currentSessionID === session.sessionID
                    ? 'bg-blue-100 border-blue-500'
                    : 'bg-gray-50 hover:bg-gray-100'
                }`}
              >
                <div
                  onClick={() => switchSession(session.sessionID)}
                  className="flex justify-between items-start"
                >
                  <div className="flex-1">
                    <p className="font-medium">{session.staffName}</p>
                    {session.customerName && (
                      <p className="text-sm text-gray-600">Customer: {session.customerName}</p>
                    )}
                    <p className="text-xs text-gray-500">
                      {session.items.length} items
                    </p>
                  </div>
                </div>

                <div className="mt-2 flex gap-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAbandonSession(session.sessionID);
                    }}
                    className="px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded hover:bg-yellow-200"
                  >
                    Abandon
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteSession(session.sessionID);
                    }}
                    className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded hover:bg-red-200"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
