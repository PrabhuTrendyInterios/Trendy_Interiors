import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

jest.mock('axios', () => ({ post: jest.fn() }));
const axios = require('axios');
const ChatBot = require('../../components/ChatBot').default;

beforeAll(() => {
  Element.prototype.scrollIntoView = jest.fn();
});

describe('client/components/ChatBot', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('opens and sends message', async () => {
    axios.post.mockResolvedValueOnce({ data: { success: true, message: 'Hello from server' } });

    render(<ChatBot />);
    fireEvent.click(screen.getByLabelText(/open chatbot/i));
    fireEvent.change(screen.getByPlaceholderText(/type your question/i), { target: { value: 'Hi' } });
    fireEvent.click(screen.getByLabelText(/send message/i));

    await waitFor(() => {
      expect(axios.post).toHaveBeenCalled();
    });
  });
});
