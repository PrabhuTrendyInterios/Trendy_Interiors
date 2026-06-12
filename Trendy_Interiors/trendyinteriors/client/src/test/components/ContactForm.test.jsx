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
    jest.clearAllMocks();
  });

  test('renders contact form with user defaults', () => {
    render(<ContactForm formType="contact" />);
    expect(screen.getByDisplayValue('Asha')).toBeInTheDocument();
    expect(screen.getByDisplayValue('asha@example.com')).toBeInTheDocument();
  });

  test('renders testimonial form variant', () => {
    render(<ContactForm formType="testimonial" />);
    expect(screen.getByText(/testimonial/i)).toBeInTheDocument();
  });

  test('validates short contact message before submit', () => {
    render(<ContactForm formType="contact" />);

    fireEvent.change(screen.getByLabelText('Mobile Number'), { target: { value: '9876543210' } });
    fireEvent.change(screen.getByLabelText('Message'), { target: { value: 'short' } });
    fireEvent.click(screen.getByRole('button', { name: /send message/i }));

    expect(screen.queryByText(/at least 10 characters/i)).toBeTruthy();
  });

  test('handles name input change', () => {
    render(<ContactForm formType="contact" />);
    const nameInput = screen.getByDisplayValue('Asha');
    fireEvent.change(nameInput, { target: { value: 'John' } });
    expect(nameInput.value).toBe('John');
  });

  test('handles email input change', () => {
    render(<ContactForm formType="contact" />);
    const emailInput = screen.getByDisplayValue('asha@example.com');
    fireEvent.change(emailInput, { target: { value: 'john@test.com' } });
    expect(emailInput.value).toBe('john@test.com');
  });

  test('handles mobile number input change', () => {
    render(<ContactForm formType="contact" />);
    const mobileInput = screen.getByLabelText('Mobile Number');
    fireEvent.change(mobileInput, { target: { value: '9876543210' } });
    expect(mobileInput.value).toBe('9876543210');
  });

  test('handles message input change', () => {
    render(<ContactForm formType="contact" />);
    const messageInput = screen.getByLabelText('Message');
    fireEvent.change(messageInput, { target: { value: 'This is a detailed message with more than 10 characters' } });
    expect(messageInput.value).toBe('This is a detailed message with more than 10 characters');
  });

  test('renders submit button', () => {
    render(<ContactForm formType="contact" />);
    expect(screen.getByRole('button', { name: /send message/i })).toBeInTheDocument();
  });

  test('renders testimonial submit button', () => {
    render(<ContactForm formType="testimonial" />);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });
});
