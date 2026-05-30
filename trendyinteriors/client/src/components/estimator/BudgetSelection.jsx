import React from 'react';
import { FaLeaf, FaDollarSign, FaStar, FaGem } from 'react-icons/fa';

const budgetPlans = [
  {
    id: 'starter',
    title: 'Starter',
    price: '₹250',
    unit: '/sq. ft',
    subtitle: 'Essential styling for refreshing a single room with minimal changes.',
    details: ['Digital Mood Board', 'Shopping List', 'Color Palette'],
    icon: <FaLeaf />,
  },
  {
    id: 'budgetFriendly',
    title: 'Budget Friendly',
    price: '₹500',
    unit: '/sq. ft',
    subtitle: 'Perfect for homeowners seeking professional guidance on a sensible budget.',
    details: ['Everything in Low Cost', '2D Floor Layouts', 'Material Swatches'],
    icon: <FaDollarSign />,
  },
  {
    id: 'premium',
    title: 'Premium',
    price: '₹1,000',
    unit: '/sq. ft',
    subtitle: 'Complete design transformation with 3D renderings and contractor management.',
    details: ['Photorealistic 3D Renders', 'Contractor Liaison', 'Custom Furniture Sourcing', 'Priority Support'],
    icon: <FaStar />,
    popular: true,
  },
  {
    id: 'signature',
    title: 'Luxury',
    price: '₹1,500',
    unit: '/sq. ft',
    subtitle: 'The ultimate white-glove experience for high-end residential estates.',
    details: ['On-site White Glove Service', 'Bespoke Artisanal Pieces', 'Unlimited Revisions'],
    icon: <FaGem />,
  },
];

const BudgetSelection = ({ selectedBudget, isStepCompleted, onSelectBudget, onPrev, onNext }) => {
  return (
    <div className={`budget-selection-container ${selectedBudget ? 'has-selection' : ''}`}>
      <div className="budget-selection-header">
        <h2>Choose Your Interior Plan</h2>
        <p>Pick one plan before continuing to your free consultation. Each option is tailored for a different level of service, from refresh to full luxury delivery.</p>
      </div>

      <div className="budget-grid">
        {budgetPlans.map((plan) => (
          <button
            key={plan.id}
            type="button"
            className={`budget-card ${plan.popular ? 'popular' : ''} ${selectedBudget === plan.id ? 'selected' : ''}`}
            onClick={() => onSelectBudget(plan.id)}
          >
            {plan.popular && <span className="plan-badge">Most Popular</span>}

            <div className="budget-card-icon">{plan.icon}</div>
            <div className="budget-plan-title">{plan.title}</div>
            <div className="budget-plan-subtitle">{plan.subtitle}</div>
            <div className="budget-plan-price">
  {plan.price}
  <span className="price-unit">{plan.unit}</span>
</div>
            <ul className="budget-plan-details">
              {plan.details.map((detail) => (
                <li key={detail}>{detail}</li>
              ))}
            </ul>
            <div className="budget-card-footer">
              <span className={`budget-card-cta ${selectedBudget === plan.id ? 'active' : ''}`}>
                {selectedBudget === plan.id ? 'Plan Selected' : 'Select Plan'}
              </span>
            </div>
          </button>
        ))}
      </div>

      <div className="budget-summary">
        <strong>Selected Plan:</strong>{' '}
        {selectedBudget ? budgetPlans.find((plan) => plan.id === selectedBudget).title : 'None selected yet'}
      </div>

      <div className="estimator-actions">
        <button className="btn-secondary" onClick={onPrev}>
          Back
        </button>
        <button className="btn-primary" onClick={onNext} disabled={!selectedBudget && !isStepCompleted}>
          Next
        </button>
      </div>
    </div>
  );
};

export default BudgetSelection;
