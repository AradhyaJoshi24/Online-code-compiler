const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
const port = process.env.PORT || 3002;
const accountServiceUrl = process.env.ACCOUNT_SERVICE_URL || 'http://localhost:3001';

app.use(cors());
app.use(express.json());

async function getAccount(accountId) {
  const response = await axios.get(`${accountServiceUrl}/accounts/${accountId}`);
  return response.data;
}

async function deposit(accountId, amount) {
  const response = await axios.patch(`${accountServiceUrl}/accounts/${accountId}/deposit`, { amount });
  return response.data;
}

async function withdraw(accountId, amount) {
  const response = await axios.patch(`${accountServiceUrl}/accounts/${accountId}/withdraw`, { amount });
  return response.data;
}

app.get('/health', (req, res) => {
  res.json({ service: 'transaction-service', status: 'ok' });
});

app.post('/transactions/transfer', async (req, res) => {
  try {
    const { fromAccountId, toAccountId, amount } = req.body;
    const transferAmount = Number(amount);

    if (!fromAccountId || !toAccountId) {
      return res.status(400).json({ error: 'Both source and destination account IDs are required.' });
    }
    if (fromAccountId === toAccountId) {
      return res.status(400).json({ error: 'Cannot transfer to the same account.' });
    }
    if (Number.isNaN(transferAmount) || transferAmount <= 0) {
      return res.status(400).json({ error: 'Transfer amount must be a positive number.' });
    }

    const sourceAccount = await getAccount(fromAccountId);
    const destinationAccount = await getAccount(toAccountId);

    if (transferAmount > sourceAccount.balance) {
      return res.status(400).json({ error: 'Insufficient balance in the source account.' });
    }

    await withdraw(fromAccountId, transferAmount);
    await deposit(toAccountId, transferAmount);

    res.json({
      transaction: {
        fromAccountId,
        toAccountId,
        amount: transferAmount,
        completedAt: new Date().toISOString(),
      },
      sourceAccount: await getAccount(fromAccountId),
      destinationAccount: await getAccount(toAccountId),
    });
  } catch (error) {
    if (error.response && error.response.data) {
      return res.status(error.response.status || 500).json(error.response.data);
    }

    res.status(500).json({ error: 'Unable to complete transaction.' });
  }
});

app.listen(port, () => {
  console.log(`Transaction Service listening at http://localhost:${port}`);
});
