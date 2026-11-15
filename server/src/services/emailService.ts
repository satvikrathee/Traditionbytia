import nodemailer from 'nodemailer';
import { ENV } from '../config/env.js';
import { IOrder } from '../models/Order.js';

let transporter: nodemailer.Transporter | null = null;

export const initEmailTransporter = () => {
  if (ENV.SMTP_USER && ENV.SMTP_PASS) {
    const cleanPass = ENV.SMTP_PASS.replace(/\s+/g, '');
    if (ENV.SMTP_HOST.includes('gmail') || ENV.SMTP_USER.includes('@gmail.com')) {
      transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: ENV.SMTP_USER,
          pass: cleanPass,
        },
      });
    } else {
      transporter = nodemailer.createTransport({
        host: ENV.SMTP_HOST,
        port: ENV.SMTP_PORT,
        secure: ENV.SMTP_PORT === 465,
        auth: {
          user: ENV.SMTP_USER,
          pass: cleanPass,
        },
      });
    }
    console.log('[Email] Nodemailer configured with SMTP user:', ENV.SMTP_USER);
  } else {
    console.log('[Email] SMTP credentials not provided. Emails will be logged to console in dev mode.');
  }
};

const sendEmailWithRetry = async (
  options: { to: string; subject: string; html: string },
  retries = 2
): Promise<boolean> => {
  try {
    if (!transporter) {
      console.log(`\n================== [EMAIL SIMULATED: ${options.subject}] ==================`);
      console.log(`To: ${options.to}`);
      console.log(`Subject: ${options.subject}`);
      console.log(`[Email Content Preview]\n${options.html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').slice(0, 300)}...`);
      console.log('========================================================================\n');
      return true;
    }

    await transporter.sendMail({
      from: ENV.EMAIL_FROM,
      replyTo: 'traditionbytia@gmail.com',
      to: options.to,
      subject: options.subject,
      html: options.html,
    });
    console.log(`[Email] Successfully sent email to ${options.to}: ${options.subject}`);
    return true;
  } catch (error: any) {
    console.error(`[Email] Send failed (${retries} retries left):`, error.message);
    if (retries > 0) {
      await new Promise((res) => setTimeout(res, 2000));
      return sendEmailWithRetry(options, retries - 1);
    }
    return false;
  }
};

