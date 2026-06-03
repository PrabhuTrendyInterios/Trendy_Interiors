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
});
