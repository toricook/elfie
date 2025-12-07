'use client';

import { signIn } from 'next-auth/react';
import { useState } from 'react';

export default function SignUpPage() {
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const email = String(formData.get('email') || '').trim().toLowerCase();
    const password = String(formData.get('password') || '');
    const displayName = String(formData.get('displayName') || '').trim() || undefined;
    if (!email || !password) {
      setError('Email and password are required');
      return;
    }

    const res = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, displayName }),
      cache: 'no-store',
    });

    if (!res.ok) {
      if (res.status === 409) {
        setError('Account already exists. Please sign in instead.');
      } else {
        setError('Sign up failed');
      }
      return;
    }

    const result = await signIn('credentials', {
      email,
      password,
      redirect: false,
      callbackUrl: '/',
    });

    if (result?.error) {
      setError('Sign in failed after signup');
    } else {
      window.location.href = result?.url || '/';
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md bg-white rounded-xl shadow p-8 space-y-6">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold text-gray-900">Create your account</h1>
          <p className="text-sm text-gray-600">Sign up with email/password or use Google instead.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700" htmlFor="displayName">
              Name (optional)
            </label>
            <input
              id="displayName"
              name="displayName"
              type="text"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Your name"
            />
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="you@example.com"
            />
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              minLength={8}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="********"
            />
          </div>
          <button
            type="submit"
            className="w-full rounded-lg bg-blue-600 px-4 py-2 text-white font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Sign up
          </button>
          {error && <p className="text-sm text-red-600">{error}</p>}
        </form>

        <button
          type="button"
          onClick={() => signIn('google', { callbackUrl: '/' })}
          className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-800 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Continue with Google
        </button>

        <p className="text-sm text-gray-600">
          Already have an account? <a className="text-blue-600 hover:underline" href="/signin">Sign in</a>.
        </p>
      </div>
    </div>
  );
}
