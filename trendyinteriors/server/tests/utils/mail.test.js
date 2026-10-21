jest.mock('@sendgrid/mail', () => ({
  setApiKey: jest.fn(),
  send: jest.fn(),
}));

const sgMail = require('@sendgrid/mail');
const mail = require('../../utils/mail');

describe('server/utils/mail', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.EMAIL_FROM = 'noreply@trendyinterios.com';
    process.env.ADMIN_EMAIL = 'admin@example.com';
  });

  describe('sendAdminEmail — EMAIL_FROM missing', () => {
    test('resolves silently when EMAIL_FROM is not set', async () => {
      delete process.env.EMAIL_FROM;
      await expect(
        mail.sendAdminEmail({ to: 'admin@example.com', subject: 'Test', html: '<p/>' })
      ).resolves.toBeUndefined();
      expect(sgMail.send).not.toHaveBeenCalled();
      process.env.EMAIL_FROM = 'noreply@trendyinterios.com';
    });
  });

  describe('sendUserEmail — EMAIL_FROM missing', () => {
    test('throws when EMAIL_FROM is not set', async () => {
      delete process.env.EMAIL_FROM;
      await expect(
        mail.sendUserEmail({ email: 'user@example.com', subject: 'Test', message: 'Hi' })
      ).rejects.toThrow(/not properly configured/i);
      process.env.EMAIL_FROM = 'noreply@trendyinterios.com';
    });
  });

  describe('sendAdminEmail', () => {
    test('resolves when recipient missing', async () => {
      await expect(mail.sendAdminEmail({ to: '', subject: 'x' })).resolves.toBeUndefined();
      expect(sgMail.send).not.toHaveBeenCalled();
    });

    test('resolves when recipient is null', async () => {
      await expect(mail.sendAdminEmail({ to: null, subject: 'x' })).resolves.toBeUndefined();
      expect(sgMail.send).not.toHaveBeenCalled();
    });

    test('sends through sendgrid with all parameters', async () => {
      sgMail.send.mockResolvedValue([{ statusCode: 202 }]);

      await mail.sendAdminEmail({
        to: 'admin@example.com',
        subject: 'Hello',
        html: '<p>Hi</p>',
        text: 'Hi',
      });

      expect(sgMail.send).toHaveBeenCalledTimes(1);
      expect(sgMail.send).toHaveBeenCalledWith(expect.objectContaining({
        to: 'admin@example.com',
        subject: 'Hello',
        text: 'Hi',
        html: '<p>Hi</p>',
      }));
    });

    test('uses environment ADMIN_EMAIL by default', async () => {
      sgMail.send.mockResolvedValue([{ statusCode: 202 }]);

      await mail.sendAdminEmail({
        subject: 'Test',
        html: '<p>Test</p>'
      });

      expect(sgMail.send).toHaveBeenCalledWith(expect.objectContaining({
        to: 'admin@example.com'
      }));
    });

    test('provides default text when not provided', async () => {
      sgMail.send.mockResolvedValue([{ statusCode: 202 }]);

      await mail.sendAdminEmail({
        to: 'admin@example.com',
        subject: 'Test',
        html: '<p>Test</p>'
      });

      expect(sgMail.send).toHaveBeenCalledWith(expect.objectContaining({
        text: 'No content provided'
      }));
    });

    test('provides default HTML when not provided', async () => {
      sgMail.send.mockResolvedValue([{ statusCode: 202 }]);

      await mail.sendAdminEmail({
        to: 'admin@example.com',
        subject: 'Test',
        text: 'Test'
      });

      expect(sgMail.send).toHaveBeenCalledWith(expect.objectContaining({
        html: '<p>No content provided</p>'
      }));
    });

    test('handles sendgrid error with response body', async () => {
      const error = new Error('SendGrid error');
      error.response = { body: 'Invalid email' };
      sgMail.send.mockRejectedValue(error);

      await expect(mail.sendAdminEmail({
        to: 'admin@example.com',
        subject: 'Test',
        html: '<p>Test</p>'
      })).rejects.toThrow('SendGrid error');
    });

    test('handles sendgrid error without response body', async () => {
      const error = new Error('Network error');
      sgMail.send.mockRejectedValue(error);

      await expect(mail.sendAdminEmail({
        to: 'admin@example.com',
        subject: 'Test',
        html: '<p>Test</p>'
      })).rejects.toThrow('Network error');
    });

    test('includes from address in message', async () => {
      sgMail.send.mockResolvedValue([{ statusCode: 202 }]);

      await mail.sendAdminEmail({
        to: 'admin@example.com',
        subject: 'Test',
        html: '<p>Test</p>'
      });

      expect(sgMail.send).toHaveBeenCalledWith(expect.objectContaining({
        from: 'noreply@trendyinterios.com'
      }));
    });
  });

  describe('sendUserEmail', () => {
    test('throws when email is missing', async () => {
      await expect(mail.sendUserEmail({ subject: 'x', message: 'y' })).rejects.toThrow(/required/i);
    });

    test('throws when email is empty string', async () => {
      await expect(mail.sendUserEmail({ email: '', subject: 'x', message: 'y' })).rejects.toThrow(/required/i);
    });

    test('throws when email is null', async () => {
      await expect(mail.sendUserEmail({ email: null, subject: 'x', message: 'y' })).rejects.toThrow(/required/i);
    });

    test('sends email successfully', async () => {
      sgMail.send.mockResolvedValue([{ statusCode: 202 }]);

      await mail.sendUserEmail({
        email: 'user@example.com',
        subject: 'Hello',
        message: 'Welcome'
      });

      expect(sgMail.send).toHaveBeenCalledTimes(1);
      expect(sgMail.send).toHaveBeenCalledWith(expect.objectContaining({
        to: 'user@example.com',
        subject: 'Hello',
        text: 'Welcome'
      }));
    });

    test('provides default message when not provided', async () => {
      sgMail.send.mockResolvedValue([{ statusCode: 202 }]);

      await mail.sendUserEmail({
        email: 'user@example.com',
        subject: 'Test'
      });

      expect(sgMail.send).toHaveBeenCalledWith(expect.objectContaining({
        text: 'No message provided'
      }));
    });

    test('includes from address in user email', async () => {
      sgMail.send.mockResolvedValue([{ statusCode: 202 }]);

      await mail.sendUserEmail({
        email: 'user@example.com',
        subject: 'Test',
        message: 'Test message'
      });

      expect(sgMail.send).toHaveBeenCalledWith(expect.objectContaining({
        from: 'noreply@trendyinterios.com'
      }));
    });

    test('handles sendgrid error with response body', async () => {
      const error = new Error('SendGrid error');
      error.response = { body: 'Quota exceeded' };
      sgMail.send.mockRejectedValue(error);

      await expect(mail.sendUserEmail({
        email: 'user@example.com',
        subject: 'Test',
        message: 'Test'
      })).rejects.toThrow('SendGrid error');
    });

    test('handles sendgrid error without response body', async () => {
      const error = new Error('Connection failed');
      sgMail.send.mockRejectedValue(error);

      await expect(mail.sendUserEmail({
        email: 'user@example.com',
        subject: 'Test',
        message: 'Test'
      })).rejects.toThrow('Connection failed');
    });
  });

  describe('sendEmailWithAttachment', () => {
    const validAttachment = {
      content: Buffer.from('pdf-content'),
      filename: 'quote.pdf',
      type: 'application/pdf',
    };

    test('throws when to is missing', async () => {
      await expect(
        mail.sendEmailWithAttachment({ subject: 'Q', html: '<p/>', attachment: validAttachment })
      ).rejects.toThrow(/required/i);
      expect(sgMail.send).not.toHaveBeenCalled();
    });

    test('throws when EMAIL_FROM is not set', async () => {
      delete process.env.EMAIL_FROM;
      await expect(
        mail.sendEmailWithAttachment({ to: 'x@x.com', subject: 'Q', html: '<p/>', attachment: validAttachment })
      ).rejects.toThrow(/not properly configured/i);
      process.env.EMAIL_FROM = 'noreply@trendyinterios.com';
    });

    test('throws when attachment is missing', async () => {
      await expect(
        mail.sendEmailWithAttachment({ to: 'x@x.com', subject: 'Q', html: '<p/>' })
      ).rejects.toThrow(/attachment/i);
    });

    test('throws when attachment.content is missing', async () => {
      await expect(
        mail.sendEmailWithAttachment({ to: 'x@x.com', subject: 'Q', html: '<p/>', attachment: { filename: 'f.pdf' } })
      ).rejects.toThrow(/attachment/i);
    });

    test('throws when attachment.filename is missing', async () => {
      await expect(
        mail.sendEmailWithAttachment({ to: 'x@x.com', subject: 'Q', html: '<p/>', attachment: { content: Buffer.from('x') } })
      ).rejects.toThrow(/attachment/i);
    });

    test('sends successfully with all valid params', async () => {
      sgMail.send.mockResolvedValue([{ statusCode: 202 }]);

      const result = await mail.sendEmailWithAttachment({
        to: 'client@example.com',
        subject: 'Your Quote',
        html: '<p>Here is your quote</p>',
        text: 'Here is your quote',
        attachment: validAttachment,
      });

      expect(sgMail.send).toHaveBeenCalledTimes(1);
      const msg = sgMail.send.mock.calls[0][0];
      expect(msg.to).toBe('client@example.com');
      expect(msg.subject).toBe('Your Quote');
      expect(msg.attachments[0].filename).toBe('quote.pdf');
      expect(msg.attachments[0].disposition).toBe('attachment');
    });

    test('uses default text and html when not provided', async () => {
      sgMail.send.mockResolvedValue([{ statusCode: 202 }]);

      await mail.sendEmailWithAttachment({
        to: 'client@example.com',
        subject: 'Quote',
        attachment: validAttachment,
      });

      const msg = sgMail.send.mock.calls[0][0];
      expect(msg.text).toBe('Please see attached quotation');
      expect(msg.html).toBe('<p>Please see attached quotation</p>');
    });

    test('uses attachment.type when provided', async () => {
      sgMail.send.mockResolvedValue([{ statusCode: 202 }]);

      await mail.sendEmailWithAttachment({
        to: 'client@example.com',
        subject: 'Quote',
        attachment: { ...validAttachment, type: 'application/pdf' },
      });

      const msg = sgMail.send.mock.calls[0][0];
      expect(msg.attachments[0].type).toBe('application/pdf');
    });

    test('rethrows error when send fails with response body errors', async () => {
      const err = new Error('SendGrid error');
      err.response = { body: { errors: [{ message: 'Invalid API key' }] } };
      sgMail.send.mockRejectedValue(err);

      await expect(
        mail.sendEmailWithAttachment({
          to: 'client@example.com',
          subject: 'Quote',
          attachment: validAttachment,
        })
      ).rejects.toThrow('SendGrid error');
    });

    test('rethrows error when send fails without response body', async () => {
      sgMail.send.mockRejectedValue(new Error('Network timeout'));

      await expect(
        mail.sendEmailWithAttachment({
          to: 'client@example.com',
          subject: 'Quote',
          attachment: validAttachment,
        })
      ).rejects.toThrow('Network timeout');
    });
  });
});
