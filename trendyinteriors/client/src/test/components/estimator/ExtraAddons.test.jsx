import React from 'react';
import { fireEvent, render, screen, within } from '@testing-library/react';
import ExtraAddons from '../../../components/estimator/ExtraAddons';

const addon = {
  _id: 'lighting',
  name: 'Lighting Package',
  description: 'Layered ambient lighting',
  size: 'Standard',
  price: 12000,
};

describe('client/components/estimator/ExtraAddons', () => {
  test('hides the Standard size label and orders quantity controls as minus, count, plus', () => {
    const onUpdateAddonQuantity = jest.fn();
    const { container } = render(
      <ExtraAddons
        selectedAddons={[{ id: 'lighting', count: 2 }]}
        onToggleAddon={jest.fn()}
        onUpdateAddonQuantity={onUpdateAddonQuantity}
        onNext={jest.fn()}
        onPrev={jest.fn()}
        addonsOptions={[addon]}
      />,
    );

    expect(screen.queryByText(/^Standard$/i)).not.toBeInTheDocument();

    const quantityControl = container.querySelector('.addon-quantity-control');
    const quantityButtons = within(quantityControl).getAllByRole('button');
    expect(quantityButtons[0]).toHaveAccessibleName('Decrease Lighting Package');
    expect(within(quantityControl).getByText('2')).toBeInTheDocument();
    expect(quantityButtons[1]).toHaveAccessibleName('Increase Lighting Package');

    fireEvent.click(quantityButtons[0]);
    fireEvent.click(quantityButtons[1]);
    expect(onUpdateAddonQuantity).toHaveBeenNthCalledWith(1, 'lighting', -1);
    expect(onUpdateAddonQuantity).toHaveBeenNthCalledWith(2, 'lighting', 1);
  });
});
