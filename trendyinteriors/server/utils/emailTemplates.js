// Professional email templates for TrendyInterios

const generateContactEmailHTML = (data) => {
  const { name, email, purpose, mobileNumber, message } = data;
  const formattedDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>New Customer Inquiry - TrendyInterios</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          background: linear-gradient(135deg, #1a1a1a 0%, #242424 100%);
          padding: 20px;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          background: #ffffff;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 10px 40px rgba(212, 175, 55, 0.2);
        }
        .header {
          background: linear-gradient(135deg, #1a1a1a 0%, #242424 100%);
          padding: 40px 20px;
          text-align: center;
          border-bottom: 4px solid #d4af37;
        }
        .logo {
          font-size: 32px;
          font-weight: 700;
          color: #d4af37;
          margin-bottom: 10px;
          letter-spacing: 2px;
        }
        .tagline {
          color: #b0b0b0;
          font-size: 14px;
          font-weight: 300;
        }
        .badge {
          display: inline-block;
          background: #d4af37;
          color: #1a1a1a;
          padding: 6px 16px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 600;
          margin-top: 15px;
          text-transform: uppercase;
          letter-spacing: 1px;
        }
        .content {
          padding: 40px;
        }
        .section {
          margin-bottom: 30px;
        }
        .section-title {
          color: #d4af37;
          font-size: 18px;
          font-weight: 700;
          margin-bottom: 15px;
          text-transform: uppercase;
          letter-spacing: 1px;
          border-bottom: 2px solid #d4af37;
          padding-bottom: 10px;
        }
        .info-row {
          display: flex;
          margin-bottom: 15px;
          padding: 12px;
          background: #f8f8f8;
          border-radius: 6px;
          border-left: 4px solid #d4af37;
        }
        .info-label {
          color: #d4af37;
          font-weight: 600;
          min-width: 120px;
          font-size: 13px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .info-value {
          color: #333333;
          flex: 1;
          font-size: 14px;
        }
        .message-box {
          background: #f8f8f8;
          padding: 20px;
          border-radius: 8px;
          border-left: 4px solid #d4af37;
          line-height: 1.8;
          color: #333333;
          font-size: 14px;
          word-wrap: break-word;
        }
        .cta-section {
          background: linear-gradient(135deg, rgba(212, 175, 55, 0.1) 0%, rgba(212, 175, 55, 0.05) 100%);
          padding: 20px;
          border-radius: 8px;
          text-align: center;
          margin-top: 30px;
          border: 2px solid #d4af37;
        }
        .cta-button {
          display: inline-block;
          background: linear-gradient(135deg, #d4af37 0%, #c4a027 100%);
          color: #1a1a1a;
          padding: 14px 32px;
          border-radius: 6px;
          text-decoration: none;
          font-weight: 700;
          font-size: 14px;
          text-transform: uppercase;
          letter-spacing: 1px;
          margin-top: 15px;
          box-shadow: 0 4px 12px rgba(212, 175, 55, 0.3);
          transition: all 0.3s ease;
        }
        .footer {
          background: #f0f0f0;
          padding: 20px;
          text-align: center;
          font-size: 12px;
          color: #666666;
          border-top: 1px solid #e0e0e0;
        }
        .timestamp {
          color: #999999;
          font-size: 11px;
          margin-top: 10px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <!-- Header -->
        <div class="header">
          <div class="logo">TrendyInterios</div>
          <div class="tagline">Luxury Interior Design Solutions</div>
          <span class="badge">New Customer Inquiry</span>
        </div>

        <!-- Content -->
        <div class="content">
          <div class="section">
            <div class="section-title">🔔 New Inquiry Received</div>
            <p style="color: #666666; font-size: 14px; line-height: 1.6; margin-bottom: 20px;">
              A new customer inquiry has been submitted through the website. Please review the details below and respond promptly.
            </p>
          </div>

          <div class="section">
            <div class="section-title">Customer Details</div>
            <div class="info-row">
              <div class="info-label">Name</div>
              <div class="info-value">${name}</div>
            </div>
            <div class="info-row">
              <div class="info-label">Email</div>
              <div class="info-value"><a href="mailto:${email}" style="color: #d4af37; text-decoration: none;">${email}</a></div>
            </div>
            <div class="info-row">
              <div class="info-label">Phone</div>
              <div class="info-value">${mobileNumber || 'Not provided'}</div>
            </div>
            <div class="info-row">
              <div class="info-label">Project Type</div>
              <div class="info-value"><strong>${purpose}</strong></div>
            </div>
          </div>

          <div class="section">
            <div class="section-title">📝 Message</div>
            <div class="message-box">
              ${message}
            </div>
          </div>

          <div class="cta-section">
            <strong style="color: #1a1a1a;">Ready to respond?</strong>
            <a href="mailto:${email}" class="cta-button">Reply to Customer</a>
          </div>
        </div>

        <!-- Footer -->
        <div class="footer">
          <strong>TrendyInterios Admin Dashboard</strong>
          <div class="timestamp">Received: ${formattedDate}</div>
          <div style="margin-top: 10px; color: #999999;">
            This is an automated notification from your website. Please do not reply to this email.
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
};

const generateTestimonialEmailHTML = (data) => {
  const { name, testimonialText, rating, mobileNumber, postalAddress } = data;
  const formattedDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
  const stars = '⭐'.repeat(rating);

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>New Testimonial - TrendyInterios</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          background: linear-gradient(135deg, #1a1a1a 0%, #242424 100%);
          padding: 20px;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          background: #ffffff;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 10px 40px rgba(212, 175, 55, 0.2);
        }
        .header {
          background: linear-gradient(135deg, #1a1a1a 0%, #242424 100%);
          padding: 40px 20px;
          text-align: center;
          border-bottom: 4px solid #d4af37;
        }
        .logo {
          font-size: 32px;
          font-weight: 700;
          color: #d4af37;
          margin-bottom: 10px;
          letter-spacing: 2px;
        }
        .tagline {
          color: #b0b0b0;
          font-size: 14px;
          font-weight: 300;
        }
        .badge {
          display: inline-block;
          background: #d4af37;
          color: #1a1a1a;
          padding: 6px 16px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 600;
          margin-top: 15px;
          text-transform: uppercase;
          letter-spacing: 1px;
        }
        .content {
          padding: 40px;
        }
        .section {
          margin-bottom: 30px;
        }
        .section-title {
          color: #d4af37;
          font-size: 18px;
          font-weight: 700;
          margin-bottom: 15px;
          text-transform: uppercase;
          letter-spacing: 1px;
          border-bottom: 2px solid #d4af37;
          padding-bottom: 10px;
        }
        .rating {
          font-size: 28px;
          letter-spacing: 4px;
          margin: 15px 0;
        }
        .info-row {
          display: flex;
          margin-bottom: 15px;
          padding: 12px;
          background: #f8f8f8;
          border-radius: 6px;
          border-left: 4px solid #d4af37;
        }
        .info-label {
          color: #d4af37;
          font-weight: 600;
          min-width: 120px;
          font-size: 13px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .info-value {
          color: #333333;
          flex: 1;
          font-size: 14px;
        }
        .testimonial-box {
          background: linear-gradient(135deg, rgba(212, 175, 55, 0.05) 0%, rgba(212, 175, 55, 0.1) 100%);
          padding: 25px;
          border-radius: 8px;
          border-left: 5px solid #d4af37;
          line-height: 1.8;
          color: #333333;
          font-size: 15px;
          font-style: italic;
          word-wrap: break-word;
          box-shadow: 0 2px 8px rgba(212, 175, 55, 0.1);
        }
        .cta-section {
          background: linear-gradient(135deg, rgba(212, 175, 55, 0.1) 0%, rgba(212, 175, 55, 0.05) 100%);
          padding: 20px;
          border-radius: 8px;
          text-align: center;
          margin-top: 30px;
          border: 2px solid #d4af37;
        }
        .cta-button {
          display: inline-block;
          background: linear-gradient(135deg, #d4af37 0%, #c4a027 100%);
          color: #1a1a1a;
          padding: 14px 32px;
          border-radius: 6px;
          text-decoration: none;
          font-weight: 700;
          font-size: 14px;
          text-transform: uppercase;
          letter-spacing: 1px;
          margin-top: 15px;
          box-shadow: 0 4px 12px rgba(212, 175, 55, 0.3);
        }
        .footer {
          background: #f0f0f0;
          padding: 20px;
          text-align: center;
          font-size: 12px;
          color: #666666;
          border-top: 1px solid #e0e0e0;
        }
        .timestamp {
          color: #999999;
          font-size: 11px;
          margin-top: 10px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <!-- Header -->
        <div class="header">
          <div class="logo">TrendyInterios</div>
          <div class="tagline">Luxury Interior Design Solutions</div>
          <span class="badge">New Testimonial</span>
        </div>

        <!-- Content -->
        <div class="content">
          <div class="section">
            <div class="section-title">⭐ New Customer Testimonial</div>
            <p style="color: #666666; font-size: 14px; line-height: 1.6; margin-bottom: 20px;">
              A customer has shared their experience with TrendyInterios. Review and approve/moderate as needed.
            </p>
          </div>

          <div class="section">
            <div class="section-title">Customer Details</div>
            <div class="info-row">
              <div class="info-label">Name</div>
              <div class="info-value">${name}</div>
            </div>
            ${mobileNumber ? `
            <div class="info-row">
              <div class="info-label">Phone</div>
              <div class="info-value">${mobileNumber}</div>
            </div>
            ` : ''}
            ${postalAddress ? `
            <div class="info-row">
              <div class="info-label">Location</div>
              <div class="info-value">${postalAddress}</div>
            </div>
            ` : ''}
          </div>

          <div class="section">
            <div class="section-title">Rating</div>
            <div class="rating">${stars}</div>
          </div>

          <div class="section">
            <div class="section-title">Testimonial Message</div>
            <div class="testimonial-box">
              "${testimonialText}"
            </div>
          </div>

          <div class="cta-section">
            <strong style="color: #1a1a1a;">Review & Approve this testimonial</strong>
            <a href="${process.env.ADMIN_DASHBOARD_URL || 'http://localhost:3000/admin'}" class="cta-button">Go to Dashboard</a>
          </div>
        </div>

        <!-- Footer -->
        <div class="footer">
          <strong>TrendyInterios Admin Dashboard</strong>
          <div class="timestamp">Received: ${formattedDate}</div>
          <div style="margin-top: 10px; color: #999999;">
            This is an automated notification from your website. Please do not reply to this email.
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
};

const generateAdminLoginAlertHTML = (data) => {
  const { name, email, role } = data;
  const roleLabel = role === 'admin' ? 'Admin' : 'User';
  const formattedDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Admin Login Alert - TrendyInterios</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: linear-gradient(135deg, #1a1a1a 0%, #242424 100%); padding: 20px; }
        .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 10px 40px rgba(212, 175, 55, 0.2); }
        .header { background: linear-gradient(135deg, #1a1a1a 0%, #242424 100%); padding: 40px 20px; text-align: center; border-bottom: 4px solid #d4af37; }
        .logo { font-size: 32px; font-weight: 700; color: #d4af37; margin-bottom: 10px; letter-spacing: 2px; }
        .tagline { color: #b0b0b0; font-size: 14px; font-weight: 300; }
        .badge { display: inline-block; background: #d4af37; color: #1a1a1a; padding: 6px 16px; border-radius: 20px; font-size: 12px; font-weight: 600; margin-top: 15px; text-transform: uppercase; letter-spacing: 1px; }
        .content { padding: 40px; }
        .section { margin-bottom: 30px; }
        .section-title { color: #d4af37; font-size: 18px; font-weight: 700; margin-bottom: 15px; text-transform: uppercase; letter-spacing: 1px; border-bottom: 2px solid #d4af37; padding-bottom: 10px; }
        .info-box { background: #f8f8f8; padding: 20px; border-radius: 8px; border-left: 4px solid #d4af37; }
        .info-row { margin-bottom: 12px; }
        .info-label { color: #d4af37; font-weight: 600; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; }
        .info-value { color: #333333; font-size: 14px; margin-top: 4px; }
        .alert-message { background: linear-gradient(135deg, rgba(212, 175, 55, 0.05) 0%, rgba(212, 175, 55, 0.1) 100%); padding: 20px; border-radius: 8px; border: 2px solid #d4af37; color: #1a1a1a; line-height: 1.6; font-size: 14px; }
        .footer { background: #f0f0f0; padding: 20px; text-align: center; font-size: 12px; color: #666666; border-top: 1px solid #e0e0e0; }
        .timestamp { color: #999999; font-size: 11px; margin-top: 10px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">TrendyInterios</div>
          <div class="tagline">Luxury Interior Design Solutions</div>
          <span class="badge">Login Alert</span>
        </div>
        <div class="content">
          <div class="section">
            <div class="section-title">🔐 ${roleLabel} Login Detected</div>
            <div class="alert-message">
              A ${roleLabel.toLowerCase()} has logged into TrendyInterios. If this was not you, please change your password immediately.
            </div>
          </div>
          <div class="section">
            <div class="section-title">Login Details</div>
            <div class="info-box">
              <div class="info-row">
                <div class="info-label">${roleLabel} Name</div>
                <div class="info-value">${name}</div>
              </div>
              <div class="info-row">
                <div class="info-label">Email Address</div>
                <div class="info-value">${email}</div>
              </div>
              <div class="info-row">
                <div class="info-label">Login Time</div>
                <div class="info-value">${formattedDate}</div>
              </div>
            </div>
          </div>
        </div>
        <div class="footer">
          <strong>TrendyInterios Admin Dashboard</strong>
          <div class="timestamp">Alert sent: ${formattedDate}</div>
          <div style="margin-top: 10px; color: #999999;">
            This is an automated security alert from your website.
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
};

const generatePasswordChangeAlertHTML = (data) => {
  const { name, email } = data;
  const formattedDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Password Changed - TrendyInterios</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: linear-gradient(135deg, #1a1a1a 0%, #242424 100%); padding: 20px; }
        .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 10px 40px rgba(212, 175, 55, 0.2); }
        .header { background: linear-gradient(135deg, #1a1a1a 0%, #242424 100%); padding: 40px 20px; text-align: center; border-bottom: 4px solid #d4af37; }
        .logo { font-size: 32px; font-weight: 700; color: #d4af37; margin-bottom: 10px; letter-spacing: 2px; }
        .tagline { color: #b0b0b0; font-size: 14px; font-weight: 300; }
        .badge { display: inline-block; background: #d4af37; color: #1a1a1a; padding: 6px 16px; border-radius: 20px; font-size: 12px; font-weight: 600; margin-top: 15px; text-transform: uppercase; letter-spacing: 1px; }
        .content { padding: 40px; }
        .section { margin-bottom: 30px; }
        .section-title { color: #d4af37; font-size: 18px; font-weight: 700; margin-bottom: 15px; text-transform: uppercase; letter-spacing: 1px; border-bottom: 2px solid #d4af37; padding-bottom: 10px; }
        .info-box { background: #f8f8f8; padding: 20px; border-radius: 8px; border-left: 4px solid #d4af37; }
        .info-row { margin-bottom: 12px; }
        .info-label { color: #d4af37; font-weight: 600; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; }
        .info-value { color: #333333; font-size: 14px; margin-top: 4px; }
        .confirmation-message { background: linear-gradient(135deg, rgba(212, 175, 55, 0.05) 0%, rgba(212, 175, 55, 0.1) 100%); padding: 20px; border-radius: 8px; border: 2px solid #d4af37; color: #1a1a1a; line-height: 1.6; font-size: 14px; }
        .footer { background: #f0f0f0; padding: 20px; text-align: center; font-size: 12px; color: #666666; border-top: 1px solid #e0e0e0; }
        .timestamp { color: #999999; font-size: 11px; margin-top: 10px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">TrendyInterios</div>
          <div class="tagline">Luxury Interior Design Solutions</div>
          <span class="badge">Password Changed</span>
        </div>
        <div class="content">
          <div class="section">
            <div class="section-title">✅ Password Successfully Changed</div>
            <div class="confirmation-message">
              Your admin password has been successfully changed. If you did not perform this action, please contact the system administrator immediately.
            </div>
          </div>
          <div class="section">
            <div class="section-title">Account Details</div>
            <div class="info-box">
              <div class="info-row">
                <div class="info-label">Admin Name</div>
                <div class="info-value">${name}</div>
              </div>
              <div class="info-row">
                <div class="info-label">Email Address</div>
                <div class="info-value">${email}</div>
              </div>
              <div class="info-row">
                <div class="info-label">Change Time</div>
                <div class="info-value">${formattedDate}</div>
              </div>
            </div>
          </div>
        </div>
        <div class="footer">
          <strong>TrendyInterios Admin Dashboard</strong>
          <div class="timestamp">Notification sent: ${formattedDate}</div>
          <div style="margin-top: 10px; color: #999999;">
            This is an automated security notification from your website.
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
};

const generatePasswordResetOTPHTML = (data) => {
  const { otp } = data;

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Password Reset OTP - TrendyInterios</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: linear-gradient(135deg, #1a1a1a 0%, #242424 100%); padding: 20px; }
        .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 10px 40px rgba(212, 175, 55, 0.2); }
        .header { background: linear-gradient(135deg, #1a1a1a 0%, #242424 100%); padding: 40px 20px; text-align: center; border-bottom: 4px solid #d4af37; }
        .logo { font-size: 32px; font-weight: 700; color: #d4af37; margin-bottom: 10px; letter-spacing: 2px; }
        .tagline { color: #b0b0b0; font-size: 14px; font-weight: 300; }
        .badge { display: inline-block; background: #d4af37; color: #1a1a1a; padding: 6px 16px; border-radius: 20px; font-size: 12px; font-weight: 600; margin-top: 15px; text-transform: uppercase; letter-spacing: 1px; }
        .content { padding: 40px; }
        .section { margin-bottom: 30px; }
        .section-title { color: #d4af37; font-size: 18px; font-weight: 700; margin-bottom: 15px; text-transform: uppercase; letter-spacing: 1px; border-bottom: 2px solid #d4af37; padding-bottom: 10px; }
        .otp-box { background: linear-gradient(135deg, rgba(212, 175, 55, 0.1) 0%, rgba(212, 175, 55, 0.05) 100%); padding: 30px 20px; border-radius: 8px; border: 2px solid #d4af37; text-align: center; }
        .otp-label { color: #d4af37; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 10px; }
        .otp-code { font-size: 48px; font-weight: 700; color: #1a1a1a; letter-spacing: 8px; font-family: 'Courier New', monospace; }
        .warning-box { background: #fff3cd; padding: 16px; border-radius: 8px; border-left: 4px solid #ffc107; color: #856404; font-size: 13px; line-height: 1.6; margin-top: 20px; }
        .footer { background: #f0f0f0; padding: 20px; text-align: center; font-size: 12px; color: #666666; border-top: 1px solid #e0e0e0; }
        .timestamp { color: #999999; font-size: 11px; margin-top: 10px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">TrendyInterios</div>
          <div class="tagline">Luxury Interior Design Solutions</div>
          <span class="badge">Password Reset OTP</span>
        </div>
        <div class="content">
          <div class="section">
            <div class="section-title">🔑 Password Reset Request</div>
            <p style="color: #666666; font-size: 14px; line-height: 1.6; margin-bottom: 20px;">
              You have requested to reset your admin password. Use the OTP below to verify your identity.
            </p>
          </div>
          <div class="section">
            <div class="otp-box">
              <div class="otp-label">Your One-Time Password</div>
              <div class="otp-code">${otp}</div>
            </div>
            <div class="warning-box">
              ⚠️ <strong>Important:</strong> This OTP is valid for 10 minutes only. Do not share this code with anyone. If you did not request this, please ignore this email.
            </div>
          </div>
        </div>
        <div class="footer">
          <strong>TrendyInterios Admin Dashboard</strong>
          <div class="timestamp">Sent: ${new Date().toLocaleString()}</div>
          <div style="margin-top: 10px; color: #999999;">
            This is an automated security notification from your website.
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
};

const generateChangePasswordOTPHTML = (data) => {
  const { otp } = data;

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Change Password OTP - TrendyInterios</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: linear-gradient(135deg, #1a1a1a 0%, #242424 100%); padding: 20px; }
        .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 10px 40px rgba(212, 175, 55, 0.2); }
        .header { background: linear-gradient(135deg, #1a1a1a 0%, #242424 100%); padding: 40px 20px; text-align: center; border-bottom: 4px solid #d4af37; }
        .logo { font-size: 32px; font-weight: 700; color: #d4af37; margin-bottom: 10px; letter-spacing: 2px; }
        .tagline { color: #b0b0b0; font-size: 14px; font-weight: 300; }
        .badge { display: inline-block; background: #d4af37; color: #1a1a1a; padding: 6px 16px; border-radius: 20px; font-size: 12px; font-weight: 600; margin-top: 15px; text-transform: uppercase; letter-spacing: 1px; }
        .content { padding: 40px; }
        .section { margin-bottom: 30px; }
        .section-title { color: #d4af37; font-size: 18px; font-weight: 700; margin-bottom: 15px; text-transform: uppercase; letter-spacing: 1px; border-bottom: 2px solid #d4af37; padding-bottom: 10px; }
        .otp-box { background: linear-gradient(135deg, rgba(212, 175, 55, 0.1) 0%, rgba(212, 175, 55, 0.05) 100%); padding: 30px 20px; border-radius: 8px; border: 2px solid #d4af37; text-align: center; }
        .otp-label { color: #d4af37; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 10px; }
        .otp-code { font-size: 48px; font-weight: 700; color: #1a1a1a; letter-spacing: 8px; font-family: 'Courier New', monospace; }
        .warning-box { background: #fff3cd; padding: 16px; border-radius: 8px; border-left: 4px solid #ffc107; color: #856404; font-size: 13px; line-height: 1.6; margin-top: 20px; }
        .footer { background: #f0f0f0; padding: 20px; text-align: center; font-size: 12px; color: #666666; border-top: 1px solid #e0e0e0; }
        .timestamp { color: #999999; font-size: 11px; margin-top: 10px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">TrendyInterios</div>
          <div class="tagline">Luxury Interior Design Solutions</div>
          <span class="badge">Change Password OTP</span>
        </div>
        <div class="content">
          <div class="section">
            <div class="section-title">🔑 Change Password Request</div>
            <p style="color: #666666; font-size: 14px; line-height: 1.6; margin-bottom: 20px;">
              You have requested to change your admin password from the dashboard. Use the OTP below to verify your identity and proceed with the password change.
            </p>
          </div>
          <div class="section">
            <div class="otp-box">
              <div class="otp-label">Your One-Time Password</div>
              <div class="otp-code">${otp}</div>
            </div>
            <div class="warning-box">
              ⚠️ <strong>Important:</strong> This OTP is valid for 10 minutes only. Do not share this code with anyone. If you did not request this, please ignore this email.
            </div>
          </div>
        </div>
        <div class="footer">
          <strong>TrendyInterios Admin Dashboard</strong>
          <div class="timestamp">Sent: ${new Date().toLocaleString()}</div>
          <div style="margin-top: 10px; color: #999999;">
            This is an automated security notification from your website.
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
};

const generateQuotationDeliveryHTML = (data) => {
  const { customerName, customerEmail, totalArea, estimatedAmount, referenceNumber, projectRooms } = data;
  const formattedDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  const roomsList = Array.isArray(projectRooms) 
    ? projectRooms.join(', ') 
    : typeof projectRooms === 'object' 
      ? Object.keys(projectRooms).filter(room => projectRooms[room] > 0).join(', ')
      : 'Multiple Rooms';

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Your Interior Design Quotation - TrendyInterios</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          background: linear-gradient(135deg, #1a1a1a 0%, #242424 100%);
          padding: 20px;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          background: #ffffff;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 10px 40px rgba(212, 175, 55, 0.2);
        }
        .header {
          background: linear-gradient(135deg, #1a1a1a 0%, #242424 100%);
          padding: 40px 20px;
          text-align: center;
          border-bottom: 4px solid #d4af37;
        }
        .logo {
          font-size: 32px;
          font-weight: 700;
          color: #d4af37;
          margin-bottom: 10px;
          letter-spacing: 2px;
        }
        .tagline {
          color: #b0b0b0;
          font-size: 14px;
          font-weight: 300;
        }
        .badge {
          display: inline-block;
          background: #d4af37;
          color: #1a1a1a;
          padding: 6px 16px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 600;
          margin-top: 15px;
          text-transform: uppercase;
          letter-spacing: 1px;
        }
        .content {
          padding: 40px;
        }
        .section {
          margin-bottom: 30px;
        }
        .section-title {
          color: #d4af37;
          font-size: 18px;
          font-weight: 700;
          margin-bottom: 15px;
          text-transform: uppercase;
          letter-spacing: 1px;
          border-bottom: 2px solid #d4af37;
          padding-bottom: 10px;
        }
        .info-row {
          display: flex;
          margin-bottom: 15px;
          padding: 12px;
          background: #f8f8f8;
          border-radius: 6px;
          border-left: 4px solid #d4af37;
        }
        .info-label {
          color: #d4af37;
          font-weight: 600;
          min-width: 140px;
          font-size: 13px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .info-value {
          color: #333333;
          flex: 1;
          font-size: 14px;
        }
        .highlight-box {
          background: linear-gradient(135deg, rgba(212, 175, 55, 0.1) 0%, rgba(212, 175, 55, 0.05) 100%);
          padding: 20px;
          border-radius: 8px;
          border: 2px solid #d4af37;
          text-align: center;
          margin: 20px 0;
        }
        .amount-display {
          font-size: 32px;
          font-weight: 700;
          color: #d4af37;
          margin: 10px 0;
        }
        .cta-section {
          background: linear-gradient(135deg, rgba(212, 175, 55, 0.1) 0%, rgba(212, 175, 55, 0.05) 100%);
          padding: 20px;
          border-radius: 8px;
          text-align: center;
          margin-top: 30px;
          border: 2px solid #d4af37;
        }
        .cta-button {
          display: inline-block;
          background: linear-gradient(135deg, #d4af37 0%, #c4a027 100%);
          color: #1a1a1a;
          padding: 14px 32px;
          border-radius: 6px;
          text-decoration: none;
          font-weight: 700;
          font-size: 14px;
          text-transform: uppercase;
          letter-spacing: 1px;
          margin-top: 15px;
          box-shadow: 0 4px 12px rgba(212, 175, 55, 0.3);
          transition: all 0.3s ease;
        }
        .note-box {
          background: #fff3cd;
          padding: 16px;
          border-radius: 8px;
          border-left: 4px solid #ffc107;
          color: #856404;
          font-size: 13px;
          line-height: 1.6;
          margin-top: 20px;
        }
        .footer {
          background: #f0f0f0;
          padding: 20px;
          text-align: center;
          font-size: 12px;
          color: #666666;
          border-top: 1px solid #e0e0e0;
        }
        .timestamp {
          color: #999999;
          font-size: 11px;
          margin-top: 10px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <!-- Header -->
        <div class="header">
          <div class="logo">TrendyInterios</div>
          <div class="tagline">Luxury Interior Design Solutions</div>
          <span class="badge">Your Interior Design Quotation</span>
        </div>

        <!-- Content -->
        <div class="content">
          <div class="section">
            <div class="section-title">✅ Quotation Ready</div>
            <p style="color: #666666; font-size: 14px; line-height: 1.6; margin-bottom: 20px;">
              Dear <strong>${customerName}</strong>,<br><br>
              Thank you for choosing TrendyInterios! We're excited to present your personalized interior design quotation based on your project specifications.
            </p>
          </div>

          <div class="section">
            <div class="section-title">📋 Project Overview</div>
            <div class="info-row">
              <div class="info-label">Reference</div>
              <div class="info-value"><strong>${referenceNumber}</strong></div>
            </div>
            <div class="info-row">
              <div class="info-label">Selected Rooms</div>
              <div class="info-value">${roomsList}</div>
            </div>
            <div class="info-row">
              <div class="info-label">Total Area</div>
              <div class="info-value"><strong>${totalArea} sq.ft</strong></div>
            </div>
            <div class="info-row">
              <div class="info-label">Estimated Amount</div>
              <div class="info-value" style="color: #d4af37; font-weight: 700;"><strong>₹${estimatedAmount}</strong></div>
            </div>
          </div>

          <div class="highlight-box">
            <p style="color: #666666; font-size: 14px; margin-bottom: 10px;">Your Estimated Investment</p>
            <div class="amount-display">₹${estimatedAmount}</div>
            <p style="color: #999999; font-size: 12px;">GST (18%) included in the final quotation</p>
          </div>

          <div class="section">
            <div class="section-title">📄 Next Steps</div>
            <p style="color: #666666; font-size: 14px; line-height: 1.8; margin-bottom: 15px;">
              ✓ <strong>Review the attached PDF</strong> - Contains detailed breakdown of all costs and specifications<br>
              ✓ <strong>Project Timeline</strong> - Typically 30-45 days from order confirmation<br>
              ✓ <strong>Payment Terms</strong> - 50% advance, 50% upon completion<br>
              ✓ <strong>Free Consultation</strong> - Contact us to discuss customization options
            </p>
          </div>

          <div class="cta-section">
            <strong style="color: #1a1a1a;">Ready to proceed with your dream space?</strong>
            <p style="color: #666666; font-size: 12px; margin-top: 10px;">Contact us to confirm your order and discuss next steps</p>
            <a href="mailto:${process.env.ADMIN_EMAIL || 'contact@trendyinterios.com'}" class="cta-button">Confirm Order</a>
          </div>

          <div class="note-box">
            ⏰ <strong>Quotation Valid For:</strong> 30 days from the date of issue. Special offers and pricing are subject to confirmation within this period.
          </div>
        </div>

        <!-- Footer -->
        <div class="footer">
          <strong>TrendyInterios</strong>
          <div style="margin-top: 10px;">
            <p>138, Muthugoundampalayam, Kavindapadi, Erode</p>
            <p>📞 +91 99652 99777 | 📧 trendyinteriors@gmail.com</p>
          </div>
          <div class="timestamp">Quotation issued: ${formattedDate}</div>
          <div style="margin-top: 10px; color: #999999; font-size: 10px;">
            This is an automated quotation delivery email. Please don't reply to this email directly. Use the contact information above or the "Confirm Order" button above to get in touch.
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
};

const generateMeetingRequestAdminHTML = (data) => {
  const {
    name,
    email,
    phone,
    preferredDate,
    preferredTime,
    message,
    projectType,
    propertyLocation,
  } = data;

  const formattedDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>New Meeting Request - TrendyInterios</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #f4f4f4; color: #333; padding: 20px; }
        .container { max-width: 680px; margin: 0 auto; background: #ffffff; border-radius: 14px; overflow: hidden; box-shadow: 0 18px 55px rgba(0,0,0,0.08); }
        .header { background: linear-gradient(135deg, #1a1a1a 0%, #242424 100%); padding: 30px 24px; color: #d4af37; }
        .header h1 { font-size: 24px; margin-bottom: 6px; }
        .header p { color: #ffffff; font-size: 14px; opacity: 0.9; }
        .content { padding: 28px 30px; }
        .section { margin-bottom: 24px; }
        .section-title { color: #1a1a1a; font-size: 16px; font-weight: 700; margin-bottom: 14px; }
        .info-row { padding: 14px 16px; background: #f9f9f9; border-radius: 10px; margin-bottom: 10px; display: flex; justify-content: space-between; }
        .info-label { color: #8a6d1b; font-weight: 700; font-size: 13px; letter-spacing: 0.5px; text-transform: uppercase; }
        .info-value { color: #333333; font-size: 14px; text-align: right; max-width: 70%; }
        .message-box { padding: 20px; background: #f5f5f5; border-radius: 12px; line-height: 1.65; color: #444444; font-size: 14px; }
        .footer { background: #fafafa; padding: 20px 24px; text-align: center; border-top: 1px solid #e8e8e8; font-size: 12px; color: #777777; }
        .timestamp { margin-top: 10px; color: #999999; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>New Meeting Request Received</h1>
          <p>Received: ${formattedDate}</p>
        </div>
        <div class="content">
          <div class="section">
            <div class="section-title">Customer Details</div>
            <div class="info-row"><span class="info-label">Name</span><span class="info-value">${name || 'Not provided'}</span></div>
            <div class="info-row"><span class="info-label">Email</span><span class="info-value"><a href="mailto:${email}" style="color:#d4af37;text-decoration:none;">${email || 'Not provided'}</a></span></div>
            <div class="info-row"><span class="info-label">Phone</span><span class="info-value">${phone || 'Not provided'}</span></div>
          </div>
          <div class="section">
            <div class="section-title">Meeting Details</div>
            <div class="info-row"><span class="info-label">Preferred Date</span><span class="info-value">${preferredDate || 'Not specified'}</span></div>
            <div class="info-row"><span class="info-label">Preferred Time</span><span class="info-value">${preferredTime || 'Not specified'}</span></div>
            <div class="info-row"><span class="info-label">Project Type</span><span class="info-value">${projectType || 'Not specified'}</span></div>
            <div class="info-row"><span class="info-label">Location</span><span class="info-value">${propertyLocation || 'Not specified'}</span></div>
          </div>
          <div class="section">
            <div class="section-title">Message</div>
            <div class="message-box">${message || 'No additional message provided.'}</div>
          </div>
        </div>
        <div class="footer">
          This email was generated automatically by the TrendyInterios chatbot. Please follow up with the customer promptly.
        </div>
      </div>
    </body>
    </html>
  `;
};

const generateMeetingRequestConfirmationHTML = (data) => {
  const { name, preferredDate, preferredTime } = data;
  const formattedDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>Meeting Request Confirmation</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #f7f7f7; color: #333; padding: 20px; }
        .container { max-width: 620px; margin: 0 auto; background: #ffffff; border-radius: 14px; overflow: hidden; box-shadow: 0 16px 42px rgba(0,0,0,0.08); }
        .header { background: linear-gradient(135deg, #1a1a1a 0%, #242424 100%); padding: 26px 24px; color: #d4af37; }
        .header h1 { font-size: 22px; margin-bottom: 8px; }
        .header p { color: #ffffff; opacity: 0.85; font-size: 14px; }
        .content { padding: 28px 30px; }
        .greeting { font-size: 16px; margin-bottom: 20px; line-height: 1.75; }
        .details { background: #f7f7f7; padding: 22px; border-radius: 12px; margin-bottom: 22px; }
        .details-row { display: flex; justify-content: space-between; margin-bottom: 12px; }
        .details-label { color: #8a6d1b; font-weight: 700; text-transform: uppercase; font-size: 12px; letter-spacing: 0.6px; }
        .details-value { color: #1f1f1f; font-size: 15px; max-width: 70%; text-align: right; }
        .note { color: #555555; font-size: 14px; line-height: 1.7; }
        .footer { background: #fafafa; padding: 20px 24px; text-align: center; border-top: 1px solid #e9e9e9; font-size: 13px; color: #777777; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Meeting Request Confirmation</h1>
          <p>Thank you for reaching out to TrendyInterios.</p>
        </div>
        <div class="content">
          <p class="greeting">Hi ${name || 'there'},</p>
          <p class="note">We have received your meeting request and our team is reviewing it. Here are the details we received:</p>
          <div class="details">
            <div class="details-row"><span class="details-label">Preferred Date</span><span class="details-value">${preferredDate || 'Not specified'}</span></div>
            <div class="details-row"><span class="details-label">Preferred Time</span><span class="details-value">${preferredTime || 'Not specified'}</span></div>
          </div>
          <p class="note">A member of our design team will contact you soon to confirm the booking and discuss the next steps.</p>
          <p class="note">If you need to update your request, please reply to this email or contact us directly.</p>
        </div>
        <div class="footer">
          <strong>TrendyInterios</strong>
          <div style="margin-top: 8px;">Confirmation sent: ${formattedDate}</div>
        </div>
      </div>
    </body>
    </html>
  `;
};

module.exports = {
  generateContactEmailHTML,
  generateTestimonialEmailHTML,
  generateAdminLoginAlertHTML,
  generatePasswordChangeAlertHTML,
  generatePasswordResetOTPHTML,
  generateChangePasswordOTPHTML,
  generateQuotationDeliveryHTML,
  generateMeetingRequestAdminHTML,
  generateMeetingRequestConfirmationHTML,
};
