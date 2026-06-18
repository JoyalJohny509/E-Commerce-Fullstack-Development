'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/lib/store';
import { useToast } from '@/components/Toast';
import styles from './page.module.css';

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { login, register } = useAuthStore();
  const { showToast } = useToast();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      let success: boolean;
      if (isLogin) {
        success = await login(email, password);
      } else {
        success = await register(name, email, password);
      }

      if (success) {
        showToast(isLogin ? 'Welcome back!' : 'Account created successfully!', 'success');
        router.push('/');
      } else {
        setError(isLogin ? 'Invalid email or password' : 'Registration failed. Please try again.');
      }
    } catch {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.authContainer}>
        {/* Left side - decorative */}
        <div className={styles.decorSide}>
          <div className={styles.decorContent}>
            <span className={styles.decorIcon}>◆</span>
            <h2 className={styles.decorTitle}>
              Welcome to <br />
              <span className={styles.decorHighlight}>LUXE</span>
            </h2>
            <p className={styles.decorDesc}>
              Join thousands of customers who trust us for premium products and exceptional service.
            </p>
            <div className={styles.decorStats}>
              <div className={styles.decorStat}>
                <span className={styles.decorStatNum}>50K+</span>
                <span className={styles.decorStatLabel}>Customers</span>
              </div>
              <div className={styles.decorStat}>
                <span className={styles.decorStatNum}>99%</span>
                <span className={styles.decorStatLabel}>Satisfaction</span>
              </div>
              <div className={styles.decorStat}>
                <span className={styles.decorStatNum}>24/7</span>
                <span className={styles.decorStatLabel}>Support</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right side - form */}
        <div className={styles.formSide}>
          <div className={styles.formWrapper}>
            <Link href="/" className={styles.backLink}>
              ← Back to Store
            </Link>

            <h1 className={styles.formTitle}>
              {isLogin ? 'Sign In' : 'Create Account'}
            </h1>
            <p className={styles.formSubtitle}>
              {isLogin
                ? 'Welcome back! Enter your credentials to continue.'
                : 'Join LUXE for exclusive deals and a premium experience.'}
            </p>

            {/* Demo credentials */}
            {isLogin && (
              <div className={styles.demoBox}>
                <span className={styles.demoLabel}>Demo Account</span>
                <span className={styles.demoCredentials}>
                  Email: demo@luxestore.com • Password: demo123
                </span>
              </div>
            )}

            <form onSubmit={handleSubmit} className={styles.form} id="auth-form">
              {!isLogin && (
                <div className="input-group">
                  <label htmlFor="name">Full Name</label>
                  <input
                    id="name"
                    type="text"
                    className="input"
                    placeholder="John Doe"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>
              )}

              <div className="input-group">
                <label htmlFor="email">Email Address</label>
                <input
                  id="email"
                  type="email"
                  className="input"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="input-group">
                <label htmlFor="password">Password</label>
                <input
                  id="password"
                  type="password"
                  className="input"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                />
              </div>

              {error && <div className={styles.errorMsg}>{error}</div>}

              <button
                type="submit"
                className="btn btn-primary btn-lg"
                style={{ width: '100%' }}
                disabled={loading}
                id="auth-submit"
              >
                {loading ? (
                  <div className="spinner" style={{ width: 20, height: 20, borderWidth: 2 }} />
                ) : isLogin ? (
                  'Sign In'
                ) : (
                  'Create Account'
                )}
              </button>
            </form>

            <div className={styles.divider}>
              <span>or</span>
            </div>

            <button
              className={`btn btn-secondary ${styles.switchBtn}`}
              onClick={() => { setIsLogin(!isLogin); setError(''); }}
              id="auth-switch"
            >
              {isLogin ? 'Create a new account' : 'Already have an account? Sign in'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
