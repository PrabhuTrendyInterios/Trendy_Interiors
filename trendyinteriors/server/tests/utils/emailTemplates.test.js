const {
  generateContactEmailHTML,
  generateTestimonialEmailHTML,
  generateAdminLoginAlertHTML,
  generatePasswordChangeAlertHTML,
  generatePasswordResetOTPHTML,
  generateChangePasswordOTPHTML,
  generateQuotationDeliveryHTML,
  generateMeetingRequestAdminHTML,
  generateMeetingRequestConfirmationHTML,
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

  test('generates quotation delivery html with array projectRooms', () => {
    const html = generateQuotationDeliveryHTML({
      customerName: 'Priya',
      customerEmail: 'priya@example.com',
      totalArea: 1200,
      estimatedAmount: 1500000,
      referenceNumber: 'TI-2024-001',
      projectRooms: ['Kitchen', 'Bedroom', 'Living Room'],
    });
    expect(html).toContain('Priya');
    expect(html).toContain('Kitchen, Bedroom, Living Room');
  });

  test('generates quotation delivery html with object projectRooms', () => {
    const html = generateQuotationDeliveryHTML({
      customerName: 'Ravi',
      customerEmail: 'ravi@example.com',
      totalArea: 800,
      estimatedAmount: 900000,
      referenceNumber: 'TI-2024-002',
      projectRooms: { Kitchen: 1, Bedroom: 1, 'Living Room': 0 },
    });
    expect(html).toContain('Ravi');
    expect(html).toContain('Kitchen');
  });

  test('generates quotation delivery html with no projectRooms (string fallback)', () => {
    const html = generateQuotationDeliveryHTML({
      customerName: 'Test',
      customerEmail: 'test@example.com',
      totalArea: 500,
      estimatedAmount: 600000,
      referenceNumber: 'TI-2024-003',
      projectRooms: 42,
    });
    expect(html).toContain('Multiple Rooms');
  });

  test('generates meeting request admin HTML', () => {
    const html = generateMeetingRequestAdminHTML({
      name: 'Arun',
      phone: '9876543210',
      email: 'arun@example.com',
      preferredDate: '2026-11-15',
      preferredTime: '10:00 AM',
      projectType: 'Home',
      propertyLocation: 'Erode',
      notes: 'Interested in modular kitchen',
    });
    expect(html).toContain('Arun');
    expect(html).toContain('9876543210');
  });

  test('generates meeting request confirmation HTML', () => {
    const html = generateMeetingRequestConfirmationHTML({
      name: 'Sita',
      preferredDate: '2026-11-20',
      preferredTime: '3:00 PM',
      projectType: 'Office',
    });
    expect(html).toContain('Sita');
  });
});
