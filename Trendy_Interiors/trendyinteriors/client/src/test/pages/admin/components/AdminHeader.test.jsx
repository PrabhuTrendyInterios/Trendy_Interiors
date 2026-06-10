import React from 'react';
import { render, screen } from '@testing-library/react';
import AdminHeader from '../../../../pages/admin/components/AdminHeader';

describe('client/pages/admin/components/AdminHeader', () => {
  test('renders admin welcome message', () => {
    render(<AdminHeader userName="Asha" />);
    expect(screen.getByText(/admin dashboard/i)).toBeInTheDocument();
    expect(screen.getByText(/welcome back, asha/i)).toBeInTheDocument();
  });
});
