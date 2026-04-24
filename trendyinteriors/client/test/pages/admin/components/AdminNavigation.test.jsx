import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import AdminNavigation from './AdminNavigation';

describe('client/pages/admin/components/AdminNavigation', () => {
  test('renders tabs and switches active tab', () => {
    const setActiveTab = jest.fn();
    render(<AdminNavigation activeTab="projects" setActiveTab={setActiveTab} />);

    expect(screen.getByRole('button', { name: /projects/i })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /services/i }));
    expect(setActiveTab).toHaveBeenCalledWith('services');
  });
});
