import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend
} from 'recharts';

function formatDate(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
}

const SITE_COLORS = {
  amazon: '#f59e0b',
  flipkart: '#3b82f6',
  croma: '#8b5cf6',
  reliance_digital: '#10b981',
  meesho: '#ec4899',
  other: '#6366f1'
};

export default function PriceChart({ priceHistory, currency = 'INR' }) {
  if (!priceHistory || priceHistory.length === 0) {
    return (
      <div style={{
        height: 200, display: 'flex', alignItems: 'center',
        justifyContent: 'center', color: 'var(--text3)', fontSize: 14
      }}>
        No price history yet. Check back tomorrow!
      </div>
    );
  }

  // Group by date and site
  const byDate = {};
  priceHistory.forEach(entry => {
    const date = formatDate(entry.checked_at);
    if (!byDate[date]) byDate[date] = { date };
    byDate[date][entry.site] = entry.price;
  });

  const data = Object.values(byDate);
  const sites = [...new Set(priceHistory.map(e => e.site))];

  const symbol = currency === 'INR' ? '₹' : '$';

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
      <div style={{
        background: 'var(--bg2)', border: '1px solid var(--border)',
        borderRadius: 10, padding: '12px 16px', fontSize: 13
      }}>
        <p style={{ fontWeight: 600, marginBottom: 6, color: 'var(--text2)' }}>{label}</p>
        {payload.map(p => (
          <p key={p.name} style={{ color: p.color, margin: '2px 0' }}>
            {p.name}: {symbol}{Number(p.value).toLocaleString('en-IN')}
          </p>
        ))}
      </div>
    );
  };

  return (
    <ResponsiveContainer width="100%" height={280}>
      <LineChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
        <XAxis
          dataKey="date" stroke="var(--text3)" fontSize={12}
          tickLine={false} axisLine={false}
        />
        <YAxis
          stroke="var(--text3)" fontSize={12}
          tickLine={false} axisLine={false}
          tickFormatter={v => `${symbol}${Number(v).toLocaleString('en-IN')}`}
          width={80}
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend
          formatter={val => <span style={{ color: 'var(--text2)', fontSize: 12, textTransform: 'capitalize' }}>{val}</span>}
        />
        {sites.map(site => (
          <Line
            key={site}
            type="monotone"
            dataKey={site}
            stroke={SITE_COLORS[site] || '#6366f1'}
            strokeWidth={2}
            dot={{ r: 4, fill: SITE_COLORS[site] || '#6366f1' }}
            activeDot={{ r: 6 }}
            connectNulls
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}
