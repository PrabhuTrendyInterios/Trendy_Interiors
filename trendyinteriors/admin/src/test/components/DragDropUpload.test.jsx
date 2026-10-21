import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import DragDropUpload from '../../components/DragDropUpload';

// Suppress CSS import errors in test environment
jest.mock('../../components/DragDropUpload.css', () => ({}), { virtual: true });

const mockFetch = jest.fn();
global.fetch = mockFetch;

beforeEach(() => {
  mockFetch.mockReset();
  localStorage.clear();
});

const makeSuccessResponse = (url = 'https://lh3.googleusercontent.com/d/FILE1') => ({
  ok: true,
  json: async () => ({ success: true, data: { fileId: 'FILE1', url } }),
});

describe('admin/components/DragDropUpload', () => {
  test('renders upload zone when no imageUrl provided', () => {
    render(<DragDropUpload onImageUrlChange={jest.fn()} imageUrl="" />);
    expect(screen.getByText(/drag & drop/i)).toBeInTheDocument();
  });

  test('renders preview when imageUrl is provided', () => {
    render(
      <DragDropUpload
        onImageUrlChange={jest.fn()}
        imageUrl="https://lh3.googleusercontent.com/d/EXISTING"
      />
    );
    expect(screen.getByAltText('Preview')).toBeInTheDocument();
    expect(screen.getByText(/image uploaded successfully/i)).toBeInTheDocument();
  });

  test('calls onImageUrlChange with "" when clear button is clicked', () => {
    const onChange = jest.fn();
    render(
      <DragDropUpload
        onImageUrlChange={onChange}
        imageUrl="https://lh3.googleusercontent.com/d/EXISTING"
      />
    );
    fireEvent.click(screen.getByTitle('Remove image'));
    expect(onChange).toHaveBeenCalledWith('');
  });

  test('uploads file without folder param when folder prop is empty', async () => {
    mockFetch.mockResolvedValue(makeSuccessResponse());
    const onChange = jest.fn();

    render(<DragDropUpload onImageUrlChange={onChange} imageUrl="" folder="" />);

    const input = document.querySelector('input[type="file"]');
    const file = new File(['img'], 'test.jpg', { type: 'image/jpeg' });
    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => expect(onChange).toHaveBeenCalled());

    const fetchUrl = mockFetch.mock.calls[0][0];
    expect(fetchUrl).not.toContain('folder=');
    expect(fetchUrl).toContain('/api/upload');
  });

  test('uploads to projects folder when folder="projects"', async () => {
    mockFetch.mockResolvedValue(
      makeSuccessResponse('https://lh3.googleusercontent.com/d/PROJ_FILE')
    );
    const onChange = jest.fn();

    render(<DragDropUpload onImageUrlChange={onChange} imageUrl="" folder="projects" />);

    const input = document.querySelector('input[type="file"]');
    const file = new File(['img'], 'cover.jpg', { type: 'image/jpeg' });
    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => expect(onChange).toHaveBeenCalled());

    const fetchUrl = mockFetch.mock.calls[0][0];
    expect(fetchUrl).toContain('folder=projects');
    expect(onChange).toHaveBeenCalledWith('https://lh3.googleusercontent.com/d/PROJ_FILE');
  });

  test('uploads to team-members folder when folder="team-members"', async () => {
    mockFetch.mockResolvedValue(
      makeSuccessResponse('https://lh3.googleusercontent.com/d/TEAM_FILE')
    );
    const onChange = jest.fn();

    render(<DragDropUpload onImageUrlChange={onChange} imageUrl="" folder="team-members" />);

    const input = document.querySelector('input[type="file"]');
    const file = new File(['img'], 'headshot.png', { type: 'image/png' });
    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => expect(onChange).toHaveBeenCalled());

    const fetchUrl = mockFetch.mock.calls[0][0];
    expect(fetchUrl).toContain('folder=team-members');
    expect(onChange).toHaveBeenCalledWith('https://lh3.googleusercontent.com/d/TEAM_FILE');
  });

  test('sends Authorization header when token is in localStorage', async () => {
    localStorage.setItem('token', 'my-jwt-token');
    mockFetch.mockResolvedValue(makeSuccessResponse());
    const onChange = jest.fn();

    render(<DragDropUpload onImageUrlChange={onChange} imageUrl="" folder="projects" />);

    const input = document.querySelector('input[type="file"]');
    fireEvent.change(input, { target: { files: [new File(['x'], 'x.jpg', { type: 'image/jpeg' })] } });

    await waitFor(() => expect(mockFetch).toHaveBeenCalled());

    const fetchOptions = mockFetch.mock.calls[0][1];
    expect(fetchOptions.headers).toEqual({ Authorization: 'Bearer my-jwt-token' });
  });

  test('shows error message on upload failure', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      json: async () => ({ error: 'Drive quota exceeded' }),
    });

    render(<DragDropUpload onImageUrlChange={jest.fn()} imageUrl="" />);

    const input = document.querySelector('input[type="file"]');
    fireEvent.change(input, { target: { files: [new File(['x'], 'x.jpg', { type: 'image/jpeg' })] } });

    await waitFor(() =>
      expect(screen.getByText(/Drive quota exceeded/i)).toBeInTheDocument()
    );
  });
});
