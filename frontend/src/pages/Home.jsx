import { useState } from 'react';
import { supabase } from '../lib/supabaseClient';

export default function Home() {
  const [mode, setMode] = useState('landing'); // 'landing' | 'login' | 'signup'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  async function handleLogin(e) {
    e.preventDefault();
    setLoading(true); setError('');
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setError(error.message);
    setLoading(false);
  }

  async function handleSignup(e) {
    e.preventDefault();
    setLoading(true); setError('');
    const { error } = await supabase.auth.signUp({
      email, password,
      options: { data: { full_name: fullName } }
    });
    if (error) setError(error.message);
    else setSuccess('Account created! Check your email to confirm, then log in.');
    setLoading(false);
  }

  const inputStyle = {
    width: '100%', padding: '12px 16px',
    background: 'var(--bg3)', border: '1px solid var(--border)',
    borderRadius: 10, color: 'var(--text)', fontSize: 15,
    outline: 'none', transition: 'border-color 0.2s',
  };

  const btnStyle = {
    width: '100%', padding: '13px',
    background: 'var(--accent)', border: 'none',
    borderRadius: 10, color: 'white',
    fontSize: 15, fontWeight: 600,
    fontFamily: 'var(--font-display)',
    cursor: loading ? 'not-allowed' : 'pointer',
    opacity: loading ? 0.7 : 1,
    transition: 'all 0.2s',
  };

  if (mode !== 'landing') {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex',
        alignItems: 'center', justifyContent: 'center',
        background: 'var(--bg)', padding: 20
      }}>
        <div style={{
          width: '100%', maxWidth: 420,
          background: 'var(--card)', border: '1px solid var(--border)',
          borderRadius: 20, padding: '36px 32px',
          animation: 'fadeIn 0.4s ease'
        }}>
          {/* Logo */}
          <div style={{ marginBottom: 28, textAlign: 'center' }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 10,
              fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 800
            }}>
              <span style={{
                background: 'var(--accent)', borderRadius: 8,
                width: 36, height: 36, display: 'flex',
                alignItems: 'center', justifyContent: 'center', fontSize: 18
              }}>📉</span>
              PriceTracker
            </div>
          </div>

          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 24, marginBottom: 6 }}>
            {mode === 'login' ? 'Welcome back' : 'Create account'}
          </h2>
          <p style={{ color: 'var(--text2)', marginBottom: 24, fontSize: 14 }}>
            {mode === 'login' ? 'Sign in to your dashboard' : 'Start tracking prices for free'}
          </p>

          {error && (
            <div style={{
              background: '#2d1515', border: '1px solid #7f1d1d',
              borderRadius: 8, padding: '10px 14px',
              color: '#fca5a5', fontSize: 14, marginBottom: 16
            }}>{error}</div>
          )}
          {success && (
            <div style={{
              background: '#0d2d1e', border: '1px solid #065f46',
              borderRadius: 8, padding: '10px 14px',
              color: '#6ee7b7', fontSize: 14, marginBottom: 16
            }}>{success}</div>
          )}

          <form onSubmit={mode === 'login' ? handleLogin : handleSignup}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {mode === 'signup' && (
                <input
                  style={inputStyle} type="text" placeholder="Full name"
                  value={fullName} onChange={e => setFullName(e.target.value)} required
                />
              )}
              <input
                style={inputStyle} type="email" placeholder="Email address"
                value={email} onChange={e => setEmail(e.target.value)} required
              />
              <input
                style={inputStyle} type="password" placeholder="Password"
                value={password} onChange={e => setPassword(e.target.value)} required
              />
              <button type="submit" style={btnStyle} disabled={loading}>
                {loading ? 'Please wait...' : mode === 'login' ? 'Sign In' : 'Create Account'}
              </button>
            </div>
          </form>

          <p style={{ textAlign: 'center', marginTop: 20, color: 'var(--text2)', fontSize: 14 }}>
            {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
            <span
              onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError(''); setSuccess(''); }}
              style={{ color: 'var(--accent2)', cursor: 'pointer', fontWeight: 500 }}
            >
              {mode === 'login' ? 'Sign up' : 'Sign in'}
            </span>
          </p>

          <p style={{ textAlign: 'center', marginTop: 12, color: 'var(--text3)', fontSize: 13, cursor: 'pointer' }}
            onClick={() => setMode('landing')}>
            ← Back to home
          </p>
        </div>
      </div>
    );
  }

  // Landing page
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', overflowX: 'hidden' }}>
      {/* Nav */}
      <nav style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '20px 48px', borderBottom: '1px solid var(--border)'
      }}>
        <div style={{
          fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 800,
          display: 'flex', alignItems: 'center', gap: 8
        }}>
          <span style={{
            background: 'var(--accent)', borderRadius: 8,
            width: 32, height: 32, display: 'flex',
            alignItems: 'center', justifyContent: 'center', fontSize: 16
          }}>📉</span>
          PriceTracker
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <button onClick={() => setMode('login')} style={{
            padding: '9px 20px', background: 'transparent',
            border: '1px solid var(--border)', borderRadius: 8,
            color: 'var(--text)', fontSize: 14, fontWeight: 500
          }}>Sign In</button>
          <button onClick={() => setMode('signup')} style={{
            padding: '9px 20px', background: 'var(--accent)',
            border: 'none', borderRadius: 8,
            color: 'white', fontSize: 14, fontWeight: 600
          }}>Get Started Free</button>
        </div>
      </nav>

      {/* Hero */}
      <div style={{ textAlign: 'center', padding: '80px 20px 60px', maxWidth: 800, margin: '0 auto' }}>
        <div style={{
          display: 'inline-block', background: 'var(--bg3)',
          border: '1px solid var(--border)', borderRadius: 100,
          padding: '6px 16px', fontSize: 13, color: 'var(--accent2)',
          marginBottom: 24, fontWeight: 500
        }}>
          🤖 AI-Powered Price Intelligence
        </div>
        <h1 style={{
          fontFamily: 'var(--font-display)', fontSize: 'clamp(40px, 6vw, 72px)',
          fontWeight: 800, lineHeight: 1.1, marginBottom: 20
        }}>
          Never overpay<br />
          <span style={{ color: 'var(--accent)' }}>for anything.</span>
        </h1>
        <p style={{ fontSize: 18, color: 'var(--text2)', maxWidth: 520, margin: '0 auto 36px', lineHeight: 1.7 }}>
          Paste any product link. We track prices across Amazon, Flipkart & more — every day. Get email alerts when prices drop.
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <button onClick={() => setMode('signup')} style={{
            padding: '14px 32px', background: 'var(--accent)',
            border: 'none', borderRadius: 10, color: 'white',
            fontSize: 16, fontWeight: 700, fontFamily: 'var(--font-display)'
          }}>Start Tracking Free →</button>
          <button onClick={() => setMode('login')} style={{
            padding: '14px 32px', background: 'var(--bg3)',
            border: '1px solid var(--border)', borderRadius: 10,
            color: 'var(--text)', fontSize: 16, fontWeight: 500
          }}>Sign In</button>
        </div>
      </div>

      {/* Features */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: 20, maxWidth: 960, margin: '0 auto', padding: '0 24px 80px'
      }}>
        {[
          { icon: '🔗', title: 'Paste Any Link', desc: 'Amazon, Flipkart, Croma — just paste the URL and AI does the rest.' },
          { icon: '📊', title: 'Daily Price History', desc: 'See how prices change over time with beautiful charts.' },
          { icon: '🎯', title: 'Set Target Price', desc: 'Tell us your budget. We\'ll alert you the moment it\'s hit.' },
          { icon: '📧', title: 'Instant Email Alerts', desc: 'Smart AI-written alerts sent to your Gmail when prices drop.' },
        ].map(f => (
          <div key={f.title} style={{
            background: 'var(--card)', border: '1px solid var(--border)',
            borderRadius: 16, padding: '24px 22px'
          }}>
            <div style={{ fontSize: 28, marginBottom: 12 }}>{f.icon}</div>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 17, marginBottom: 8 }}>{f.title}</h3>
            <p style={{ color: 'var(--text2)', fontSize: 14, lineHeight: 1.6 }}>{f.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
