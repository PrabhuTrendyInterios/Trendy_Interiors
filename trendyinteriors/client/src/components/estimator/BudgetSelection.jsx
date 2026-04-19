import React from 'react';
import { FaDollarSign } from 'react-icons/fa';

const budgetPlans = [
  {
    id: 'budgetFriendly',
    title: 'Low Cost Plan',
    price: '₹18k - ₹25k',
    subtitle: 'Essential upgrades with cost-conscious choices',
    details: ['Smart material picks', 'Functional layouts', 'Quick styling fixes'],
  },
  {
    id: 'essential',
    title: 'Budget Friendly Plan',
    price: '₹25k - ₹35k',
    subtitle: 'Smart solutions for compact spaces',
    details: ['Space planning', 'Material direction', 'Furniture layout'],
  },
  {
    id: 'premium',
    title: 'Premium Plan',
    price: '₹40k - ₹55k',
    subtitle: 'Balanced luxury with lasting value',
    details: ['Customized styling', 'Material selection', 'Project coordination'],
  },
  {
    id: 'luxury',
    title: 'Luxury Plan',
    price: '₹60k+',
    subtitle: 'High-end finishes and premium execution',
    details: ['Bespoke design', 'Premium finishes', 'Furniture & lighting guidance'],
  },
];

const BudgetSelection = ({ selectedBudget, onSelectBudget, onPrev, onNext }) => {
  return (
    <div className="budget-selection-container">
      <div className="budget-selection-header">
        <h2>Choose a Budget Plan</h2>
        <p>Pick a plan that fits your design goals and get a more accurate estimate for your project.</p>
      </div>

      <div className="budget-grid">
        {budgetPlans.map((plan) => (
          <button
            key={plan.id}
            type="button"
            className={`budget-card ${selectedBudget === plan.id ? 'selected' : ''}`}
            onClick={() => onSelectBudget(plan.id)}
          >
            <div className="budget-card-icon">
              <FaDollarSign />
            </div>
            <div className="budget-plan-title">{plan.title}</div>
            <div className="budget-plan-price">{plan.price}</div>
            <div className="budget-plan-subtitle">{plan.subtitle}</div>
            <ul className="budget-plan-details">
              {plan.details.map((detail) => (
                <li key={detail}>{detail}</li>
              ))}
            </ul>
          </button>
        ))}
      </div>

      <div className="budget-summary">
        <strong>Selected Budget:</strong>{' '}
        {selectedBudget ? budgetPlans.find((plan) => plan.id === selectedBudget).title : 'None selected yet'}
      </div>

      <div className="estimator-actions">
        <button className="btn-secondary" onClick={onPrev}>
          Back
        </button>
        <button
          className="btn-primary"
          onClick={onNext}
          disabled={!selectedBudget}
        >
          Continue
        </button>
      </div>
    </div>
  );
};

export default BudgetSelection;
