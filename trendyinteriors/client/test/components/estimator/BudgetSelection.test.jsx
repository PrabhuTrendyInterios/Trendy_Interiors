import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import BudgetSelection from './BudgetSelection';

describe('client/components/estimator/BudgetSelection', () => {
  test('disables continue when no plan selected', () => {
    render(
      <BudgetSelection
        selectedBudget=""
        onSelectBudget={jest.fn()}
        onPrev={jest.fn()}
        onNext={jest.fn()}
      />
    );

    expect(screen.getByRole('button', { name: /continue/i })).toBeDisabled();
  });

  test('calls onSelectBudget when plan card clicked', () => {
    const onSelectBudget = jest.fn();

    render(
      <BudgetSelection
        selectedBudget=""
        onSelectBudget={onSelectBudget}
        onPrev={jest.fn()}
        onNext={jest.fn()}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /starter/i }));

    expect(onSelectBudget).toHaveBeenCalledWith('starter');
  });

  test('renders selected plan title in summary', () => {
    render(
      <BudgetSelection
        selectedBudget="premium"
        onSelectBudget={jest.fn()}
        onPrev={jest.fn()}
        onNext={jest.fn()}
      />
    );

    const summaryLabel = screen.getByText(/selected plan:/i);
    expect(summaryLabel).toBeInTheDocument();
    expect(summaryLabel.parentElement).toHaveTextContent('Premium');
  });
});