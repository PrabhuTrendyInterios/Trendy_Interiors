import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import MultiImageUpload from '../../components/MultiImageUpload';

jest.mock('../../components/MultiImageUpload.css', () => ({}), { virtual: true });

const mockFetch = jest.fn();
global.fetch = mockFetch;

beforeEach(() => {
  mockFetch.mockReset();
  localStorage.clear();
});

const makeSuccessResponse = (url) => ({
  ok: true,
  json: async () => ({ success: true, data: { fileId: 'FID', url } }),
});

describe('admin/components/MultiImageUpload', () => {
  test('renders add-images prompt when images array is empty', () => {
    render(<MultiImageUpload images={[]} onImagesChange={jest.fn()} />);
    // The info message paragraph (not the zone counter) contains this text
    const el = screen.getAllByText(/add up to/i);
    expect(el.length).toBeGreaterThan(0);
  });

  test('renders existing images as thumbnails', () => {
    const images = [
      'https://lh3.googleusercontent.com/d/IMG1',
      'https://lh3.googleusercontent.com/d/IMG2',
    ];
    render(<MultiImageUpload images={images} onImagesChange={jest.fn()} />);
    expect(screen.getByText(/Gallery Images \(2\//i)).toBeInTheDocument();
  });

  test('calls onImagesChange with image removed when remove button clicked', () => {
    const images = [
      'https://lh3.googleusercontent.com/d/IMG1',
      'https://lh3.googleusercontent.com/d/IMG2',
    ];
    const onChange = jest.fn();
    render(<MultiImageUpload images={images} onImagesChange={onChange} />);

    const removeBtns = screen.getAllByTitle('Remove image');
    fireEvent.click(removeBtns[0]);

    expect(onChange).toHaveBeenCalledWith(['https://lh3.googleusercontent.com/d/IMG2']);
  });

  test('uploads file with folder=projects param', async () => {
    mockFetch.mockResolvedValue(
      makeSuccessResponse('https://lh3.googleusercontent.com/d/NEW_IMG')
    );
    const onChange = jest.fn();

    render(<MultiImageUpload images={[]} onImagesChange={onChange} folder="projects" />);

    const input = document.querySelector('input[type="file"]');
    const file = new File(['img'], 'gallery.jpg', { type: 'image/jpeg' });
    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => expect(onChange).toHaveBeenCalled());

    const fetchUrl = mockFetch.mock.calls[0][0];
    expect(fetchUrl).toContain('folder=projects');
    expect(onChange).toHaveBeenCalledWith(['https://lh3.googleusercontent.com/d/NEW_IMG']);
  });

  test('does not exceed maxImages limit', async () => {
    const existing = [
      'https://lh3.googleusercontent.com/d/A',
      'https://lh3.googleusercontent.com/d/B',
    ];
    const onChange = jest.fn();
    render(
      <MultiImageUpload images={existing} onImagesChange={onChange} maxImages={2} folder="projects" />
    );

    // The upload zone should be hidden when at maxImages
    expect(screen.queryByText(/drag & drop/i)).not.toBeInTheDocument();
    expect(screen.getByText(/maximum reached/i)).toBeInTheDocument();
  });

  test('uploads without folder param when folder prop is empty', async () => {
    mockFetch.mockResolvedValue(makeSuccessResponse('https://lh3.googleusercontent.com/d/NOFLDR'));
    const onChange = jest.fn();

    render(<MultiImageUpload images={[]} onImagesChange={onChange} folder="" />);

    const input = document.querySelector('input[type="file"]');
    fireEvent.change(input, { target: { files: [new File(['x'], 'x.jpg', { type: 'image/jpeg' })] } });

    await waitFor(() => expect(mockFetch).toHaveBeenCalled());

    const fetchUrl = mockFetch.mock.calls[0][0];
    expect(fetchUrl).not.toContain('folder=');
  });

  test('shows error when upload fails', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      json: async () => ({ error: 'Upload failed' }),
    });

    render(<MultiImageUpload images={[]} onImagesChange={jest.fn()} />);

    const input = document.querySelector('input[type="file"]');
    fireEvent.change(input, { target: { files: [new File(['x'], 'x.jpg', { type: 'image/jpeg' })] } });

    await waitFor(() =>
      expect(screen.getByText(/Upload failed/i)).toBeInTheDocument()
    );
  });

  test('adds URL from paste input and calls onImagesChange', () => {
    const onChange = jest.fn();
    render(<MultiImageUpload images={[]} onImagesChange={onChange} />);

    // Switch to the URL tab
    fireEvent.click(screen.getByText(/Paste URL/i));

    const urlInput = screen.getByPlaceholderText(/https:\/\/example\.com/i);
    fireEvent.change(urlInput, {
      target: { value: 'https://example.com/room.jpg' },
    });
    fireEvent.click(screen.getByRole('button', { name: /add/i }));

    expect(onChange).toHaveBeenCalledWith(['https://example.com/room.jpg']);
  });
});
