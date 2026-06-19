const express = require('express');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

const accounts = new Map();
let nextAccountId = 1;

function createAccount(owner, balance = 0) {
  const account = {
    id: String(nextAccountId++),
    owner: owner.trim(),
    balance: Number(balance),
    createdAt: new Date().toISOString(),
  };
  accounts.set(account.id, account);
  return account;
}

app.get('/health', (req, res) => {
  res.json({ service: 'account-service', status: 'ok' });
});

app.get('/accounts', (req, res) => {
  res.json([...accounts.values()]);
});

app.get('/accounts/:id', (req, res) => {
  const account = accounts.get(req.params.id);
  if (!account) {
    return res.status(404).json({ error: 'Account not found.' });
  }
  res.json(account);
});

app.post('/accounts', (req, res) => {
  const { owner, balance } = req.body;
  if (typeof owner !== 'string' || !owner.trim()) {
    return res.status(400).json({ error: 'Owner name is required.' });
  }
  const initialBalance = Number(balance || 0);
  if (Number.isNaN(initialBalance) || initialBalance < 0) {
    return res.status(400).json({ error: 'Balance must be a non-negative number.' });
  }

  const account = createAccount(owner, initialBalance);
  res.status(201).json(account);
});

app.patch('/accounts/:id/deposit', (req, res) => {
  const account = accounts.get(req.params.id);
  if (!account) {
    return res.status(404).json({ error: 'Account not found.' });
  }

  const amount = Number(req.body.amount);
  if (Number.isNaN(amount) || amount <= 0) {
    return res.status(400).json({ error: 'Deposit amount must be a positive number.' });
  }

  account.balance += amount;
  res.json(account);
});

app.patch('/accounts/:id/withdraw', (req, res) => {
  const account = accounts.get(req.params.id);
  if (!account) {
    return res.status(404).json({ error: 'Account not found.' });
  }

  const amount = Number(req.body.amount);
  if (Number.isNaN(amount) || amount <= 0) {
    return res.status(400).json({ error: 'Withdraw amount must be a positive number.' });
  }

  if (amount > account.balance) {
    return res.status(400).json({ error: 'Insufficient funds for withdrawal.' });
  }

  account.balance -= amount;
  res.json(account);
});

app.listen(port, () => {
  console.log(`Account Service listening at http://localhost:${port}`);
});
