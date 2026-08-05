import { useEffect, useState } from 'react';
import { Authenticator } from '@aws-amplify/ui-react';
import { fetchAuthSession } from 'aws-amplify/auth';

import CandidateUpload from './CandidateUpload';
import HRResumeList from './HRResumeList';
import AdminDashboard from './AdminDashboard';
import {
  PortalHeaderProvider,
  usePortalHeader,
} from './PortalHeaderContext';

import './App.css';
import '@aws-amplify/ui-react/styles.css';

function Portal({ signOut, user }) {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { headerAction } = usePortalHeader();

  useEffect(() => {
    async function loadUserGroups() {
      try {
        const session = await fetchAuthSession();

        const tokenGroups =
          session.tokens?.accessToken?.payload?.['cognito:groups'] || [];

        setGroups(Array.isArray(tokenGroups) ? tokenGroups : []);
      } catch (err) {
        console.error('Failed to load user group:', err);
        setError('Unable to read the user group.');
      } finally {
        setLoading(false);
      }
    }

    loadUserGroups();
  }, []);

  const email =
    user?.signInDetails?.loginId ||
    user?.username ||
    'Unknown user';

  if (loading) {
    return (
      <div className="status-page">
        Loading account...
      </div>
    );
  }

  if (error) {
    return (
      <div className="status-page error">
        {error}
      </div>
    );
  }

  const isAdmin = groups.includes('Admin');
  const isHR = groups.includes('HR');
  const isCandidate = groups.includes('Candidate');

  let dashboardTitle = 'User Dashboard';

  if (isAdmin) {
    dashboardTitle = 'Admin Dashboard';
  } else if (isHR) {
    dashboardTitle = 'HR Dashboard';
  } else if (isCandidate) {
    dashboardTitle = 'Candidate Dashboard';
  }

  return (
    <main className="portal">
      <section className="card">
        <div className="header-row">
          <div>
            <p className="label">Resume Portal</p>
            <h1>{dashboardTitle}</h1>
          </div>

          {headerAction ? (
            <button
              type="button"
              className="sign-out-button"
              onClick={headerAction.onClick}
            >
              {headerAction.label}
            </button>
          ) : (
            <button
              type="button"
              className="sign-out-button"
              onClick={signOut}
            >
              Sign out
            </button>
          )}
        </div>

        <div className="account-box">
          <p>
            <strong>Email:</strong> {email}
          </p>

          <p>
            <strong>Cognito Group:</strong>{' '}
            {groups.length > 0 ? groups.join(', ') : 'No group'}
          </p>
        </div>

        {isAdmin && <AdminDashboard />}

        {!isAdmin && isCandidate && (
          <div className="role-panel">
            <h2>Candidate functions</h2>

            <p>
              Select a PDF resume and upload it securely to the private
              S3 bucket.
            </p>

            <CandidateUpload />
          </div>
        )}

        {!isAdmin && isHR && <HRResumeList />}

        {!isAdmin && !isCandidate && !isHR && (
          <div className="role-panel warning">
            <h2>No role assigned</h2>

            <p>
              This user is not assigned to the Candidate, HR or Admin group.
            </p>
          </div>
        )}
      </section>
    </main>
  );
}

export default function App() {
  return (
    <Authenticator
      loginMechanisms={['email']}
      signUpAttributes={['email']}
    >
      {({ signOut, user }) => (
        <PortalHeaderProvider>
          <Portal
            signOut={signOut}
            user={user}
          />
        </PortalHeaderProvider>
      )}
    </Authenticator>
  );
}
