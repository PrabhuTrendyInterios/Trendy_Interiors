import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

jest.mock('axios', () => ({ post: jest.fn() }));
jest.mock('../../context/AuthContext', () => ({ useAuth: jest.fn() }));

const axios = require('axios');
const { useAuth } = require('../../context/AuthContext');
const ContactForm = require('../../components/ContactForm').default;

describe('client/components/ContactForm', () => {
  beforeEach(() => {
    useAuth.mockReturnValue({ user: { name: 'Asha', email: 'asha@example.com' } });
    global.fetch = jest.fn();
    localStorage.clear();
  });

  test('renders contact form with user defaults', () => {
    render(<ContactForm formType="contact" />);
    expect(screen.getByDisplayValue('Asha')).toBeInTheDocument();
    expect(screen.getByDisplayValue('asha@example.com')).toBeInTheDocument();
  });

  test('validates short contact message before submit', async () => {
    render(<ContactForm formType="contact" />);

    fireEvent.change(screen.getByLabelText('Mobile Number'), { target: { value: '9876543210' } });
    fireEvent.change(screen.getByLabelText('Message'), { target: { value: 'short' } });
    fireEvent.click(screen.getByRole('button', { name: /send message/i }));

    expect(await screen.findByText(/at least 10 characters/i)).toBeInTheDocument();
    expect(global.fetch).not.toHaveBeenCalled();
  });

  test('submits testimonial successfully', async () => {
    axios.post.mockResolvedValueOnce({ data: { success: true } });
    render(<ContactForm formType="testimonial" />);

    fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Asha' } });
    fireEvent.change(screen.getByLabelText(/location \/ project/i), { target: { value: 'Erode' } });
    fireEvent.change(screen.getByLabelText(/your experience/i), { target: { value: 'This is a wonderful interior design experience.' } });
    fireEvent.click(screen.getByRole('button', { name: /submit testimonial/i }));

    await waitFor(() => expect(screen.getByText(/has been sent successfully/i)).toBeInTheDocument());
  });
});
