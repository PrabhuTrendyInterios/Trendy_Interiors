const {
  generateContactEmailHTML,
  generateTestimonialEmailHTML,
  generateAdminLoginAlertHTML,
  generatePasswordChangeAlertHTML,
  generatePasswordResetOTPHTML,
  generateChangePasswordOTPHTML,
} = require('../../utils/emailTemplates');

describe('server/utils/emailTemplates', () => {
  test('generates contact email html with key data', () => {
    const html = generateContactEmailHTML({
      name: 'Asha',
      email: 'asha@example.com',
      purpose: 'Kitchen',
      mobileNumber: '9876543210',
      message: 'Need a premium modular kitchen design',
    });

    expect(html).toContain('Asha');
    expect(html).toContain('asha@example.com');
    expect(html).toContain('Kitchen');
  });

  test('generates testimonial email html with stars', () => {
    const html = generateTestimonialEmailHTML({
      name: 'Kumar',
      testimonialText: 'Great service and finishing quality.',
      rating: 4,
      mobileNumber: '',
      postalAddress: 'Erode',
    });

    expect(html).toContain('Kumar');
    expect(html).toContain('⭐⭐⭐⭐');
  });

  test('generates admin login alert template', () => {
    const html = generateAdminLoginAlertHTML({ name: 'Admin', email: 'admin@example.com' });
    expect(html).toContain('Admin');
    expect(html).toContain('admin@example.com');
  });

  test('generates password change alert template', () => {
    const html = generatePasswordChangeAlertHTML({ name: 'Admin', email: 'admin@example.com' });
    expect(html).toContain('Admin');
  });

  test('generates reset otp template with otp', () => {
    const html = generatePasswordResetOTPHTML({ otp: '123456' });
    expect(html).toContain('123456');
  });

  test('generates change password otp template with otp', () => {
    const html = generateChangePasswordOTPHTML({ otp: '654321' });
    expect(html).toContain('654321');
  });
});
