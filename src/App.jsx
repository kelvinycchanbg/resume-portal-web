import { useEffect, useState } from 'react';
import { Authenticator } from '@aws-amplify/ui-react';
import { fetchAuthSession } from 'aws-amplify/auth';

import CandidateUpload from './CandidateUpload';
import HRResumeList from './HRResumeList';

import './App.css';
import '@aws-amplify/ui-react/styles.css';

function Portal({ signOut, user }) {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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

  const isHR = groups.includes('HR');
  const isCandidate = groups.includes('Candidate');

  return (
    <main className="portal">
      <section className="card">
        <div className="header-row">
          <div>
            <p className="label">Resume Portal</p>

            <h1>
              {isHR
                ? 'HR Dashboard'
                : isCandidate
                  ? 'Candidate Dashboard'
                  : 'User Dashboard'}
            </h1>
          </div>

          <button
            type="button"
            className="sign-out-button"
            onClick={signOut}
          >
            Sign out
          </button>
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

        {isCandidate && (
          <div className="role-panel">
            <h2>Candidate functions</h2>

            <p>
              Select a PDF resume and upload it securely to the private
              S3 bucket.
            </p>

            <CandidateUpload />
          </div>
        )}

        {isHR && (
          <HRResumeList />
        )}

        {!isCandidate && !isHR && (
          <div className="role-panel warning">
            <h2>No role assigned</h2>

            <p>
              This user is not in the Candidate or HR group.
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
      hideSignUp
    >
      {({ signOut, user }) => (
        <Portal
          signOut={signOut}
          user={user}
        />
      )}
    </Authenticator>
  );
}