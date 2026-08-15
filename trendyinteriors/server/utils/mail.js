const nodemailer = require('nodemailer');

// Create SMTP transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: Number(process.env.SMTP_PORT) === 465,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// Validate SMTP configuration
if (!process.env.SMTP_HOST) {
  console.warn(
    '[EMAIL] ⚠️ WARNING: SMTP configuration not found. Email sending will fail.'
  );
}

/**
 * Send email with attachment (for quotations)
 * @param {Object} options
 * @param {string} options.to
 * @param {string} options.subject
 * @param {string} options.html
 * @param {string} options.text
 * @param {Object} options.attachment
 * @param {Buffer} options.attachment.content
 * @param {string} options.attachment.filename
 */
const sendEmailWithAttachment = async function ({
  to,
  subject,
  html,
  text,
  attachment,
}) {
  // Validate required fields
  if (!to) {
    console.error('[EMAIL] ❌ Recipient email address is required');
    throw new Error('Email address is required');
  }

  if (!process.env.EMAIL_FROM) {
    console.error(
      '[EMAIL] ❌ EMAIL_FROM environment variable not configured'
    );
    throw new Error('Email service not properly configured');
  }

  if (!attachment || !attachment.content || !attachment.filename) {
    console.error(
      '[EMAIL] ❌ Attachment content and filename are required'
    );
    throw new Error('Attachment missing required fields');
  }

  const msg = {
    to,
    from: process.env.EMAIL_FROM,
    subject,
    text: text || 'Please see attached quotation',
    html: html || '<p>Please see attached quotation</p>',
    attachments: [
      {
        filename: attachment.filename,
        content: attachment.content,
        contentType: attachment.type || 'application/pdf',
      },
    ],
  };

  try {
    console.log(
      '[EMAIL] 📧 Attempting to send email with attachment to:',
      to,
      'Subject:',
      subject
    );

    const result = await transporter.sendMail(msg);

    console.log(
      '[EMAIL] ✅ Email with attachment sent successfully to:',
      to,
      '| File:',
      attachment.filename
    );

    return result;
  } catch (err) {
    const errorMessage = err.message || 'Unknown error';
    const errorCode = err.code || 'N/A';

    console.error(
      '[EMAIL] ❌ Email sending failed to',
      to,
      '| Error Code:',
      errorCode,
      '| Message:',
      errorMessage
    );

    throw err;
  }
};

/**
 * Send email to admin notification
 * @param {Object} options
 * @param {string} options.to
 * @param {string} options.subject
 * @param {string} options.text
 * @param {string} options.html
 */
const sendAdminEmail = async function ({
  to = process.env.ADMIN_EMAIL,
  subject = 'Notification',
  text,
  html,
}) {
  // Validate recipient
  if (!to) {
    console.warn(
      '[EMAIL] ⚠️ Admin email recipient not provided and ADMIN_EMAIL env var not set'
    );
    return Promise.resolve();
  }

  // Validate sender
  if (!process.env.EMAIL_FROM) {
    console.error(
      '[EMAIL] ❌ EMAIL_FROM environment variable not configured'
    );
    return Promise.resolve();
  }

  // Set default content
  const finalText = text || 'No content provided';
  const finalHtml = html || '<p>No content provided</p>';

  const msg = {
    to,
    from: process.env.EMAIL_FROM,
    subject,
    text: finalText,
    html: finalHtml,
  };

  try {
    console.log(
      '[EMAIL] 📧 Attempting to send admin email to:',
      to,
      'Subject:',
      subject
    );

    const result = await transporter.sendMail(msg);

    console.log('[EMAIL] ✅ Email sent successfully to:', to);

    return result;
  } catch (err) {
    const errorMessage = err.message || 'Unknown error';
    const errorCode = err.code || 'N/A';

    console.error(
      '[EMAIL] ❌ Email sending failed to',
      to,
      '| Error Code:',
      errorCode,
      '| Message:',
      errorMessage
    );

    // Return error without rejecting to allow API requests to continue
    return Promise.reject(err);
  }
};

/**
 * Send email to user
 * @param {Object} options
 * @param {string} options.email
 * @param {string} options.subject
 * @param {string} options.message
 * @param {string} options.html
 */
const sendUserEmail = async function ({
  email,
  subject,
  message,
  html,
}) {
  // Validate required fields
  if (!email) {
    console.error('[EMAIL] ❌ User email address is required');
    throw new Error('Email address is required');
  }

  if (!process.env.EMAIL_FROM) {
    console.error(
      '[EMAIL] ❌ EMAIL_FROM environment variable not configured'
    );
    throw new Error('Email service not properly configured');
  }

  const msg = {
    to: email,
    from: process.env.EMAIL_FROM,
    subject,
    text: message || 'No message provided',
    html,
  };

  try {
    console.log(
      '[EMAIL] 📧 Attempting to send user email to:',
      email,
      'Subject:',
      subject
    );

    const result = await transporter.sendMail(msg);

    console.log('[EMAIL] ✅ Email sent successfully to:', email);

    return result;
  } catch (err) {
    const errorMessage = err.message || 'Unknown error';
    const errorCode = err.code || 'N/A';

    console.error(
      '[EMAIL] ❌ Email sending failed to',
      email,
      '| Error Code:',
      errorCode,
      '| Message:',
      errorMessage
    );

    throw err;
  }
};

module.exports = sendUserEmail;
module.exports.sendAdminEmail = sendAdminEmail;
module.exports.sendUserEmail = sendUserEmail;
module.exports.sendEmailWithAttachment = sendEmailWithAttachment;