import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import Toast from './Toast';

describe('client/pages/admin/components/Toast (sibling)', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  test('renders message, subtitle and close button', () => {
    render(
      <Toast
        type="success"
        message="Saved successfully"
        subtitle="Everything is up to date"
        onClose={jest.fn()}
        autoClose={false}
      />
    );

    expect(screen.getByText(/saved successfully/i)).toBeInTheDocument();
    expect(screen.getByText(/everything is up to date/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/close notification/i)).toBeInTheDocument();
  });

  test('calls onClose on close button click', () => {
    const onClose = jest.fn();
    render(<Toast message="Saved" onClose={onClose} autoClose={false} />);

    fireEvent.click(screen.getByLabelText(/close notification/i));
    expect(onClose).toHaveBeenCalled();
  });

  test('auto closes after duration', () => {
    const onClose = jest.fn();
    render(<Toast message="Saved" onClose={onClose} duration={1200} />);

    act(() => {
      jest.advanceTimersByTime(1200);
    });

    expect(onClose).toHaveBeenCalled();
  });
});
