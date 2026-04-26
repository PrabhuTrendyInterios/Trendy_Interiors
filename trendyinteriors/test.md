# Testing Guide - Trendy Interiors

## Client Tests

Tests are organized in `client/test/` folder with source code in `client/src/`.

### Run All Client Tests (Watch Mode)
```bash
cd client
npm test
```

### Run All Client Tests (CI Mode - Single Run)
```bash
cd client
CI=true npm test
```

### Run Specific Test File
```bash
cd client
npm test -- ChangePasswordModal.test
```

### Run Tests with Coverage Report
```bash
cd client
npm test -- --coverage
```

### Run Tests from test/ Folder
```bash
cd client
npm test -- --testPathPattern=test/
```

---

## Server Tests

Tests are located in `server/tests/` folder.

### Run All Server Tests
```bash
cd server
npm test
```

### Run All Server Tests (Watch Mode)
```bash
cd server
npm test -- --watch
```

### Run Server Tests with Coverage Report
```bash
cd server
npm test -- --coverage
```

### Run Specific Test File
```bash
cd server
npm test -- controllers.test.js
```

### Run Jest Directly (Alternative)
```bash
cd server
jest
jest --watch
jest --coverage
```

---

## Run Both Client and Server Tests

### Sequential Execution (One after Another)
```bash
# From workspace root
cd client && CI=true npm test && cd .. && cd server && npm test
```

### Parallel Execution (Open Two Terminals)

**Terminal 1 - Client:**
```bash
cd client
npm test
```

**Terminal 2 - Server:**
```bash
cd server
npm test
```

---

## Test File Structure

### Client
```
client/
├── src/                           # Source code
├── test/                          # All test files
│   ├── components/
│   ├── pages/
│   ├── context/
│   └── utils/
└── package.json
```

### Server
```
server/
├── controllers/                   # Source code
├── models/
├── routes/
├── middleware/
├── tests/                         # Test files
│   ├── controllers/~
│   ├── models/
│   ├── routes/
│   └── middleware/
├── jest.config.js
└── package.json
```

---

## Key Test Commands Summary

| Task | Command |
|------|---------|
| Run all client tests | `cd client && npm test` |
| Run all server tests | `cd server && npm test` |
| Client tests (one run) | `cd client && CI=true npm test` |
| Server tests with coverage | `cd server && npm test -- --coverage` |
| Watch mode (client) | `cd client && npm test` |
| Watch mode (server) | `cd server && npm test -- --watch` |
