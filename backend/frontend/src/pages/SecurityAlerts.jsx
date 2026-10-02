import { useEffect, useState } from 'react';
import api from '../api/api';

export default function SecurityAlerts() {
  const [summary, setSummary] = useState(null);
  const [events, setEvents] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [error, setError] = useState('');

  const load = async () => {
    try {
      const [dashRes, eventsRes, alertsRes] = await Promise.all([
        api.get('/security/dashboard'),
        api.get('/security/events?limit=20'),
        api.get('/security/alerts?status=open'),
      ]);
      setSummary(dashRes.data);
      setEvents(eventsRes.data.items);
      setAlerts(alertsRes.data.items);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load security data.');
    }
  };

  useEffect(() => { load(); }, []);

  const resolveAlert = async (id, status) => {
    await api.patch(`/security/alerts/${id}`, { status });
    load();
  };

  if (error) return <div className="alert alert-error">{error}</div>;
  if (!summary) return <p>Loading…</p>;

  return (
    <div>
      <h1>Security Operations</h1>

      <div className="kpi-grid">
        <KpiCard label="Failed Logins (24h)" value={summary.failedLogins24h} highlight={summary.failedLogins24h > 10} />
        <KpiCard label="Open Fraud Alerts" value={summary.openAlerts} highlight={summary.openAlerts > 0} />
        <KpiCard label="Locked Accounts" value={summary.lockedAccounts} highlight={summary.lockedAccounts > 0} />
        <KpiCard label="Critical Events (24h)" value={summary.criticalEvents24h} highlight={summary.criticalEvents24h > 0} />
        <KpiCard label="Total Events (24h)" value={summary.totalEvents24h} />
      </div>

      <div className="card">
        <h3>Open Fraud Alerts</h3>
        <table>
          <thead>
            <tr><th>Transaction</th><th>Risk</th><th>Severity</th><th>Reason</th><th>Action</th></tr>
          </thead>
          <tbody>
            {alerts.map((a) => (
              <tr key={a._id}>
                <td>{a.transaction_id}</td>
                <td>{a.risk_score}</td>
                <td><span className={`badge badge-${a.severity}`}>{a.severity}</span></td>
                <td>{(a.reason || []).join('; ')}</td>
                <td>
                  <button onClick={() => resolveAlert(a._id, 'confirmed_fraud')}>Confirm</button>
                  <button onClick={() => resolveAlert(a._id, 'false_positive')}>False positive</button>
                </td>
              </tr>
            ))}
            {alerts.length === 0 && <tr><td colSpan={5}>No open alerts.</td></tr>}
          </tbody>
        </table>
      </div>

      <div className="card">
        <h3>Recent Security Events (Audit Trail)</h3>
        <table>
          <thead>
            <tr><th>Time</th><th>Event</th><th>Severity</th><th>Description</th></tr>
          </thead>
          <tbody>
            {events.map((e) => (
              <tr key={e._id}>
                <td>{new Date(e.timestamp).toLocaleString()}</td>
                <td>{e.event_type}</td>
                <td><span className={`badge badge-${e.severity}`}>{e.severity}</span></td>
                <td>{e.description}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function KpiCard({ label, value, highlight }) {
  return (
    <div className={`card kpi-card ${highlight ? 'kpi-alert' : ''}`}>
      <div className="kpi-value">{value}</div>
      <div className="kpi-label">{label}</div>
    </div>
  );
}
