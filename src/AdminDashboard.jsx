import HRResumeList from './HRResumeList';

export default function AdminDashboard() {
  return (
    <div className="admin-dashboard">
      <div className="role-panel">
        <h2>Admin functions</h2>

        <p>
          Manage users, review resumes and monitor system security.
        </p>

        <div className="admin-grid">
          <div className="admin-card">
            <h3>User Management</h3>
            <p>View and manage Candidate, HR and Admin accounts.</p>
            <button type="button" disabled>
              Coming soon
            </button>
          </div>

          <div className="admin-card">
            <h3>AI Processing</h3>
            <p>View AI resume summary status and processing results.</p>
            <button type="button" disabled>
              Coming soon
            </button>
          </div>

          <div className="admin-card">
            <h3>Security Monitoring</h3>
            <p>View CloudWatch alarms, logs and security findings.</p>
            <button type="button" disabled>
              Coming soon
            </button>
          </div>

          <div className="admin-card">
            <h3>Audit Results</h3>
            <p>View Prowler, ZAP and other security audit results.</p>
            <button type="button" disabled>
              Coming soon
            </button>
          </div>
        </div>
      </div>

      <div className="role-panel">
        <h2>All uploaded resumes</h2>
        <p>
          Administrators can view the same resume records available to HR.
        </p>

        <HRResumeList />
      </div>
    </div>
  );
}