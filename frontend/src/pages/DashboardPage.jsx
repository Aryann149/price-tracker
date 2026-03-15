import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../App';
import AddProduct from '../components/Products/AddProduct';
import ProductCard from '../components/Dashboard/ProductCard';
import AlertSettings from '../components/Alerts/AlertSettings';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export default function DashboardPage() {
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showSettings, setShowSettings] = useState(false);

  const fetchProducts = useCallback(async () => {
    try {
      const { data } = await axios.get(`${API_URL}/api/products`, {
        headers: { 'x-user-id': user.id }
      });
      setProducts(data);
    } catch (err) { console.error(err); }
    setLoading(false);
  }, [user.id]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  async function handleLogout() {
    await supabase.auth.signOut();
  }

  function handleProductAdded(product) {
    setProducts(prev => [product, ...prev]);
  }

  function handleProductDeleted(id) {
    setProducts(prev => prev.filter(p => p.id !== id));
  }

  const totalTracked = products.length;
  const totalDrops = products.filter(p =>
    p.price_history?.length >= 2 &&
    p.price_history[0].price < p.price_history[p.price_history.length - 1].price
  ).length;
  const targetsReached = products.filter(p =>
    p.target_price && p.current_price <= p.target_price
  ).length;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      {/* Header */}
      <header style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '16px 32px', borderBottom: '1px solid var(--border)',
        background: 'var(--bg2)', position: 'sticky', top: 0, zIndex: 10
      }}>
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
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <span style={{ color: 'var(--text3)', fontSize: 13 }}>{user.email}</span>
          <button onClick={() => setShowSettings(!showSettings)} style={{
            padding: '7px 14px', background: showSettings ? 'var(--bg3)' : 'transparent',
            border: '1px solid var(--border)', borderRadius: 8,
            color: 'var(--text2)', fontSize: 13, cursor: 'pointer'
          }}>⚙️ Settings</button>
          <button onClick={handleLogout} style={{
            padding: '7px 14px', background: 'transparent',
            border: '1px solid var(--border)', borderRadius: 8,
            color: 'var(--text2)', fontSize: 13, cursor: 'pointer'
          }}>Sign Out</button>
        </div>
      </header>

      <main style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 24px' }}>
        {/* Stats row */}
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 16, marginBottom: 28
        }}>
          {[
            { label: 'Products Tracked', value: totalTracked, icon: '📦', color: 'var(--accent)' },
            { label: 'Prices Dropped', value: totalDrops, icon: '📉', color: 'var(--green)' },
            { label: 'Targets Reached', value: targetsReached, icon: '🎯', color: 'var(--yellow)' },
          ].map(stat => (
            <div key={stat.label} style={{
              background: 'var(--card)', border: '1px solid var(--border)',
              borderRadius: 14, padding: '18px 20px',
              display: 'flex', alignItems: 'center', gap: 14
            }}>
              <span style={{ fontSize: 26 }}>{stat.icon}</span>
              <div>
                <p style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 700, color: stat.color, lineHeight: 1 }}>
                  {stat.value}
                </p>
                <p style={{ color: 'var(--text3)', fontSize: 12, marginTop: 4 }}>{stat.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Settings panel */}
        {showSettings && (
          <div style={{ marginBottom: 24, animation: 'fadeIn 0.3s ease' }}>
            <AlertSettings />
          </div>
        )}

        {/* Add product */}
        <div style={{ marginBottom: 28 }}>
          <AddProduct onAdded={handleProductAdded} />
        </div>

        {/* Products grid */}
        <div>
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            marginBottom: 16
          }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 18 }}>
              Tracked Products
              {totalTracked > 0 && (
                <span style={{
                  marginLeft: 10, background: 'var(--bg3)',
                  border: '1px solid var(--border)', borderRadius: 100,
                  padding: '2px 10px', fontSize: 13, color: 'var(--text2)',
                  fontWeight: 500
                }}>{totalTracked}</span>
              )}
            </h2>
            <p style={{ color: 'var(--text3)', fontSize: 13 }}>
              Checked daily at 9:00 AM IST
            </p>
          </div>

          {loading ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 16 }}>
              {[1, 2, 3].map(i => (
                <div key={i} style={{
                  background: 'var(--card)', border: '1px solid var(--border)',
                  borderRadius: 16, height: 160,
                  animation: 'pulse 1.5s ease infinite'
                }} />
              ))}
            </div>
          ) : products.length === 0 ? (
            <div style={{
              background: 'var(--card)', border: '1px solid var(--border)',
              borderRadius: 16, padding: '60px 20px', textAlign: 'center'
            }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>📦</div>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 18, marginBottom: 8 }}>
                No products tracked yet
              </h3>
              <p style={{ color: 'var(--text2)', fontSize: 14 }}>
                Paste a product URL above to start tracking prices!
              </p>
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
              gap: 16
            }}>
              {products.map(product => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onDelete={handleProductDeleted}
                  onUpdated={fetchProducts}
                />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
