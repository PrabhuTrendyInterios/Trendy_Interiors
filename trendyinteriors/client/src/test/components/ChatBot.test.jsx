import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

jest.mock('axios', () => ({ get: jest.fn(), post: jest.fn() }));
const axios = require('axios');
const ChatBot = require('../../components/ChatBot').default;

beforeAll(() => {
  Element.prototype.scrollIntoView = jest.fn();
});

describe('client/components/ChatBot', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    axios.get.mockResolvedValue({ data: { data: { contactPhone: '+91 99652 99777' } } });
  });

  test('opens and sends message', async () => {
    axios.post.mockResolvedValueOnce({ data: { success: true, message: 'Hello from server' } });

    render(
      <MemoryRouter initialEntries={['/']}>
        <ChatBot />
      </MemoryRouter>
    );
    fireEvent.click(screen.getByLabelText(/open chatbot/i));
    fireEvent.change(screen.getByPlaceholderText(/type your question/i), { target: { value: 'Hi' } });
    fireEvent.click(screen.getByLabelText(/send message/i));

    await waitFor(() => {
      expect(axios.post).toHaveBeenCalled();
    });
  });

  test('shows estimator step speech message', () => {
    render(
      <MemoryRouter initialEntries={['/estimator']}>
        <ChatBot estimatorStep={2} />
      </MemoryRouter>
    );

    expect(screen.getByText('TiJo here, select the dimensions of the page')).toBeInTheDocument();
  });

  test('shows page-specific speech message outside estimator', () => {
    render(
      <MemoryRouter initialEntries={['/reachus']}>
        <ChatBot />
      </MemoryRouter>
    );

    expect(screen.getByText('TiJo here, contact us for your dream interiors')).toBeInTheDocument();
  });
});
