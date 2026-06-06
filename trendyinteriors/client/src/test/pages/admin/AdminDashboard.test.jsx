import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';

jest.mock('../../../context/AuthContext', () => ({
  useAuth: () => ({
    user: { name: 'Admin User', role: 'admin' },
    logout: jest.fn(),
  }),
}));

jest.mock('../../../pages/admin/components/FormCard', () => ({ title, children }) => (
  <section><h2>{title}</h2>{children}</section>
));
jest.mock('../../../pages/admin/components/DragDropUpload', () => () => <div>DragDropUpload Mock</div>);
jest.mock('../../../pages/admin/components/MultiImageUpload', () => () => <div>MultiImageUpload Mock</div>);
jest.mock('../../../pages/admin/components/Toast', () => ({ message, onClose }) =>
  message ? <div onClick={onClose}>{message}</div> : null
);

const CmsLayout = require('../../../pages/admin/CmsLayout').default;
const ProjectsPage = require('../../../pages/admin/pages/ProjectsPage').default;
const DashboardHome = require('../../../pages/admin/pages/DashboardHome').default;

describe('client/pages/admin CMS', () => {
  beforeEach(() => {
    global.fetch = jest.fn((url) => {
      if (url.includes('/api/cms/projects')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ success: true, count: 1, data: [{ _id: '1', title: 'Test Project', description: 'Desc', category: 'residential', image: 'img.jpg' }] }),
        });
      }
      if (url.includes('/api/cms/team-members')) {
        return Promise.resolve({ ok: true, json: async () => ({ success: true, count: 0, data: [] }) });
      }
      if (url.includes('/api/cms/rooms')) {
        return Promise.resolve({ ok: true, json: async () => ({ success: true, count: 0, data: [] }) });
      }
      if (url.includes('/api/cms/global-addons')) {
        return Promise.resolve({ ok: true, json: async () => ({ success: true, count: 0, data: [] }) });
      }
      return Promise.reject(new Error(`unexpected url: ${url}`));
    });
    localStorage.setItem('token', 'token-1');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('CMS layout renders dashboard with sidebar navigation', async () => {
    render(
      <MemoryRouter initialEntries={['/admin']}>
        <Routes>
          <Route path="/admin" element={<CmsLayout />}>
            <Route index element={<DashboardHome />} />
          </Route>
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('Overview of your content')).toBeInTheDocument();
    expect(screen.getByText('Content Manager')).toBeInTheDocument();
    await waitFor(() => expect(screen.getByText('Quick Actions')).toBeInTheDocument());
  });

  test('projects page loads CMS project form', async () => {
    render(
      <MemoryRouter initialEntries={['/admin/projects']}>
        <Routes>
          <Route path="/admin" element={<CmsLayout />}>
            <Route path="projects" element={<ProjectsPage />} />
          </Route>
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => expect(screen.getByText(/publish new project/i)).toBeInTheDocument());
    expect(screen.getByText('Test Project')).toBeInTheDocument();
  });
});
