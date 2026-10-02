import { useEffect, useState } from 'react';
import api from '../api/api';

export default function Transactions() {
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ customer_id: '', amount: '', payment_method: 'Mobile Money', location: '', device: '' });
  const [submitMsg, setSubmitMsg] = useState('');

  const load = async (p = 1) => {
    try {
      const { data } = await api.get(`/transactions?page=${p}&limit=15`);
      setItems(data.items);
      setPage(data.page);
      setPages(data.pages);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load transactions.');
    }
  };

  useEffect(() => { load(1); }, []);

  const handleSimulate = async (e) => {
    e.preventDefault();
    setSubmitMsg('');
    try {
      const { data } = await api.post('/transactions', { ...form, amount: parseFloat(form.amount) });
      setSubmitMsg(`Created ${data.transaction.transaction_id} — risk score ${data.risk.score} (${data.risk.severity})`);
      setForm({ customer_id: '', amount: '', payment_method: 'Mobile Money', location: '', device: '' });
      load(1);
    } catch (err) {
      setSubmitMsg(err.response?.data?.error || 'Failed to create transaction.');
    }
  };

  return (
    <div>
      <h1>Transactions</h1>

      <div className="card">
        <h3>Simulate a payment</h3>
        <form className="inline-form" onSubmit={handleSimulate}>
          <input placeholder="Customer ID" value={form.customer_id} onChange={(e) => setForm({ ...form, customer_id: e.target.value })} required />
          <input placeholder="Amount" type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} required />
          <select value={form.payment_method} onChange={(e) => setForm({ ...form, payment_method: e.target.value })}>
            <option>Mobile Money</option>
            <option>Bank Transfer</option>
            <option>Card</option>
          </select>
          <input placeholder="Location" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
          <input placeholder="Device" value={form.device} onChange={(e) => setForm({ ...form, device: e.target.value })} />
          <button type="submit">Simulate payment</button>
        </form>
        {submitMsg && <p className="muted">{submitMsg}</p>}
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="card">
        <table>
          <thead>
            <tr>
              <th>Transaction ID</th><th>Customer</th><th>Amount</th><th>Method</th><th>Status</th><th>Risk</th><th>Fraud</th>
            </tr>
          </thead>
          <tbody>
            {items.map((t) => (
              <tr key={t.transaction_id} className={t.is_fraud ? 'row-fraud' : ''}>
                <td>{t.transaction_id}</td>
                <td>{t.customer_id}</td>
                <td>{t.amount.toLocaleString()}</td>
                <td>{t.payment_method}</td>
                <td>{t.status}</td>
                <td>{t.risk_score}</td>
                <td>{t.is_fraud ? 'Yes' : 'No'}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="pagination">
          <button disabled={page <= 1} onClick={() => load(page - 1)}>Prev</button>
          <span>Page {page} of {pages}</span>
          <button disabled={page >= pages} onClick={() => load(page + 1)}>Next</button>
        </div>
      </div>
    </div>
  );
}
