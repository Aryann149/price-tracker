import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../App';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export default function AlertSettings() {
  const { user } = useAuth();
  const [alertEmail, setAlertEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    axios.get(`${API_URL}/api/users/profile`, {
      headers: { 'x-user-id': user.id }
    }).then(({ data }) => {
      setAlertEmail(data.alert_email || data.email || '');
      setFullName(data.full_name || '');
    }).catch(console.error);
  }, [user.id]);

  async function handleSave(e) {
    e.preventDefault();
    setLoading(true); setSaved(false);
    try {
      await axios.patch(`${API_URL}/api/users/profile`,
        { full_name: fullName, alert_email: alertEmail },
        { headers: { 'x-user-id': user.id } }
      );
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) { console.error(err); }
    setLoading(false);
  }

  const inputStyle = {
    width: '100%', padding: '11px 14px',
    background: 'var(--bg3)', border: '1px solid var(--border)',
    borderRadius: 8, color: 'var(--text)', fontSize: 14,
    outline: 'none', fontFamily: 'var(--font-body)'
  };

  return (
    <div style={{
      background: 'var(--card)', border: '1px solid var(--border)',
      borderRadius: 16, padding: '22px 22px 20px'
    }}>
      <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 16, marginBottom: 4 }}>
        Alert Settings
      </h3>
      <p style={{ color: 'var(--text2)', fontSize: 13, marginBottom: 18 }}>
        Where should we send price drop alerts?
      </p>
      <form onSubmit={handleSave}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <input style={inputStyle} type="text" placeholder="Your name"
            value={fullName} onChange={e => setFullName(e.target.value)} />
          <input style={inputStyle} type="email" placeholder="Alert email address"
            value={alertEmail} onChange={e => setAlertEmail(e.target.value)} required />
          <button type="submit" disabled={loading} style={{
            padding: '10px 18px', background: saved ? 'var(--green)' : 'var(--accent)',
            border: 'none', borderRadius: 8, color: 'white',
            fontSize: 14, fontWeight: 600, cursor: 'pointer',
            transition: 'background 0.3s'
          }}>
            {loading ? 'Saving...' : saved ? '✓ Saved!' : 'Save Settings'}
          </button>
        </div>
      </form>
    </div>
  );
}
