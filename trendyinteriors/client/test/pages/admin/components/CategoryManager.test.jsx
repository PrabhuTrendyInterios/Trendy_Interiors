import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import CategoryManager from './CategoryManager';

describe('client/pages/admin/components/CategoryManager', () => {
  test('renders empty state when there are no categories', () => {
    render(
      <CategoryManager
        categories={[]}
        selectedCategory=""
        onSelectCategory={jest.fn()}
        onAddCategory={jest.fn()}
        onRemoveCategory={jest.fn()}
      />
    );

    expect(screen.getByText(/no categories yet/i)).toBeInTheDocument();
  });

  test('selects category and removes category with separate actions', () => {
    const onSelectCategory = jest.fn();
    const onRemoveCategory = jest.fn();

    render(
      <CategoryManager
        categories={['kitchen']}
        selectedCategory=""
        onSelectCategory={onSelectCategory}
        onAddCategory={jest.fn()}
        onRemoveCategory={onRemoveCategory}
      />
    );

    fireEvent.click(screen.getByText('kitchen'));
    expect(onSelectCategory).toHaveBeenCalledWith('kitchen');

    fireEvent.click(screen.getByTitle(/remove category/i));
    expect(onRemoveCategory).toHaveBeenCalledWith('kitchen');
  });

  test('adds a new category in normalized lowercase form', () => {
    const onAddCategory = jest.fn();

    render(
      <CategoryManager
        categories={['kitchen']}
        selectedCategory=""
        onSelectCategory={jest.fn()}
        onAddCategory={onAddCategory}
        onRemoveCategory={jest.fn()}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /add category/i }));
    fireEvent.change(screen.getByPlaceholderText(/bedroom design/i), {
      target: { value: '  Bedroom  ' }
    });
    fireEvent.click(screen.getByTitle(/add category/i));

    expect(onAddCategory).toHaveBeenCalledWith('bedroom');
  });
});
