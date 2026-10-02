import { useState } from 'react';
import api from '../api/api';

const SUGGESTIONS = [
  'How much revenue did we make this month?',
  'Which payment method is most popular?',
  'How many suspicious transactions were detected?',
  'Who are our top customers?',
];

export default function NLPAssistant() {
  const [messages, setMessages] = useState([
    { role: 'assistant', text: "Hi! Ask me about revenue, payment methods, fraud, or top customers." },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const send = async (question) => {
    const q = question || input;
    if (!q.trim()) return;
    setMessages((m) => [...m, { role: 'user', text: q }]);
    setInput('');
    setLoading(true);
    try {
      const { data } = await api.post('/nlp/ask', { question: q });
      setMessages((m) => [...m, { role: 'assistant', text: data.answer }]);
    } catch (err) {
      setMessages((m) => [...m, { role: 'assistant', text: err.response?.data?.error || 'Something went wrong.' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1>Business Assistant</h1>
      <div className="card chat-window">
        {messages.map((m, i) => (
          <div key={i} className={`chat-bubble chat-${m.role}`}>{m.text}</div>
        ))}
        {loading && <div className="chat-bubble chat-assistant">…</div>}
      </div>

      <div className="suggestions">
        {SUGGESTIONS.map((s) => (
          <button key={s} className="suggestion-chip" onClick={() => send(s)}>{s}</button>
        ))}
      </div>

      <form className="inline-form" onSubmit={(e) => { e.preventDefault(); send(); }}>
        <input placeholder="Ask a question about your business…" value={input} onChange={(e) => setInput(e.target.value)} />
        <button type="submit">Send</button>
      </form>
    </div>
  );
}
