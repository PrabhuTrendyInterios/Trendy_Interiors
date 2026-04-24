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
  });

  test('sendAdminEmail resolves when recipient missing', async () => {
    await expect(mail.sendAdminEmail({ to: '', subject: 'x' })).resolves.toBeUndefined();
    expect(sgMail.send).not.toHaveBeenCalled();
  });

  test('sendAdminEmail sends through sendgrid', async () => {
    sgMail.send.mockResolvedValue([{ statusCode: 202 }]);

    await mail.sendAdminEmail({
      to: 'admin@example.com',
      subject: 'Hello',
      html: '<p>Hi</p>',
      text: 'Hi',
    });

    expect(sgMail.send).toHaveBeenCalledTimes(1);
  });

  test('sendUserEmail throws when email is missing', async () => {
    await expect(mail.sendUserEmail({ subject: 'x', message: 'y' })).rejects.toThrow(/required/i);
  });
});
