import { useState } from 'react';
import axios from 'axios';
import { useAuth } from '../../App';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export default function AddProduct({ onAdded }) {
  const { user } = useAuth();
  const [url, setUrl] = useState('');
  const [targetPrice, setTargetPrice] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    if (!url.trim()) return;
    setLoading(true); setError('');

    try {
      const { data } = await axios.post(
        `${API_URL}/api/products`,
        { url: url.trim(), target_price: targetPrice ? parseFloat(targetPrice) : null },
        { headers: { 'x-user-id': user.id } }
      );
      setUrl(''); setTargetPrice('');
      onAdded(data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to add product. Check the URL and try again.');
    }
    setLoading(false);
  }

  const inputStyle = {
    flex: 1, padding: '13px 16px',
    background: 'var(--bg3)', border: '1px solid var(--border)',
    borderRadius: 10, color: 'var(--text)', fontSize: 15,
    outline: 'none', fontFamily: 'var(--font-body)'
  };

  return (
    <div style={{
      background: 'var(--card)', border: '1px solid var(--border)',
      borderRadius: 20, padding: '28px 28px 24px'
    }}>
      <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 20, marginBottom: 6 }}>
        Track a New Product
      </h2>
      <p style={{ color: 'var(--text2)', fontSize: 14, marginBottom: 20 }}>
        Paste a product URL — AI will extract the name and current price automatically.
      </p>

      {error && (
        <div style={{
          background: '#2d1515', border: '1px solid #7f1d1d',
          borderRadius: 8, padding: '10px 14px',
          color: '#fca5a5', fontSize: 14, marginBottom: 16
        }}>{error}</div>
      )}

      <form onSubmit={handleSubmit}>
        <div style={{ display: 'flex', gap: 10, marginBottom: 12, flexWrap: 'wrap' }}>
          <input
            style={{ ...inputStyle, minWidth: 280 }}
            type="url"
            placeholder="https://www.amazon.in/product-name/dp/..."
            value={url}
            onChange={e => setUrl(e.target.value)}
            required
          />
          <input
            style={{ ...inputStyle, maxWidth: 180 }}
            type="number"
            placeholder="Target price (₹)"
            value={targetPrice}
            onChange={e => setTargetPrice(e.target.value)}
            min="0"
          />
          <button type="submit" disabled={loading} style={{
            padding: '13px 24px',
            background: loading ? 'var(--bg3)' : 'var(--accent)',
            border: 'none', borderRadius: 10,
            color: loading ? 'var(--text2)' : 'white',
            fontSize: 15, fontWeight: 600,
            fontFamily: 'var(--font-display)',
            cursor: loading ? 'not-allowed' : 'pointer',
            whiteSpace: 'nowrap',
            display: 'flex', alignItems: 'center', gap: 8
          }}>
            {loading ? (
              <>
                <span style={{
                  width: 14, height: 14, border: '2px solid var(--border2)',
                  borderTopColor: 'var(--accent)', borderRadius: '50%',
                  animation: 'spin 0.8s linear infinite', display: 'inline-block'
                }} />
                Extracting...
              </>
            ) : '+ Add Product'}
          </button>
        </div>
        <p style={{ color: 'var(--text3)', fontSize: 12 }}>
          Supports: Amazon, Flipkart, Croma, Reliance Digital, Meesho & more
        </p>
      </form>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
