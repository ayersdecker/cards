import React from 'react';
import { Link, useLocation } from 'react-router-dom';

interface Props {
  message: string;
}

export default function SignInPrompt({ message }: Props) {
  const location = useLocation();
  const returnTo = `${location.pathname}${location.search}`;

  return (
    <section className="card-surface sign-in-prompt">
      <h3>Sign in required</h3>
      <p className="muted">{message}</p>
      <Link to="/login" state={{ from: returnTo }} className="btn btn-primary">
        Sign in
      </Link>
    </section>
  );
}