describe('client/socketClient', () => {
  test('initializes socket connection', () => {
    let mockIo;

    jest.resetModules();
    jest.doMock('socket.io-client', () => {
      mockIo = jest.fn(() => ({
        on: jest.fn(),
        id: 'socket-1',
        disconnect: jest.fn(),
      }));

      return { __esModule: true, io: mockIo };
    });

    jest.isolateModules(() => {
      require('../socketClient');
    });

    expect(mockIo).toHaveBeenCalled();
  });
});
