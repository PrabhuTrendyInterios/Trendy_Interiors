import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import DeleteConfirmationModal from '../../../../pages/admin/components/DeleteConfirmationModal';

describe('client/pages/admin/components/DeleteConfirmationModal (sibling)', () => {
  test('does not render when closed', () => {
    const { container } = render(
      <DeleteConfirmationModal isOpen={false} onCancel={jest.fn()} onConfirm={jest.fn()} />
    );

    expect(container.firstChild).toBeNull();
  });

  test('handles confirm and overlay cancel actions', () => {
    const onCancel = jest.fn();
    const onConfirm = jest.fn();

    const { container } = render(
      <DeleteConfirmationModal
        isOpen={true}
        itemName="Project A"
        onCancel={onCancel}
        onConfirm={onConfirm}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /yes, delete/i }));
    expect(onConfirm).toHaveBeenCalled();

    fireEvent.click(container.querySelector('.delete-modal-overlay'));
    expect(onCancel).toHaveBeenCalled();
  });

  test('calls onCancel when escape key is pressed', () => {
    const onCancel = jest.fn();

    render(<DeleteConfirmationModal isOpen={true} onCancel={onCancel} onConfirm={jest.fn()} />);
    fireEvent.keyDown(document, { key: 'Escape' });

    expect(onCancel).toHaveBeenCalled();
  });
});
