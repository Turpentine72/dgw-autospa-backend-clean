const Brevo = require('@getbrevo/brevo');

let apiInstance = null;

const getBrevoInstance = () => {
  if (apiInstance) return apiInstance;
  apiInstance = new Brevo.TransactionalEmailsApi();
  apiInstance.setApiKey(Brevo.TransactionalEmailsApiApiKeys.apiKey, process.env.BREVO_API_KEY);
  return apiInstance;
};

// Generic send function using Brevo HTTP API
const sendEmail = async (to, subject, html) => {
  const api = getBrevoInstance();
  const sendSmtpEmail = new Brevo.SendSmtpEmail();
  sendSmtpEmail.subject = subject;
  sendSmtpEmail.to = [{ email: to }];
  sendSmtpEmail.htmlContent = html;
  sendSmtpEmail.sender = { name: 'DGW Autospa', email: process.env.EMAIL_FROM };
  await api.sendTransacEmail(sendSmtpEmail);
};

const getCompanyEmail = () => process.env.COMPANY_EMAIL || process.env.EMAIL_FROM;

// ----- Contact alert (to company) -----
const sendContactAlert = async (contact) => {
  const subject = `📧 New Contact Message from ${contact.name}`;
  const html = `
    <h2>New Contact Message</h2>
    <p><strong>Name:</strong> ${contact.name}</p>
    <p><strong>Email:</strong> ${contact.email}</p>
    <p><strong>Subject:</strong> ${contact.subject || 'N/A'}</p>
    <p><strong>Service:</strong> ${contact.service || 'N/A'}</p>
    <p><strong>Message:</strong><br/>${contact.message}</p>
    <hr/>
    <p style="font-size:12px;">Reply directly from the admin panel – the customer will receive an email.</p>
  `;
  await sendEmail(getCompanyEmail(), subject, html);
};

// ----- Customer booking confirmation -----
const sendCustomerBookingConfirmation = async (booking) => {
  const subject = `🎉 Booking Received – ${booking.serviceName}`;
  const html = `
    <h2>Thank you, ${booking.customerName}!</h2>
    <p>Your booking for <strong>${booking.serviceName}</strong> has been received.</p>
    <p><strong>Preferred Date:</strong> ${new Date(booking.date).toLocaleDateString()}</p>
    <p><strong>Time:</strong> ${booking.time}</p>
    <p>We will contact you shortly to confirm pricing and availability.</p>
  `;
  await sendEmail(booking.customerEmail, subject, html);
};

// ----- Booking alert to company -----
const sendBookingAlert = async (booking) => {
  const subject = `🚗 New Booking: ${booking.serviceName}`;
  const html = `
    <h2>New Booking Received</h2>
    <p><strong>Customer:</strong> ${booking.customerName}</p>
    <p><strong>Email:</strong> ${booking.customerEmail}</p>
    <p><strong>Phone:</strong> ${booking.customerPhone || 'N/A'}</p>
    <p><strong>Service:</strong> ${booking.serviceName}</p>
    <p><strong>Date:</strong> ${booking.date}</p>
    <p><strong>Time:</strong> ${booking.time}</p>
    ${booking.notes ? `<p><strong>Notes:</strong> ${booking.notes}</p>` : ''}
    <hr/>
    <p>Log in to the admin panel to manage this booking.</p>
  `;
  await sendEmail(getCompanyEmail(), subject, html);
};

// ----- Booking status update to customer -----
const sendBookingStatusUpdate = async (booking) => {
  let statusText = '';
  switch (booking.status) {
    case 'contacted': statusText = 'We have contacted you with pricing details.'; break;
    case 'confirmed': statusText = `Your appointment is confirmed for ${booking.date} at ${booking.time}.`; break;
    case 'completed': statusText = 'Your service has been completed. Thank you!'; break;
    case 'cancelled': statusText = 'Your booking has been cancelled.'; break;
    default: statusText = 'Your booking status has been updated.';
  }
  const subject = `Booking ${booking.status} – ${booking.serviceName}`;
  const html = `<h2>Booking Update</h2><p>Dear ${booking.customerName},</p><p>${statusText}</p>${booking.adminNotes ? `<p><strong>Note from us:</strong> ${booking.adminNotes}</p>` : ''}`;
  await sendEmail(booking.customerEmail, subject, html);
};

// ----- Review status update -----
const sendReviewStatusUpdate = async (review, status) => {
  const isApproved = status === 'approved';
  const subject = isApproved ? '⭐ Your Review Has Been Approved' : '📝 Update on Your Review';
  const html = `<h2>${subject}</h2><p>Dear ${review.customerName},</p><p>${isApproved ? 'Thank you for your feedback! Your review is now live on our website.' : 'Unfortunately, your review was not published.'}</p>${review.reply ? `<p><strong>Our reply:</strong> ${review.reply}</p>` : ''}`;
  await sendEmail(review.customerEmail, subject, html);
};

// ----- OTP for password reset or email change -----
const sendOTP = async (email, otp, purpose = 'password reset') => {
  const subject = `🔐 Your OTP for ${purpose}`;
  const html = `<h2>OTP Verification</h2><p>Use the following OTP to complete your ${purpose}:</p><h1 style="letter-spacing:4px;">${otp}</h1><p>This OTP expires in 10 minutes.</p>`;
  await sendEmail(email, subject, html);
};

// ----- Email change verification -----
const sendEmailChangeVerification = async (newEmail, otp) => {
  const subject = '🔐 Verify Your New Email Address';
  const html = `<h2>Email Change Request</h2><p>Use this OTP to verify your new email address: <strong>${otp}</strong></p><p>Expires in 10 minutes.</p>`;
  await sendEmail(newEmail, subject, html);
};

// ----- Contact reply to customer -----
const sendContactReply = async (contact) => {
  const subject = `📩 Reply from DGW Autospa`;
  const html = `<h2>Message from our team</h2><p>Dear ${contact.name},</p><p>Thank you for reaching out. Here is our response:</p><div style="background:#f3f4f6; padding:10px;">${contact.reply}</div><p>If you have further questions, please don't hesitate to contact us.</p>`;
  await sendEmail(contact.email, subject, html);
};

// ----- Promotion reminder (for Saturday free service) -----
const sendPromotionReminder = async (booking) => {
  const subject = `🎁 Reminder: Your FREE Wheel Service is today!`;
  const html = `<h2>FREE Wheel Service Reminder</h2><p>Dear ${booking.customerName},</p><p>This is a reminder that your FREE Wheel Service is scheduled for <strong>today at ${booking.time}</strong>.</p><p>Address: 4, Ibrahim Odofin Street, Idado Estate, Lekki, Lagos</p><p>We look forward to serving you!</p>`;
  await sendEmail(booking.customerEmail, subject, html);
};

// ----- Export all functions used by controllers -----
module.exports = {
  sendContactAlert,
  sendCustomerBookingConfirmation,
  sendBookingAlert,
  sendBookingStatusUpdate,
  sendReviewStatusUpdate,
  sendOTP,
  sendEmailChangeVerification,
  sendContactReply,
  sendPromotionReminder,
};