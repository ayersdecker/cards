import React from 'react';

interface MissingFirebaseConfigPageProps {
  missingVars: readonly string[];
}

export default function MissingFirebaseConfigPage({ missingVars }: MissingFirebaseConfigPageProps) {
  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1 className="auth-title">Firebase Setup Required</h1>
        <p>
          Dev mode is running, but Firebase is not configured yet. Add the missing values to
          <strong> .env.local</strong>, then restart Vite.
        </p>

        <div className="error-msg">
          Missing: {missingVars.join(', ')}
        </div>

        <div className="card-oracle">
          <p>1. Open .env.local</p>
          <p>2. Paste your Firebase Web App config values</p>
          <p>3. Restart with npm run dev</p>
        </div>

        <div className="settings-preview-card">
          <p style={{ marginBottom: '0.5rem' }}><strong>Required keys</strong></p>
          <pre style={{ whiteSpace: 'pre-wrap', margin: 0 }}>
{`VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=`}
          </pre>
        </div>
      </div>
    </div>
  );
}
