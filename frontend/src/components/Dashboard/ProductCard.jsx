import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../App';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

function formatPrice(price, currency = 'INR') {
  if (!price) return '—';
  const symbol = currency === 'INR' ? '₹' : '$';
  return `${symbol}${Number(price).toLocaleString('en-IN')}`;
}

export default function ProductCard({ product, onDelete, onUpdated }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [checking, setChecking] = useState(false);
  const [editTarget, setEditTarget] = useState(false);
  const [targetValue, setTargetValue] = useState(product.target_price || '');

  const priceDrop = product.price_history?.length >= 2
    ? product.price_history[0].price - product.price_history[product.price_history.length - 1].price
    : 0;

  const isTargetReached = product.target_price && product.current_price <= product.target_price;
  const hasDrop = priceDrop > 0;

  async function handleManualCheck() {
    setChecking(true);
    try {
      await axios.post(`${API_URL}/api/products/${product.id}/check`, {}, {
        headers: { 'x-user-id': user.id }
      });
      onUpdated();
    } catch (err) {
      console.error(err);
    }
    setChecking(false);
  }

  async function handleDelete() {
    if (!confirm('Remove this product from tracking?')) return;
    try {
      await axios.delete(`${API_URL}/api/products/${product.id}`, {
        headers: { 'x-user-id': user.id }
      });
      onDelete(product.id);
    } catch (err) { console.error(err); }
  }

  async function handleSaveTarget() {
    try {
      await axios.patch(`${API_URL}/api/products/${product.id}`,
        { target_price: targetValue ? parseFloat(targetValue) : null },
        { headers: { 'x-user-id': user.id } }
      );
      setEditTarget(false);
      onUpdated();
    } catch (err) { console.error(err); }
  }

  return (
    <div style={{
      background: 'var(--card)', border: `1px solid ${isTargetReached ? 'var(--green)' : 'var(--border)'}`,
      borderRadius: 16, overflow: 'hidden',
      transition: 'border-color 0.2s, transform 0.2s',
      animation: 'fadeIn 0.4s ease'
    }}>
      {isTargetReached && (
        <div style={{
          background: 'var(--green)', padding: '6px 14px',
          fontSize: 12, fontWeight: 600, color: 'white',
          display: 'flex', alignItems: 'center', gap: 6
        }}>
          🎯 Target price reached!
        </div>
      )}

      <div style={{ padding: '20px 20px 16px', display: 'flex', gap: 16 }}>
        {/* Product image */}
        <div style={{
          width: 72, height: 72, borderRadius: 10,
          background: 'var(--bg3)', flexShrink: 0, overflow: 'hidden',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 28
        }}>
          {product.image_url
            ? <img src={product.image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : '📦'}
        </div>

        {/* Info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <h3
            onClick={() => navigate(`/product/${product.id}`)}
            style={{
              fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 600,
              marginBottom: 4, cursor: 'pointer', color: 'var(--text)',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
            }}
          >
            {product.name}
          </h3>

          <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap' }}>
            <span style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 700, color: 'var(--text)' }}>
              {formatPrice(product.current_price, product.currency)}
            </span>
            {hasDrop && (
              <span style={{
                background: '#0d2d1e', color: 'var(--green)',
                padding: '2px 8px', borderRadius: 6, fontSize: 12, fontWeight: 600
              }}>
                ↓ {formatPrice(priceDrop, product.currency)} drop
              </span>
            )}
          </div>

          <div style={{ display: 'flex', gap: 16, marginTop: 6, flexWrap: 'wrap' }}>
            <span style={{ color: 'var(--text3)', fontSize: 12 }}>
              Lowest ever: <strong style={{ color: 'var(--text2)' }}>{formatPrice(product.lowest_price, product.currency)}</strong>
            </span>
            {product.target_price && (
              <span style={{ color: 'var(--text3)', fontSize: 12 }}>
                Target: <strong style={{ color: 'var(--accent2)' }}>{formatPrice(product.target_price, product.currency)}</strong>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Target price editor */}
      {editTarget && (
        <div style={{
          padding: '0 20px 14px',
          display: 'flex', gap: 8, alignItems: 'center'
        }}>
          <input
            type="number" value={targetValue}
            onChange={e => setTargetValue(e.target.value)}
            placeholder="Enter target price"
            style={{
              flex: 1, padding: '8px 12px',
              background: 'var(--bg3)', border: '1px solid var(--border)',
              borderRadius: 8, color: 'var(--text)', fontSize: 14,
              outline: 'none'
            }}
          />
          <button onClick={handleSaveTarget} style={{
            padding: '8px 14px', background: 'var(--accent)',
            border: 'none', borderRadius: 8, color: 'white',
            fontSize: 13, fontWeight: 600, cursor: 'pointer'
          }}>Save</button>
          <button onClick={() => setEditTarget(false)} style={{
            padding: '8px 12px', background: 'var(--bg3)',
            border: '1px solid var(--border)', borderRadius: 8,
            color: 'var(--text2)', fontSize: 13, cursor: 'pointer'
          }}>Cancel</button>
        </div>
      )}

      {/* Actions */}
      <div style={{
        padding: '12px 20px', borderTop: '1px solid var(--border)',
        display: 'flex', gap: 8, flexWrap: 'wrap'
      }}>
        <button onClick={() => navigate(`/product/${product.id}`)} style={{
          padding: '7px 14px', background: 'var(--bg3)',
          border: '1px solid var(--border)', borderRadius: 8,
          color: 'var(--text2)', fontSize: 13, cursor: 'pointer'
        }}>📊 View History</button>
        <button onClick={() => setEditTarget(true)} style={{
          padding: '7px 14px', background: 'var(--bg3)',
          border: '1px solid var(--border)', borderRadius: 8,
          color: 'var(--text2)', fontSize: 13, cursor: 'pointer'
        }}>🎯 {product.target_price ? 'Edit' : 'Set'} Target</button>
        <button onClick={handleManualCheck} disabled={checking} style={{
          padding: '7px 14px', background: 'var(--bg3)',
          border: '1px solid var(--border)', borderRadius: 8,
          color: checking ? 'var(--text3)' : 'var(--text2)', fontSize: 13, cursor: checking ? 'not-allowed' : 'pointer'
        }}>{checking ? '⏳ Checking...' : '🔄 Check Now'}</button>
        <button onClick={handleDelete} style={{
          padding: '7px 14px', background: 'transparent',
          border: '1px solid #3d1515', borderRadius: 8,
          color: '#f87171', fontSize: 13, cursor: 'pointer', marginLeft: 'auto'
        }}>🗑 Remove</button>
      </div>
    </div>
  );
}