// Beautiful Brand HTML Template Generator
const renderEmailLayout = (title: string, bodyContent: string) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body { margin:0; padding:0; background-color:#FFF8EE; font-family:'Helvetica Neue', Helvetica, Arial, sans-serif; color:#2B2B2B; }
    .container { max-width:600px; margin:20px auto; background-color:#ffffff; border-radius:12px; overflow:hidden; box-shadow:0 8px 24px rgba(123, 30, 58, 0.08); border:1px solid #F0E3D0; }
    .header { background:linear-gradient(135deg, #7B1E3A 0%, #521225 100%); padding:36px 24px; text-align:center; color:#FFF8EE; }
    .logo-title { font-size:26px; font-weight:700; letter-spacing:1.5px; font-family:'Georgia', serif; color:#FFF8EE; margin:0; }
    .logo-subtitle { font-size:12px; color:#C9A24B; text-transform:uppercase; letter-spacing:3px; margin-top:6px; font-weight:600; }
    .gold-divider { height:2px; background:linear-gradient(90deg, transparent, #C9A24B, transparent); margin:18px auto; width:140px; }
    .content { padding:32px 28px; }
    .footer { background-color:#FAF4EB; padding:24px; text-align:center; font-size:12px; color:#7A7A7A; border-top:1px solid #EFE4D6; }
    .btn { display:inline-block; padding:12px 28px; background-color:#7B1E3A; color:#FFF8EE !important; text-decoration:none; border-radius:6px; font-weight:600; font-size:14px; letter-spacing:0.5px; margin-top:20px; border:1px solid #C9A24B; }
    .order-badge { background-color:#FFF8EE; border:1px solid #C9A24B; color:#7B1E3A; font-weight:700; padding:4px 10px; border-radius:4px; font-size:13px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 class="logo-title">Traditions By Tiya</h1>
      <div class="gold-divider"></div>
      <div class="logo-subtitle">Timeless Heritage &middot; Royal Elegance</div>
    </div>
    <div class="content">
      ${bodyContent}
    </div>
    <div class="footer">
      <p style="margin:0 0 6px 0; font-weight:600; color:#521225;">Traditions By Tiya &mdash; Handcrafted Heritage</p>
      <p style="margin:0;">Thank you for embracing authentic Indian craftsmanship.</p>
      <p style="margin:8px 0 0 0; font-size:11px; color:#9E9E9E;">Questions? Write to us at traditionbytia@gmail.com | +91 8708305992 | Karnal, Haryana</p>
    </div>
  </div>
</body>
</html>
`;

export const sendOrderPlacedEmail = async (order: IOrder) => {
  const itemsHtml = order.items
    .map(
      (item) => `
    <tr style="border-bottom:1px solid #F5ECE0;">
      <td style="padding:12px 0;">
        <img src="${item.image}" alt="${item.name}" width="54" height="64" style="border-radius:6px; object-fit:cover; vertical-align:middle; margin-right:12px; border:1px solid #E5D5C5;" />
        <span style="font-weight:600; color:#2B2B2B; font-size:14px;">${item.name}</span>
      </td>
      <td style="padding:12px 0; text-align:center; color:#555; font-size:14px;">&times; ${item.qty}</td>
      <td style="padding:12px 0; text-align:right; font-weight:600; color:#7B1E3A; font-size:14px;">&#8377;${(item.price * item.qty).toLocaleString('en-IN')}</td>
    </tr>`
    )
    .join('');

  const bodyContent = `
    <h2 style="color:#7B1E3A; font-family:'Georgia', serif; margin-top:0; font-size:22px;">Thank You for Your Order!</h2>
    <p style="font-size:15px; line-height:1.6; color:#4A4A4A;">
      Dear <strong>${order.address.name}</strong>, we have received your order. Our master artisans and curation team are preparing your handcrafted treasures with utmost care.
    </p>

    <div style="background-color:#FFF8EE; border:1px solid #E8D9C5; border-radius:8px; padding:16px; margin:20px 0;">
      <table style="width:100%; border-collapse:collapse; font-size:14px;">
        <tr>
          <td style="color:#666; padding:4px 0;">Order Reference:</td>
          <td style="font-weight:bold; color:#7B1E3A; text-align:right; font-family:monospace; font-size:15px;">#${order._id.toString().slice(-8).toUpperCase()}</td>
        </tr>
        <tr>
          <td style="color:#666; padding:4px 0;">Payment Method:</td>
          <td style="font-weight:600; text-align:right;">${order.paymentMethod === 'COD' ? 'Cash on Delivery (COD)' : 'UPI / Razorpay'}</td>
        </tr>
        <tr>
          <td style="color:#666; padding:4px 0;">Payment Status:</td>
          <td style="text-align:right;"><span class="order-badge">${order.paymentStatus}</span></td>
        </tr>
        <tr>
          <td style="color:#666; padding:4px 0;">Delivery To:</td>
          <td style="text-align:right; color:#333;">${order.address.city}, ${order.address.state} &ndash; ${order.address.pincode}</td>
        </tr>
      </table>
    </div>

    <h3 style="color:#521225; font-size:16px; border-bottom:2px solid #C9A24B; padding-bottom:6px; margin-top:24px;">Items in Your Order</h3>
    <table style="width:100%; border-collapse:collapse; margin-top:10px;">
      ${itemsHtml}
      <tr>
        <td colspan="2" style="padding:14px 0 6px 0; font-size:14px; color:#555;">Subtotal</td>
        <td style="padding:14px 0 6px 0; text-align:right; font-size:14px; font-weight:600;">&#8377;${order.subtotal.toLocaleString('en-IN')}</td>
      </tr>
      <tr>
        <td colspan="2" style="padding:4px 0; font-size:14px; color:#555;">Shipping</td>
        <td style="padding:4px 0; text-align:right; font-size:14px; color:#2E7D32; font-weight:600;">${order.shippingFee === 0 ? 'FREE' : `&#8377;${order.shippingFee}`}</td>
      </tr>
      <tr style="border-top:2px solid #7B1E3A;">
        <td colspan="2" style="padding:12px 0; font-size:16px; font-weight:bold; color:#7B1E3A;">Total Amount</td>
        <td style="padding:12px 0; text-align:right; font-size:18px; font-weight:bold; color:#7B1E3A;">&#8377;${order.total.toLocaleString('en-IN')}</td>
      </tr>
    </table>

    <div style="text-align:center; margin-top:28px;">
      <a href="${ENV.CLIENT_URL}/orders/${order._id}" class="btn">View &amp; Track Order Live</a>
    </div>
  `;

  const html = renderEmailLayout(`Order Confirmation #${order._id.toString().slice(-8).toUpperCase()}`, bodyContent);

  // Send asynchronously without blocking order pipeline
  sendEmailWithRetry({
    to: order.userEmail,
    subject: `Your order #${order._id.toString().slice(-8).toUpperCase()} has been placed – Traditions By Tiya`,
    html,
  }).catch((err) => console.error('[Email] Background order email error:', err));
};

export const sendOrderStatusEmail = async (order: IOrder, newStatus: string) => {
  const isShipped = newStatus === 'Shipped';
  const isDelivered = newStatus === 'Delivered';

  let statusMessage = `Your order status has been updated to: <strong>${newStatus}</strong>.`;
  if (isShipped) {
    statusMessage = `Wonderful news! Your order has been dispatched via <strong>${order.courier || 'Express Courier'}</strong>.${
      order.trackingId ? ` Tracking ID: <strong>${order.trackingId}</strong>.` : ''
    }`;
  } else if (isDelivered) {
    statusMessage = `Your handcrafted order has been successfully delivered! We hope it brings grace and celebration to your home.`;
  }

  const bodyContent = `
    <h2 style="color:#7B1E3A; font-family:'Georgia', serif; margin-top:0; font-size:22px;">Order Update: ${newStatus}</h2>
    <p style="font-size:15px; line-height:1.6; color:#4A4A4A;">
      Dear <strong>${order.address.name}</strong>,
    </p>
    <p style="font-size:15px; line-height:1.6; color:#4A4A4A;">
      ${statusMessage}
    </p>

    <div style="background-color:#FFF8EE; border:1px solid #E8D9C5; border-radius:8px; padding:16px; margin:20px 0;">
      <p style="margin:0 0 6px 0; font-size:14px;"><strong>Order ID:</strong> #${order._id.toString().slice(-8).toUpperCase()}</p>
      <p style="margin:0 0 6px 0; font-size:14px;"><strong>Status:</strong> <span class="order-badge">${newStatus}</span></p>
      ${order.courier ? `<p style="margin:0 0 6px 0; font-size:14px;"><strong>Courier:</strong> ${order.courier}</p>` : ''}
      ${order.trackingId ? `<p style="margin:0; font-size:14px;"><strong>Tracking ID:</strong> ${order.trackingId}</p>` : ''}
    </div>

    <div style="text-align:center; margin-top:28px;">
      <a href="${ENV.CLIENT_URL}/orders/${order._id}" class="btn">View Live Order Tracking</a>
    </div>
  `;

  const html = renderEmailLayout(`Order #${order._id.toString().slice(-8).toUpperCase()} - ${newStatus}`, bodyContent);

  sendEmailWithRetry({
    to: order.userEmail,
    subject: `Order #${order._id.toString().slice(-8).toUpperCase()} is now ${newStatus} – Traditions By Tiya`,
    html,
  }).catch((err) => console.error('[Email] Background status email error:', err));
};

export const sendPasswordResetEmail = async (email: string, resetToken: string) => {
  const resetUrl = `${ENV.CLIENT_URL}/reset-password?token=${resetToken}`;
  const bodyContent = `
    <h2 style="color:#7B1E3A; font-family:'Georgia', serif; margin-top:0;">Reset Your Password</h2>
    <p style="font-size:15px; line-height:1.6; color:#4A4A4A;">
      We received a request to reset your password for your Traditions By Tiya account. Click the button below to choose a new password:
    </p>
    <div style="text-align:center; margin:24px 0;">
      <a href="${resetUrl}" class="btn">Reset Password</a>
    </div>
    <p style="font-size:13px; color:#777; line-height:1.5;">
      This link will expire in 1 hour. If you did not request a password reset, you can safely ignore this email.
    </p>
  `;

  const html = renderEmailLayout('Password Reset Request', bodyContent);
  return sendEmailWithRetry({
    to: email,
    subject: 'Password Reset Link – Traditions By Tiya',
    html,
  });
};

export const sendOtpEmail = async (
  email: string,
  otp: string,
  purpose: 'signup' | 'login' = 'signup'
) => {
  const isSignup = purpose === 'signup';
  const heading = isSignup ? 'Verify Your New Account' : 'Your One-Time Login Code';
  const actionText = isSignup
    ? 'Thank you for choosing Traditions By Tiya. To complete your new account creation and join our royal heritage circle, please enter this 4-digit verification code:'
    : 'Use the 4-digit one-time code below to access your Traditions By Tiya patron account:';

  const bodyContent = `
    <h2 style="color:#7B1E3A; font-family:'Georgia', serif; margin-top:0; font-size:22px;">${heading}</h2>
    <p style="font-size:15px; line-height:1.6; color:#4A4A4A;">
      ${actionText}
    </p>

    <div style="background: linear-gradient(135deg, #FFF8EE 0%, #F5ECE0 100%); border:2px dashed #C9A24B; border-radius:12px; padding:24px; text-align:center; margin:28px 0;">
      <span style="display:block; font-size:11px; text-transform:uppercase; letter-spacing:3px; color:#8E6B29; font-weight:bold; margin-bottom:8px;">4-Digit Verification Code</span>
      <div style="font-size:42px; font-weight:bold; letter-spacing:12px; color:#7B1E3A; font-family:monospace; padding-left:12px;">
        ${otp}
      </div>
      <div style="margin-top:12px; display:inline-block; background-color:#7B1E3A; color:#FFF8EE; font-size:11px; font-weight:600; padding:4px 12px; border-radius:20px;">
        &#9201; Valid for 5 Minutes Only
      </div>
    </div>

    <p style="font-size:13px; line-height:1.6; color:#777;">
      This code was sent to your registered email address <strong>${email}</strong>. If you did not initiate this request, no account has been created and you can safely disregard this email.
    </p>
  `;

  const html = renderEmailLayout(heading, bodyContent);
  return sendEmailWithRetry({
    to: email,
    subject: `Your 4-Digit Verification Code: ${otp} – Traditions By Tiya`,
    html,
  });
};

