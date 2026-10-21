const Testimonial = require('../../models/Testimonial');

describe('server/models/Testimonial', () => {
  test('requires name, postalAddress, testimonialText', () => {
    const doc = new Testimonial({});
    const err = doc.validateSync();

    expect(err.errors.name).toBeDefined();
    expect(err.errors.postalAddress).toBeDefined();
    expect(err.errors.testimonialText).toBeDefined();
  });

  test('allows empty mobile number and defaults approved false', () => {
    const doc = new Testimonial({
      name: 'Asha',
      postalAddress: 'Erode',
      testimonialText: 'This testimonial text is definitely more than twenty chars.',
      mobileNumber: '',
    });

    expect(doc.approved).toBe(false);
    expect(doc.validateSync()).toBeUndefined();
  });

  test('rejects rating beyond max', () => {
    const doc = new Testimonial({
      name: 'Asha',
      postalAddress: 'Erode',
      testimonialText: 'This testimonial text is definitely more than twenty chars.',
      rating: 10,
    });
    const err = doc.validateSync();
    expect(err.errors.rating).toBeDefined();
  });

  test('defaults rating to 5 when not provided', () => {
    const doc = new Testimonial({
      name: 'Asha',
      postalAddress: 'Erode',
      testimonialText: 'This testimonial text is definitely more than twenty chars.',
    });
    expect(doc.rating).toBe(5);
  });

  test('accepts valid rating values 1-5', () => {
    [1, 2, 3, 4, 5].forEach((rating) => {
      const doc = new Testimonial({
        name: 'Asha',
        postalAddress: 'Erode',
        testimonialText: 'This testimonial text is definitely more than twenty chars.',
        rating,
      });
      expect(doc.validateSync()).toBeUndefined();
    });
  });

  test('rejects mobileNumber that is not 10 digits', () => {
    const doc = new Testimonial({
      name: 'Asha',
      postalAddress: 'Erode',
      testimonialText: 'This testimonial text is definitely more than twenty chars.',
      mobileNumber: '12345',
    });
    const err = doc.validateSync();
    expect(err.errors.mobileNumber).toBeDefined();
  });

  test('accepts valid 10-digit mobileNumber', () => {
    const doc = new Testimonial({
      name: 'Asha',
      postalAddress: 'Erode',
      testimonialText: 'This testimonial text is definitely more than twenty chars.',
      mobileNumber: '9876543210',
    });
    expect(doc.validateSync()).toBeUndefined();
  });
});
