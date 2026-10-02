import { useEffect, useState } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend } from 'recharts';
import api from '../api/api';
import { useAuth } from '../context/AuthContext';

const COLORS = ['#2563eb', '#16a34a', '#dc2626', '#ca8a04', '#7c3aed'];

export default function Dashboard() {
  const { user } = useAuth();
  const [kpis, setKpis] = useState(null);
  const [methods, setMethods] = useState([]);
  const [segments, setSegments] = useState(null);
  const [error, setError] = useState('');

  const canSeeBi = ['admin', 'business_manager', 'security_admin'].includes(user.role);

  useEffect(() => {
    if (!canSeeBi) return;
    (async () => {
      try {
        const [kpiRes, methodRes, segRes] = await Promise.all([
          api.get('/bi/kpis'),
          api.get('/bi/payment-methods'),
          api.get('/bi/customers/segments'),
        ]);
        setKpis(kpiRes.data);
        setMethods(methodRes.data.items.map((m) => ({ name: m._id, count: m.count })));
        setSegments(segRes.data.segments);
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to load dashboard data.');
      }
    })();
  }, [canSeeBi]);

  if (!canSeeBi) {
    return (
      <div className="card">
        <h2>Welcome, {user.name}</h2>
        <p>Your role ({user.role}) doesn't have access to the BI dashboard. Use the payment flow to test transactions.</p>
      </div>
    );
  }

  if (error) return <div className="alert alert-error">{error}</div>;
  if (!kpis) return <p>Loading…</p>;

  const segmentData = segments
    ? Object.entries(segments).map(([name, value]) => ({ name, value }))
    : [];

  return (
    <div>
      <h1>Business Intelligence Dashboard</h1>
      <div className="kpi-grid">
        <KpiCard label="Total Revenue" value={kpis.totalRevenue.toLocaleString()} />
        <KpiCard label="Total Transactions" value={kpis.totalTransactions} />
        <KpiCard label="Success Rate" value={`${kpis.successfulTransactionRate}%`} />
        <KpiCard label="Fraud Detection Rate" value={`${kpis.fraudDetectionRate}%`} />
        <KpiCard label="Avg Transaction Value" value={kpis.averageTransactionValue.toLocaleString()} />
        <KpiCard label="Total Customers" value={kpis.totalCustomers} />
      </div>

      <div className="chart-grid">
        <div className="card">
          <h3>Payment Methods</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={methods}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#2563eb" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <h3>Customer Segments</h3>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={segmentData} dataKey="value" nameKey="name" outerRadius={90} label>
                {segmentData.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Legend />
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

function KpiCard({ label, value }) {
  return (
    <div className="card kpi-card">
      <div className="kpi-value">{value}</div>
      <div className="kpi-label">{label}</div>
    </div>
  );
}
