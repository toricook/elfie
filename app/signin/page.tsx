'use client';

import { signIn } from 'next-auth/react';
import { useState } from 'react';

export default function SignInPage() {
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const email = String(formData.get('email') || '').trim().toLowerCase();
    const password = String(formData.get('password') || '');
    if (!email || !password) {
      setError('Email and password are required');
      return;
    }
    const result = await signIn('credentials', {
      email,
      password,
      redirect: false,
      callbackUrl: '/',
    });
    if (result?.error) {
      setError('Invalid credentials');
    } else {
      window.location.href = result?.url || '/';
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md bg-white rounded-xl shadow p-8 space-y-6">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold text-gray-900">Sign in</h1>
          <p className="text-sm text-gray-600">Use your email/password or continue with Google.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
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
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="********"
            />
          </div>
          <button
            type="submit"
            className="w-full rounded-lg bg-blue-600 px-4 py-2 text-white font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Sign in
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
          New here? <a className="text-blue-600 hover:underline" href="/signup">Create an account</a>.
        </p>
      </div>
    </div>
  );
}
