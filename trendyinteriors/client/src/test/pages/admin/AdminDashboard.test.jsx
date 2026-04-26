import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

jest.mock('../../../pages/admin/components/AdminNavigation', () => ({ activeTab }) => <div>Nav {activeTab}</div>);
jest.mock('../../../pages/admin/components/FormCard', () => ({ title, children }) => <section><h2>{title}</h2>{children}</section>);
jest.mock('../../../pages/admin/components/DragDropUpload', () => () => <div>DragDropUpload Mock</div>);
jest.mock('../../../pages/admin/components/MultiImageUpload', () => () => <div>MultiImageUpload Mock</div>);
jest.mock('../../../pages/admin/components/Toast', () => ({ message }) => <div>{message}</div>);
jest.mock('../../../pages/admin/components/DeleteConfirmationModal', () => () => null);

const AdminDashboard = require('../../../pages/admin/AdminDashboard').default;

describe('client/pages/admin/AdminDashboard', () => {
  beforeEach(() => {
    global.fetch = jest.fn((url) => {
      if (url.includes('/api/projects')) return Promise.resolve({ ok: true, json: async () => ({ success: true, data: [] }) });
      if (url.includes('/api/testimonials')) return Promise.resolve({ ok: true, json: async () => ({ success: true, data: [] }) });
      if (url.includes('/api/contacts')) return Promise.resolve({ ok: true, json: async () => ({ success: true, data: [] }) });
      if (url.includes('/api/team-members')) return Promise.resolve({ ok: true, json: async () => ({ success: true, data: [] }) });
      if (url.includes('/api/services')) return Promise.resolve({ ok: true, json: async () => ({ success: true, data: [] }) });
      if (url.includes('/api/designs')) return Promise.resolve({ ok: true, json: async () => ({ success: true, data: [] }) });
      return Promise.reject(new Error('unexpected'));
    });
    localStorage.setItem('token', 'token-1');
  });

  test('loads dashboard and shows projects form', async () => {
    render(
      <MemoryRouter>
        <AdminDashboard />
      </MemoryRouter>
    );

    await waitFor(() => expect(screen.getByText(/publish new project/i)).toBeInTheDocument());
    expect(screen.getByText(/nav projects/i)).toBeInTheDocument();
  });
});
