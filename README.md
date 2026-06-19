# Banking Microservices Demo

A Node.js banking microservices demo with three services:

- `Account Service` — manages account creation, deposits, and withdrawals.
- `Transaction Service` — performs transfers between accounts.
- `Gateway` — serves the browser UI and forwards requests to backend services.

## Structure

- `server.js` — gateway service entry point.
- `public/` — browser UI for creating accounts and transferring funds.
- `services/account-service/` — account microservice.
- `services/transaction-service/` — transaction microservice.
- `services/gateway-service/` — alternate gateway implementation (not required for root startup).

## Run locally

1. Make sure Node.js 18 or later is installed.
2. Open a terminal in this folder.
3. Run `npm run bootstrap`.
4. Run `npm start`.
5. Open `http://localhost:3000`.

## Endpoints

- `GET /health` — gateway health check.
- `GET /accounts` — list all bank accounts.
- `POST /accounts` — create a new account.
- `POST /transactions/transfer` — move funds between accounts.

## Notes

- The gateway forwards account operations to `Account Service` and transfer operations to `Transaction Service`.
- The browser UI is served by the gateway at `http://localhost:3000`.
- Accounts are stored in memory, making this a demo-ready banking system.

## Optional service startup

- `npm run start:account` — start account service only.
- `npm run start:transaction` — start transaction service only.
- `npm run start:gateway` — start gateway only.
