import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function LoginPage() {
  const { signInWithGoogle } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    setError('');
    setLoading(true);
    try {
      await signInWithGoogle();
      navigate('/');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Sign-in failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1 className="auth-title">Redtail<span className="accent-cyan">Cards</span></h1>
        <h2>Sign In</h2>
        <p>Continue with your Google account.</p>
        {error && <div className="error-msg">{error}</div>}
        <div className="auth-form">
          <button type="button" onClick={handleGoogleSignIn} disabled={loading} className="btn btn-primary">
            {loading ? 'Signing in…' : 'Sign in with Google'}
          </button>
        </div>
      </div>
    </div>
  );
}
