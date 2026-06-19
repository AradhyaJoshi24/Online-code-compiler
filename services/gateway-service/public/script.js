const gatewayUrl = '';
const statusOutput = document.getElementById('statusOutput');
const accountsList = document.getElementById('accountsList');
const refreshAccountsBtn = document.getElementById('refreshAccountsBtn');
const createAccountForm = document.getElementById('createAccountForm');
const transferForm = document.getElementById('transferForm');

async function request(path, options = {}) {
  const response = await fetch(gatewayUrl + path, options);
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Request failed');
  }
  return data;
}

function renderStatus(message) {
  statusOutput.textContent = message;
}

function renderAccounts(accounts) {
  if (!accounts || !accounts.length) {
    accountsList.innerHTML = '<div class="empty">No accounts yet. Create one.</div>';
    return;
  }

  accountsList.innerHTML = accounts
    .map(account => `
      <div class="account-card">
        <div><strong>ID:</strong> ${account.id}</div>
        <div><strong>Owner:</strong> ${account.owner}</div>
        <div><strong>Balance:</strong> $${account.balance.toFixed(2)}</div>
        <div><strong>Created:</strong> ${new Date(account.createdAt).toLocaleString()}</div>
      </div>
    `)
    .join('');
}

async function loadAccounts() {
  try {
    const accounts = await request('/accounts');
    renderAccounts(accounts);
    renderStatus('Accounts loaded successfully.');
  } catch (error) {
    renderStatus(`Unable to load accounts: ${error.message}`);
    accountsList.innerHTML = '<div class="empty">Unable to load account data.</div>';
  }
}

async function checkHealth() {
  try {
    const response = await fetch('/health');
    if (!response.ok) throw new Error('Gateway unavailable');
    renderStatus('Gateway service is running.');
  } catch (error) {
    renderStatus(`Gateway health check failed: ${error.message}`);
  }
}

createAccountForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const owner = document.getElementById('ownerName').value;
  const balance = Number(document.getElementById('initialBalance').value);

  try {
    await request('/accounts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ owner, balance }),
    });
    renderStatus('Account created successfully.');
    createAccountForm.reset();
    loadAccounts();
  } catch (error) {
    renderStatus(`Account creation failed: ${error.message}`);
  }
});

transferForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const fromAccountId = document.getElementById('fromAccount').value;
  const toAccountId = document.getElementById('toAccount').value;
  const amount = Number(document.getElementById('transferAmount').value);

  try {
    await request('/transactions/transfer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fromAccountId, toAccountId, amount }),
    });
    renderStatus('Transfer completed successfully.');
    transferForm.reset();
    loadAccounts();
  } catch (error) {
    renderStatus(`Transfer failed: ${error.message}`);
  }
});

refreshAccountsBtn.addEventListener('click', loadAccounts);

window.addEventListener('load', async () => {
  await checkHealth();
  await loadAccounts();
});
