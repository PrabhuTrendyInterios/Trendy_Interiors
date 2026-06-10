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
});
