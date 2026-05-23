const { sendResetEmail, sendBookingStatusEmail, sendContactAutoReply, sendPromotionBookingEmail, sendWelcomeEmail, sendEmail } = require('../utils/sendEmail');

// Helper to get company email
const getCompanyEmail = () => process.env.COMPANY_EMAIL || process.env.EMAIL_FROM;

// ----- Contact alert (to company) – uses sendEmail directly -----
const sendContactAlert = async (contact) => {
  const subject = `📧 New Contact Message from ${contact.name}`;
  const html = `
    <h2>New Contact Message</h2>
    <p><strong>Name:</strong> ${contact.name}</p>
    <p><strong>Email:</strong> ${contact.email}</p>
    <p><strong>Message:</strong><br/>${contact.message}</p>
    <hr/>
    <p>Reply from admin panel will be sent automatically.</p>
  `;
  await sendEmail(getCompanyEmail(), subject, html);
};

// ----- Customer booking confirmation -----
const sendCustomerBookingConfirmation = async (booking) => {
  // reuse existing function or write similar using sendEmail
  const subject = `🎉 Booking Received – ${booking.serviceName}`;
  const html = `<h2>Thank you, ${booking.customerName}!</h2><p>Your booking for ${booking.serviceName} has been received.</p>`;
  await sendEmail(booking.customerEmail, subject, html);
};

// ----- Booking alert to company -----
const sendBookingAlert = async (booking) => {
  const subject = `🚗 New Booking: ${booking.serviceName}`;
  const html = `<h2>New Booking</h2><p>Customer: ${booking.customerName}</p>`;
  await sendEmail(getCompanyEmail(), subject, html);
};

// ----- Booking status update -----
const sendBookingStatusUpdate = async (booking) => {
  // use sendBookingStatusEmail from utils
  await sendBookingStatusEmail(booking.customerEmail, booking.customerName, booking, booking.status);
};

// ----- Review status update -----
const sendReviewStatusUpdate = async (review, status) => {
  // use sendReviewStatusEmail from utils
  await sendReviewStatusEmail(review.customerEmail, review.customerName, status, review.comment, review.reply);
};

// ----- OTP email -----
const sendOTP = async (email, otp, purpose) => {
  const subject = `🔐 Your OTP for ${purpose}`;
  const html = `<h2>OTP: ${otp}</h2><p>Valid for 10 minutes.</p>`;
  await sendEmail(email, subject, html);
};

// ----- Email change verification -----
const sendEmailChangeVerification = async (newEmail, otp) => {
  const subject = 'Verify your new email';
  const html = `<h2>OTP: ${otp}</h2>`;
  await sendEmail(newEmail, subject, html);
};

// ----- Contact reply to customer -----
const sendContactReply = async (contact) => {
  const subject = `Reply from DGW Autospa`;
  const html = `<h2>Our response</h2><p>${contact.reply}</p>`;
  await sendEmail(contact.email, subject, html);
};

// ----- Promotion reminder -----
const sendPromotionReminder = async (booking) => {
  const subject = `Reminder: FREE Wheel Service today`;
  const html = `<p>Your FREE service is today at ${booking.time}.</p>`;
  await sendEmail(booking.customerEmail, subject, html);
};

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