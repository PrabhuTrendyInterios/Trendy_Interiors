jest.mock('react-dom/client', () => ({
  createRoot: jest.fn(() => ({ render: jest.fn() })),
}));
jest.mock('../App', () => () => null);
jest.mock('../socketClient', () => ({}));

describe('client/index bootstrap', () => {
  test('imports without crashing', () => {
    expect(() => require('../index')).not.toThrow();
  });
});
