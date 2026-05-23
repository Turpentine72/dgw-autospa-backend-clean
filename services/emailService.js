const { sendEmail, getAdminEmail, sendBookingStatusEmail, sendReviewStatusEmail } = require('../utils/sendEmail');

const getCompanyEmail = () => process.env.COMPANY_EMAIL || process.env.EMAIL_FROM;

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

const sendCustomerBookingConfirmation = async (booking) => {
  const subject = `🎉 Booking Received – ${booking.serviceName}`;
  const html = `<h2>Thank you, ${booking.customerName}!</h2><p>Your booking for ${booking.serviceName} has been received.</p>`;
  await sendEmail(booking.customerEmail, subject, html);
};

const sendBookingAlert = async (booking) => {
  const subject = `🚗 New Booking: ${booking.serviceName}`;
  const html = `<h2>New Booking</h2><p><strong>Customer:</strong> ${booking.customerName}</p><p><strong>Service:</strong> ${booking.serviceName}</p>`;
  await sendEmail(getCompanyEmail(), subject, html);
};

const sendBookingStatusUpdate = async (booking) => {
  await sendBookingStatusEmail(booking.customerEmail, booking.customerName, booking, booking.status);
};

const sendReviewStatusUpdate = async (review, status) => {
  await sendReviewStatusEmail(review.customerEmail, review.customerName, status, review.comment, review.reply);
};

const sendOTP = async (email, otp, purpose) => {
  const subject = `🔐 Your OTP for ${purpose}`;
  const html = `<h2>Your OTP: <strong>${otp}</strong></h2><p>Valid for 10 minutes.</p>`;
  await sendEmail(email, subject, html);
};

const sendEmailChangeVerification = async (newEmail, otp) => {
  const subject = 'Verify your new email address';
  const html = `<h2>Verification OTP: ${otp}</h2>`;
  await sendEmail(newEmail, subject, html);
};

const sendContactReply = async (contact) => {
  const subject = `Reply from DGW Autospa`;
  const html = `<h2>Our response</h2><p>${contact.reply}</p>`;
  await sendEmail(contact.email, subject, html);
};

const sendPromotionReminder = async (booking) => {
  const subject = `Reminder: Your FREE Wheel Service is today!`;
  const html = `<p>Your FREE Wheel Service is scheduled for today at ${booking.time}.</p>`;
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