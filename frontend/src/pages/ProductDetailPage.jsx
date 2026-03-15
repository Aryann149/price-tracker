import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../App';
import PriceChart from '../components/Dashboard/PriceChart';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

function formatPrice(price, currency = 'INR') {
  if (!price) return '—';
  const symbol = currency === 'INR' ? '₹' : '$';
  return `${symbol}${Number(price).toLocaleString('en-IN')}`;
}

export default function ProductDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get(`${API_URL}/api/products`, {
      headers: { 'x-user-id': user.id }
    }).then(({ data }) => {
      const found = data.find(p => p.id === id);
      setProduct(found || null);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [id, user.id]);

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex',
        alignItems: 'center', justifyContent: 'center',
        background: 'var(--bg)'
      }}>
        <div style={{
          width: 36, height: 36, border: '3px solid var(--border)',
          borderTopColor: 'var(--accent)', borderRadius: '50%',
          animation: 'spin 0.8s linear infinite'
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!product) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', background: 'var(--bg)'
      }}>
        <p style={{ color: 'var(--text2)', marginBottom: 16 }}>Product not found.</p>
        <button onClick={() => navigate('/dashboard')} style={{
          padding: '10px 20px', background: 'var(--accent)',
          border: 'none', borderRadius: 8, color: 'white', cursor: 'pointer'
        }}>← Back to Dashboard</button>
      </div>
    );
  }

  const history = product.price_history || [];
  const latestPrices = {};
  history.forEach(h => {
    if (!latestPrices[h.site] || new Date(h.checked_at) > new Date(latestPrices[h.site].checked_at)) {
      latestPrices[h.site] = h;
    }
  });

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      {/* Header */}
      <header style={{
        display: 'flex', alignItems: 'center', gap: 16,
        padding: '16px 32px', borderBottom: '1px solid var(--border)',
        background: 'var(--bg2)'
      }}>
        <button onClick={() => navigate('/dashboard')} style={{
          padding: '8px 14px', background: 'var(--bg3)',
          border: '1px solid var(--border)', borderRadius: 8,
          color: 'var(--text2)', fontSize: 13, cursor: 'pointer'
        }}>← Back</button>
        <div style={{
          fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 800,
          display: 'flex', alignItems: 'center', gap: 8
        }}>
          <span style={{
            background: 'var(--accent)', borderRadius: 7,
            width: 28, height: 28, display: 'flex',
            alignItems: 'center', justifyContent: 'center', fontSize: 14
          }}>📉</span>
          PriceTracker
        </div>
      </header>

      <main style={{ maxWidth: 900, margin: '0 auto', padding: '32px 24px' }}>
        {/* Product header */}
        <div style={{
          background: 'var(--card)', border: '1px solid var(--border)',
          borderRadius: 20, padding: '28px', marginBottom: 24,
          display: 'flex', gap: 24, flexWrap: 'wrap'
        }}>
          <div style={{
            width: 100, height: 100, borderRadius: 12,
            background: 'var(--bg3)', flexShrink: 0,
            display: 'flex', alignItems: 'center',
            justifyContent: 'center', fontSize: 40, overflow: 'hidden'
          }}>
            {product.image_url
              ? <img src={product.image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : '📦'}
          </div>
          <div style={{ flex: 1 }}>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 22, marginBottom: 12 }}>
              {product.name}
            </h1>
            <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
              <div>
                <p style={{ color: 'var(--text3)', fontSize: 12, marginBottom: 2 }}>Current Best Price</p>
                <p style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 700, color: 'var(--green)' }}>
                  {formatPrice(product.current_price, product.currency)}
                </p>
              </div>
              <div>
                <p style={{ color: 'var(--text3)', fontSize: 12, marginBottom: 2 }}>Lowest Ever</p>
                <p style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 700 }}>
                  {formatPrice(product.lowest_price, product.currency)}
                </p>
              </div>
              {product.target_price && (
                <div>
                  <p style={{ color: 'var(--text3)', fontSize: 12, marginBottom: 2 }}>Your Target</p>
                  <p style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 700, color: 'var(--accent2)' }}>
                    {formatPrice(product.target_price, product.currency)}
                  </p>
                </div>
              )}
            </div>
            <a href={product.url} target="_blank" rel="noopener noreferrer" style={{
              display: 'inline-block', marginTop: 14,
              padding: '8px 16px', background: 'var(--bg3)',
              border: '1px solid var(--border)', borderRadius: 8,
              color: 'var(--accent2)', fontSize: 13
            }}>
              View Original Product →
            </a>
          </div>
        </div>

        {/* Price chart */}
        <div style={{
          background: 'var(--card)', border: '1px solid var(--border)',
          borderRadius: 20, padding: '24px', marginBottom: 24
        }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 18, marginBottom: 20 }}>
            Price History
          </h2>
          <PriceChart priceHistory={history} currency={product.currency} />
        </div>

        {/* Latest prices per site */}
        {Object.keys(latestPrices).length > 0 && (
          <div style={{
            background: 'var(--card)', border: '1px solid var(--border)',
            borderRadius: 20, padding: '24px'
          }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 18, marginBottom: 16 }}>
              Latest Prices by Site
            </h2>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
              gap: 12
            }}>
              {Object.entries(latestPrices).map(([site, data]) => (
                <div key={site} style={{
                  background: 'var(--bg3)', border: '1px solid var(--border)',
                  borderRadius: 12, padding: '14px 16px'
                }}>
                  <p style={{ color: 'var(--text3)', fontSize: 12, textTransform: 'capitalize', marginBottom: 4 }}>
                    {site.replace('_', ' ')}
                  </p>
                  <p style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 700 }}>
                    {formatPrice(data.price, product.currency)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
