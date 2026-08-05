import { useCallback, useEffect, useState } from 'react';
import { fetchAuthSession } from 'aws-amplify/auth';
import HRResumeReview from './HRResumeReview';
import './HRResumeList.css';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

function formatFileSize(bytes) {
  if (!Number.isFinite(bytes)) {
    return 'Unknown';
  }

  if (bytes < 1024) {
    return `${bytes} bytes`;
  }

  return `${(bytes / 1024).toFixed(1)} KB`;
}

function formatDate(dateValue) {
  if (!dateValue) {
    return 'Unknown';
  }

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return dateValue;
  }

  return date.toLocaleString();
}

export default function HRResumeList() {
  const [resumes, setResumes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [downloadingKey, setDownloadingKey] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [selectedResume, setSelectedResume] = useState(null);

  const getIdToken = async () => {
    const session = await fetchAuthSession();
    const idToken = session.tokens?.idToken?.toString();

    if (!idToken) {
      throw new Error('Unable to obtain the Cognito ID token.');
    }

    return idToken;
  };

  const loadResumes = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage('');

    try {
      const idToken = await getIdToken();

      const response = await fetch(`${API_BASE_URL}/hr/resumes`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${idToken}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Unable to load resumes.');
      }

      setResumes(Array.isArray(data.resumes) ? data.resumes : []);
    } catch (error) {
      console.error('Load resumes error:', error);

      setErrorMessage(error.message || 'Unable to load resumes.');
      setResumes([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadResumes();
  }, [loadResumes]);

  const handleDownload = async (resume) => {
    setDownloadingKey(resume.key);
    setErrorMessage('');

    try {
      const idToken = await getIdToken();

      const response = await fetch(`${API_BASE_URL}/hr/download-url`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${idToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          key: resume.key,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || 'Unable to create the download URL.',
        );
      }

      if (!data.downloadUrl) {
        throw new Error('The API did not return a download URL.');
      }

      const downloadResponse = await fetch(data.downloadUrl);

      if (!downloadResponse.ok) {
        throw new Error('Unable to download the PDF file.');
      }

      const fileBlob = await downloadResponse.blob();
      const objectUrl = URL.createObjectURL(fileBlob);

      const downloadLink = document.createElement('a');

      downloadLink.href = objectUrl;
      downloadLink.download = resume.fileName || 'resume.pdf';

      document.body.appendChild(downloadLink);
      downloadLink.click();
      downloadLink.remove();

      setTimeout(() => {
        URL.revokeObjectURL(objectUrl);
      }, 1000);
    } catch (error) {
      console.error('Download error:', error);

      setErrorMessage(error.message || 'Unable to download the resume.');
    } finally {
      setDownloadingKey('');
    }
  };

  if (selectedResume) {
    return (
      <HRResumeReview
        resume={selectedResume}
        onBack={() => setSelectedResume(null)}
      />
    );
  }

  return (
    <section className="hr-resume-section">
      <div className="hr-resume-header">
        <div>
          <h2>Candidate resumes</h2>

          <p>
            Review candidate details and AI summaries, or download the
            original PDF.
          </p>
        </div>

        <button
          type="button"
          className="refresh-button"
          onClick={loadResumes}
          disabled={isLoading}
        >
          {isLoading ? 'Loading...' : 'Refresh'}
        </button>
      </div>

      {errorMessage && (
        <div className="hr-error-message">{errorMessage}</div>
      )}

      {isLoading && (
        <div className="hr-status-message">
          Loading candidate resumes...
        </div>
      )}

      {!isLoading && resumes.length === 0 && (
        <div className="hr-status-message">No resumes were found.</div>
      )}

      {!isLoading && resumes.length > 0 && (
        <div className="resume-list">
          {resumes.map((resume) => (
            <article className="resume-item" key={resume.key}>
              <div className="resume-information">
                <h3>
                  {resume.candidateName ||
                    resume.fileName ||
                    'Unnamed resume'}
                </h3>

                <p>
                  <strong>File:</strong> {resume.fileName || 'Unknown'}
                </p>

                <p>
                  <strong>Email:</strong> {resume.email || '—'}
                </p>

                <p>
                  <strong>Status:</strong> {resume.status || '—'}
                </p>

                <p>
                  <strong>AI summary:</strong>{' '}
                  {resume.aiSummary ? 'Available' : 'Not available'}
                </p>

                <p>
                  <strong>Size:</strong> {formatFileSize(resume.size)}
                </p>

                <p>
                  <strong>Uploaded:</strong>{' '}
                  {formatDate(resume.lastModified)}
                </p>
              </div>

              <div className="resume-actions">
                <button
                  type="button"
                  className="review-button"
                  onClick={() => setSelectedResume(resume)}
                >
                  Review
                </button>

                <button
                  type="button"
                  className="download-button"
                  onClick={() => handleDownload(resume)}
                  disabled={downloadingKey === resume.key}
                >
                  {downloadingKey === resume.key
                    ? 'Downloading...'
                    : 'Download'}
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
