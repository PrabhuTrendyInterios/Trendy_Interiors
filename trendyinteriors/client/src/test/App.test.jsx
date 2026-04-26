import React from 'react';
import { render, screen } from '@testing-library/react';

jest.mock('../components/Header', () => () => <div>Header Mock</div>);
jest.mock('../components/Footer', () => () => <div>Footer Mock</div>);
jest.mock('../pages/Home', () => () => <div>Home Mock</div>);
jest.mock('../pages/About', () => () => <div>About Mock</div>);
jest.mock('../pages/Testimonials', () => () => <div>Testimonials Mock</div>);
jest.mock('../pages/ReachUs', () => () => <div>ReachUs Mock</div>);
jest.mock('../pages/GiveTestimonial', () => () => <div>GiveTestimonial Mock</div>);
jest.mock('../pages/Projects', () => () => <div>Projects Mock</div>);
jest.mock('../pages/BuyOnline', () => () => <div>BuyOnline Mock</div>);
jest.mock('../pages/Login', () => () => <div>Login Mock</div>);
jest.mock('../pages/ForgotPassword', () => () => <div>ForgotPassword Mock</div>);
jest.mock('../pages/ResetPassword', () => () => <div>ResetPassword Mock</div>);
jest.mock('../pages/admin/AdminDashboard', () => () => <div>AdminDashboard Mock</div>);
jest.mock('../components/AdminRoute', () => () => <div>AdminRoute Mock</div>);
jest.mock('../pages/Estimator', () => () => <div>Estimator Mock</div>);

const App = require('../App').default;

describe('client/App', () => {
  test('renders app shell', () => {
    render(<App />);
    expect(screen.getByText('Header Mock')).toBeInTheDocument();
    expect(screen.getByText('Footer Mock')).toBeInTheDocument();
  });
});
