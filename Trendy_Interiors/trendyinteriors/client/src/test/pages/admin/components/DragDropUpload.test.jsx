import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import DragDropUpload from '../../../../pages/admin/components/DragDropUpload';

describe('client/pages/admin/components/DragDropUpload', () => {
  beforeEach(() => {
    class MockFileReader {
      readAsDataURL() {
        if (this.onload) {
          this.onload({ target: { result: 'data:image/png;base64,mock' } });
        }
      }
    }

    global.FileReader = MockFileReader;
  });

  test('renders preview and clears image', () => {
    const onImageUrlChange = jest.fn();

    render(
      <DragDropUpload
        imageUrl="https://example.com/preview.jpg"
        onImageUrlChange={onImageUrlChange}
      />
    );

    expect(screen.getByAltText(/preview/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /change image/i }));
    expect(onImageUrlChange).toHaveBeenCalledWith('');
  });

  test('updates image url from url input', () => {
    const onImageUrlChange = jest.fn();

    render(<DragDropUpload imageUrl="" onImageUrlChange={onImageUrlChange} />);

    fireEvent.change(screen.getByPlaceholderText(/https:\/\/example.com\/image.jpg/i), {
      target: { value: 'https://example.com/image.jpg' }
    });

    expect(onImageUrlChange).toHaveBeenCalledWith('https://example.com/image.jpg');
  });

  test('reads selected file and passes data url', async () => {
    const onImageUrlChange = jest.fn();
    const { container } = render(<DragDropUpload imageUrl="" onImageUrlChange={onImageUrlChange} />);

    const fileInput = container.querySelector('#image-upload');
    const file = new File(['file-content'], 'test.png', { type: 'image/png' });
    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => {
      expect(onImageUrlChange).toHaveBeenCalledWith('data:image/png;base64,mock');
    });
  });
});
