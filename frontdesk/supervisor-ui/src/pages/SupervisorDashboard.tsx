


/**
 * Supervisor Dashboard Component
 * 
 * This component provides the main interface for supervisors to manage
 * pending help requests from customers. It displays a list of pending
 * requests and allows supervisors to provide answers that are automatically
 * added to the knowledge base.
 * 
 * Key features:
 * - Real-time polling of pending requests
 * - Request sorting and filtering
 * - Answer submission with resolver tracking
 * - Toast notifications for user feedback
 * - Responsive design with sidebar layout
 */

import { useState, useEffect } from 'react';
import { listHelpRequests, resolveHelpRequest, type HelpRequest } from '../services/api';
import { Toast } from '../components/Toast';

/**
 * Main supervisor dashboard component for managing help requests.
 * 
 * @returns JSX.Element - The complete supervisor dashboard interface
 */
export function SupervisorDashboard() {
  // Component state management
  const [pendingRequests, setPendingRequests] = useState<HelpRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<HelpRequest | null>(null);
  const [answer, setAnswer] = useState('');
  const [resolver, setResolver] = useState('');
  const [showToast, setShowToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [sortBy, setSortBy] = useState<'newest' | 'oldest'>('newest');

  // Initialize data loading and set up polling interval
  useEffect(() => {
    loadPendingRequests();
    // Poll for new requests every 10 seconds to maintain real-time updates
    const interval = setInterval(loadPendingRequests, 10000);
    return () => clearInterval(interval);
  }, []);

  /**
   * Loads pending help requests from the API and updates component state.
   * Handles errors gracefully with user feedback via toast notifications.
   */
  const loadPendingRequests = async () => {
    try {
      const data = await listHelpRequests('pending', 50);
      setPendingRequests(data.items);
    } catch (err) {
      setShowToast({ message: 'Failed to load pending requests', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handles the resolution of a help request by submitting the supervisor's answer.
   * Validates required fields before submission and provides user feedback.
   */
  const handleResolve = async () => {
    if (!selectedRequest || !answer || !resolver) return;
    try {
      await resolveHelpRequest(selectedRequest.id, answer, resolver);
      setShowToast({ message: 'Help request resolved and added to knowledge base!', type: 'success' });
      setSelectedRequest(null);
      setAnswer('');
      loadPendingRequests();
    } catch (err) {
      setShowToast({ message: 'Failed to resolve: ' + (err instanceof Error ? err.message : 'Unknown error'), type: 'error' });
    }
  };

  // Skeleton loader for requests
  if (loading) {
    return (
      <div className="d-flex align-items-center justify-content-center vh-100 bg-light">
        <div className="skeleton-loader" style={{ width: 320, height: 180, borderRadius: 16, background: 'linear-gradient(90deg,#f0f0f0 25%,#e0e0e0 50%,#f0f0f0 75%)', animation: 'pulse 1.5s infinite' }} />
        <style>{`@keyframes pulse { 0%{opacity:1;} 50%{opacity:0.6;} 100%{opacity:1;} }`}</style>
      </div>
    );
  }

  return (
    <div className="container-fluid bg-light min-vh-100 p-0 position-relative supervisor-dashboard-ui">
      {/* Toast Feedback */}
      {showToast && (
        <Toast
          message={showToast.message}
          type={showToast.type}
          onClose={() => setShowToast(null)}
        />
      )}
      {/* Navbar */}
      <nav className="navbar navbar-expand-lg navbar-light bg-white shadow-sm mb-4 sticky-top" aria-label="Supervisor dashboard navigation">
        <div className="container-fluid">
          <span className="navbar-brand fs-2 fw-bold text-primary d-flex align-items-center">
            <img src="/vite.svg" alt="Supervisor" style={{ width: 40, height: 40, marginRight: 12 }} />
            Supervisor Dashboard
          </span>
          <span className="badge bg-primary fs-6" aria-label="Pending requests count">{pendingRequests.length} pending</span>
        </div>
      </nav>
      <div className="row g-0 justify-content-center">
        {/* Sidebar for requests */}
        <aside className="col-md-4 col-lg-3 bg-white border-end px-4 py-4" aria-label="Pending requests sidebar" style={{ minHeight: 600, borderRadius: 16, boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h2 className="fs-5 fw-bold text-secondary">Pending Requests</h2>
            <select
              className="form-select form-select-sm w-auto ms-2"
              value={sortBy}
              onChange={e => setSortBy(e.target.value as 'newest' | 'oldest')}
              aria-label="Sort requests"
            >
              <option value="newest">Newest</option>
              <option value="oldest">Oldest</option>
            </select>
          </div>
          {pendingRequests.length === 0 ? (
            <div className="text-muted text-center mt-5 fs-6">No pending requests</div>
          ) : (
            <ul className="list-group list-group-flush">
              {[...pendingRequests]
                .sort((a, b) => sortBy === 'newest' ? new Date(b.created_at).getTime() - new Date(a.created_at).getTime() : new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
                .map((req) => (
                  <li
                    key={req.id}
                    onClick={() => setSelectedRequest(req)}
                    className={`list-group-item list-group-item-action rounded mb-2 d-flex align-items-center ${selectedRequest?.id === req.id ? 'active border-primary shadow-sm' : ''}`}
                    style={{ cursor: 'pointer', transition: 'background 0.2s', background: selectedRequest?.id === req.id ? '#eaf6ff' : '#fff' }}
                    tabIndex={0}
                    aria-label={`Request from ${req.customer_id}`}
                  >
                    {/* Avatar/Initials */}
                    <div className="avatar bg-primary text-white rounded-circle me-3" style={{ width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 18 }}>
                      {req.customer_id?.[0]?.toUpperCase() || '?'}
                    </div>
                    <div className="flex-grow-1">
                      <div className="fw-bold text-dark">{req.customer_id}</div>
                      <div className="text-secondary small mb-1">{req.question}</div>
                      <div className="text-muted small">{new Date(req.created_at).toLocaleString()}</div>
                    </div>
                    {/* Status indicator */}
                    <span className="badge bg-warning text-dark ms-2" aria-label="New request">New</span>
                  </li>
                ))}
            </ul>
          )}
        </aside>
        {/* Main panel for resolving */}
        <main className="col-md-8 col-lg-6 px-5 py-4" aria-label="Resolve request panel" style={{ minHeight: 600 }}>
          {selectedRequest ? (
            <div className="card shadow-lg border-0 mb-4 animate__animated animate__fadeIn" style={{ borderRadius: 18 }}>
              <div className="card-body">
                <h3 className="card-title fs-4 fw-bold text-primary mb-3 d-flex align-items-center">
                  <span style={{ marginRight: 8 }}>📝</span> Resolve Request
                </h3>
                {/* Stepper */}
                <div className="mb-4">
                  <ol className="list-inline">
                    <li className="list-inline-item"><span className="badge bg-primary">1</span> Review</li>
                    <li className="list-inline-item"><span className="badge bg-secondary">2</span> Answer</li>
                    <li className="list-inline-item"><span className="badge bg-success">3</span> Confirm</li>
                  </ol>
                </div>
                <div className="mb-3 d-flex align-items-center">
                  <div className="avatar bg-primary text-white rounded-circle me-3" style={{ width: 48, height: 48, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 22 }}>
                    {selectedRequest.customer_id?.[0]?.toUpperCase() || '?'}
                  </div>
                  <div>
                    <div className="fw-bold text-dark mb-1">Customer: <span className="text-secondary">{selectedRequest.customer_id}</span></div>
                    <div className="mb-1">Question: <span className="text-secondary">{selectedRequest.question}</span></div>
                    <div className="text-muted small">Asked: {new Date(selectedRequest.created_at).toLocaleString()}</div>
                  </div>
                </div>
                <div className="mb-3">
                  <label className="form-label fw-bold" htmlFor="resolver-input">Your Name (Resolver)
                    <span className="ms-1" title="Enter your name for record keeping">🛈</span>
                  </label>
                  <input
                    id="resolver-input"
                    type="text"
                    className="form-control"
                    value={resolver}
                    onChange={(e) => setResolver(e.target.value)}
                    placeholder="e.g., Jane (Manager)"
                    aria-label="Resolver name"
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label fw-bold" htmlFor="answer-input">Answer
                    <span className="ms-1" title="Provide a clear, helpful answer">🛈</span>
                  </label>
                  <textarea
                    id="answer-input"
                    className="form-control"
                    value={answer}
                    onChange={(e) => setAnswer(e.target.value)}
                    placeholder="Provide the answer to this customer's question..."
                    rows={5}
                    aria-label="Answer to customer"
                  />
                </div>
                <button
                  className="btn btn-primary btn-lg w-100 fw-bold"
                  onClick={handleResolve}
                  disabled={!answer || !resolver}
                  aria-label="Resolve and add to knowledge base"
                  style={{ boxShadow: '0 2px 8px rgba(0,120,212,0.08)' }}
                >
                  ✅ Resolve & Add to Knowledge Base
                </button>
              </div>
            </div>
          ) : (
            <div className="d-flex flex-column align-items-center justify-content-center h-100 text-muted" style={{ minHeight: 320 }}>
              <span className="display-4 mb-3">📝</span>
              <span className="fs-5">Select a pending request to resolve</span>
            </div>
          )}
        </main>
      </div>
      {/* Sticky Footer */}
      <footer className="bg-white text-center py-4 mt-5 border-top shadow-sm position-sticky bottom-0 w-100" aria-label="Footer" style={{ borderRadius: 12 }}>
        <span className="text-primary fw-bold">Powered by LiveKit</span> &middot; <span className="text-secondary fw-bold">Salon FrontDesk</span>
        <span className="ms-3"><a href="/help" className="text-decoration-none text-secondary">Help</a></span>
      </footer>
      <style>{`
        .supervisor-dashboard-ui .active {
          background: #eaf6ff !important;
          border-color: #0078d4 !important;
        }
      `}</style>
    </div>
  );
}