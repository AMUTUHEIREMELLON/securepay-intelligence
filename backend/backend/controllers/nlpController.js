const Transaction = require('../models/Transaction');

/**
 * MVP "NLP" assistant: keyword-matches the question to one of a few
 * pre-built business queries and answers in natural language.
 *
 * This is a placeholder for Janet's real NLP component (project doc
 * section 16) — swap answerQuestion() for a call to an LLM/NLU service
 * once that's ready. Keeping the data-fetching functions separate makes
 * that swap easy: the real NLP layer can call the same helpers below.
 */

async function getRevenueThisMonth() {
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const [result] = await Transaction.aggregate([
    { $match: { status: 'Successful', timestamp: { $gte: startOfMonth } } },
    { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } },
  ]);
  return result || { total: 0, count: 0 };
}

async function getMostPopularPaymentMethod() {
  const [top] = await Transaction.aggregate([
    { $group: { _id: '$payment_method', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 1 },
  ]);
  return top;
}

async function getSuspiciousCount() {
  return Transaction.countDocuments({ $or: [{ is_fraud: true }, { status: 'Suspicious' }] });
}

async function getTopCustomers(limit = 5) {
  return Transaction.aggregate([
    { $match: { status: 'Successful' } },
    { $group: { _id: '$customer_id', totalSpend: { $sum: '$amount' } } },
    { $sort: { totalSpend: -1 } },
    { $limit: limit },
  ]);
}

// POST /api/nlp/ask  { question: "..." }
async function ask(req, res) {
  try {
    const question = (req.body.question || '').toLowerCase().trim();
    if (!question) return res.status(400).json({ error: 'question is required.' });

    if (question.includes('revenue')) {
      const { total, count } = await getRevenueThisMonth();
      return res.json({
        answer: `You've generated ${Math.round(total).toLocaleString()} this month across ${count} successful transactions.`,
      });
    }

    if (question.includes('payment method') || question.includes('most popular')) {
      const top = await getMostPopularPaymentMethod();
      return res.json({
        answer: top
          ? `${top._id} is the most popular payment method, used in ${top.count} transactions.`
          : 'No payment data available yet.',
      });
    }

    if (question.includes('suspicious') || question.includes('fraud')) {
      const count = await getSuspiciousCount();
      return res.json({ answer: `${count} suspicious/fraud-flagged transaction(s) have been detected so far.` });
    }

    if (question.includes('top') && question.includes('customer')) {
      const top = await getTopCustomers(5);
      const list = top.map((c, i) => `${i + 1}. ${c._id} (${Math.round(c.totalSpend).toLocaleString()})`).join(', ');
      return res.json({ answer: `Top customers by spend: ${list || 'no data yet'}.` });
    }

    return res.json({
      answer:
        "I can currently answer questions about: monthly revenue, the most popular payment method, suspicious/fraud counts, and top customers. Try asking one of those.",
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to process question.' });
  }
}

module.exports = { ask };
