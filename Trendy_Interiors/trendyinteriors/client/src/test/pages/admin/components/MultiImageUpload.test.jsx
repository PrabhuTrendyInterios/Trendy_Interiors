import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import MultiImageUpload from '../../../../pages/admin/components/MultiImageUpload';

describe('client/pages/admin/components/MultiImageUpload', () => {
  beforeEach(() => {
    class MockFileReader {
      readAsDataURL() {
        if (this.onload) {
          this.onload({ target: { result: 'data:image/png;base64,multi' } });
        }
      }
    }

    global.FileReader = MockFileReader;
  });

  test('renders initial info message when no images', () => {
    render(<MultiImageUpload images={[]} onImagesChange={jest.fn()} maxImages={5} />);

    expect(screen.getByText(/add up to 5 images/i)).toBeInTheDocument();
  });

  test('adds image url from paste url tab', () => {
    const onImagesChange = jest.fn();

    render(<MultiImageUpload images={[]} onImagesChange={onImagesChange} maxImages={5} />);

    fireEvent.click(screen.getByRole('button', { name: /paste url/i }));
    fireEvent.change(screen.getByPlaceholderText(/https:\/\/example.com\/image.jpg/i), {
      target: { value: 'https://example.com/new.jpg' }
    });
    fireEvent.click(screen.getByRole('button', { name: /add/i }));

    expect(onImagesChange).toHaveBeenCalledWith(['https://example.com/new.jpg']);
  });

  test('removes an existing image from gallery', () => {
    const onImagesChange = jest.fn();
    render(
      <MultiImageUpload
        images={['https://example.com/1.jpg', 'https://example.com/2.jpg']}
        onImagesChange={onImagesChange}
        maxImages={5}
      />
    );

    fireEvent.click(screen.getAllByTitle(/remove image/i)[0]);
    expect(onImagesChange).toHaveBeenCalledWith(['https://example.com/2.jpg']);
  });

  test('reads selected file and forwards generated data url', async () => {
    const onImagesChange = jest.fn();
    const { container } = render(<MultiImageUpload images={[]} onImagesChange={onImagesChange} maxImages={5} />);

    const fileInput = container.querySelector('.file-input');
    const file = new File(['image-content'], 'multi.png', { type: 'image/png' });
    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => {
      expect(onImagesChange).toHaveBeenCalledWith(['data:image/png;base64,multi']);
    });
  });
});
