import { useEffect, useState } from 'react';
import { fetchAuthSession } from 'aws-amplify/auth';
import './HRResumeReview.css';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

function displayValue(value) {
  if (value === null || value === undefined || value === '') {
    return '—';
  }

  return value;
}

export default function HRResumeReview({ resume, onBack }) {
  const [previewUrl, setPreviewUrl] = useState('');
  const [isLoadingPreview, setIsLoadingPreview] = useState(true);
  const [previewError, setPreviewError] = useState('');

  useEffect(() => {
    let objectUrl = '';
    let cancelled = false;

    async function loadPreview() {
      setIsLoadingPreview(true);
      setPreviewError('');
      setPreviewUrl('');

      try {
        const session = await fetchAuthSession();
        const idToken = session.tokens?.idToken?.toString();

        if (!idToken) {
          throw new Error('Unable to obtain the Cognito ID token.');
        }

        const response = await fetch(`${API_BASE_URL}/hr/download-url`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${idToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ key: resume.key }),
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
          throw new Error('Unable to load the PDF file.');
        }

        const fileBlob = await downloadResponse.blob();
        objectUrl = URL.createObjectURL(fileBlob);

        if (cancelled) {
          URL.revokeObjectURL(objectUrl);
        } else {
          setPreviewUrl(objectUrl);
        }
      } catch (error) {
        console.error('Resume preview error:', error);

        if (!cancelled) {
          setPreviewError(
            error.message || 'Unable to preview the resume.',
          );
        }
      } finally {
        if (!cancelled) {
          setIsLoadingPreview(false);
        }
      }
    }

    loadPreview();

    return () => {
      cancelled = true;

      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [resume.key]);

  const extractedText = (resume.rawText || '').trim();
  const truncatedText =
    extractedText.length > 2500
      ? `${extractedText.slice(0, 2500)}…`
      : extractedText;

  return (
    <section className="hr-review-section">
      <div className="hr-review-header">
        <div>
          <p className="hr-review-eyebrow">Resume review</p>
          <h2>{resume.fileName || 'Unnamed resume'}</h2>
          <p>Review candidate details, AI summary, and the uploaded PDF.</p>
        </div>

        <button type="button" className="back-button" onClick={onBack}>
          Back to list
        </button>
      </div>

      <div className="hr-review-meta-grid">
        <div className="hr-review-meta-card">
          <span>Candidate name</span>
          <strong>{displayValue(resume.candidateName)}</strong>
        </div>

        <div className="hr-review-meta-card">
          <span>Email</span>
          <strong>{displayValue(resume.email)}</strong>
        </div>

        <div className="hr-review-meta-card">
          <span>Phone</span>
          <strong>{displayValue(resume.phone)}</strong>
        </div>

        <div className="hr-review-meta-card">
          <span>Parse status</span>
          <strong>{displayValue(resume.status)}</strong>
        </div>
      </div>

      <div className="hr-review-panel">
        <h3>AI summary</h3>

        {resume.aiSummary ? (
          <p className="hr-ai-summary">{resume.aiSummary}</p>
        ) : (
          <p className="hr-ai-summary empty">No AI summary yet</p>
        )}
      </div>

      <div className="hr-review-panel">
        <h3>Resume preview</h3>

        {isLoadingPreview && (
          <div className="hr-review-status">Loading PDF preview...</div>
        )}

        {!isLoadingPreview && previewError && (
          <div className="hr-review-error">{previewError}</div>
        )}

        {!isLoadingPreview && previewUrl && (
          <iframe
            className="hr-pdf-preview"
            title={`Preview of ${resume.fileName || 'resume'}`}
            src={previewUrl}
          />
        )}
      </div>

      <div className="hr-review-panel">
        <h3>Extracted text</h3>

        {truncatedText ? (
          <pre className="hr-extracted-text">{truncatedText}</pre>
        ) : (
          <p className="hr-ai-summary empty">No extracted text available</p>
        )}
      </div>
    </section>
  );
}
