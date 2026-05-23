const { sendEmail, sendBookingStatusEmail, sendReviewStatusEmail } = require('../utils/sendEmail');

const getCompanyEmail = () => process.env.COMPANY_EMAIL || process.env.EMAIL_FROM;

const sendContactAlert = async (contact) => {
  const subject = `📧 New Contact Message from ${contact.name}`;
  const html = `<h2>New Contact Message</h2><p><strong>Name:</strong> ${contact.name}</p><p><strong>Email:</strong> ${contact.email}</p><p><strong>Message:</strong><br/>${contact.message}</p>`;
  await sendEmail(getCompanyEmail(), subject, html);
};

const sendCustomerBookingConfirmation = async (booking) => {
  await sendEmail(booking.customerEmail, `🎉 Booking Received – ${booking.serviceName}`, `<h2>Thank you, ${booking.customerName}!</h2><p>Your booking for ${booking.serviceName} has been received.</p>`);
};

const sendBookingAlert = async (booking) => {
  await sendEmail(getCompanyEmail(), `🚗 New Booking: ${booking.serviceName}`, `<h2>New Booking</h2><p><strong>Customer:</strong> ${booking.customerName}</p><p><strong>Service:</strong> ${booking.serviceName}</p>`);
};

const sendBookingStatusUpdate = async (booking) => {
  await sendBookingStatusEmail(booking.customerEmail, booking.customerName, booking, booking.status);
};

const sendReviewStatusUpdate = async (review, status) => {
  await sendReviewStatusEmail(review.customerEmail, review.customerName, status, review.comment, review.reply);
};

const sendOTP = async (email, otp, purpose) => {
  await sendEmail(email, `🔐 Your OTP for ${purpose}`, `<h2>OTP: <strong>${otp}</strong></h2><p>Valid for 10 minutes.</p>`);
};

const sendEmailChangeVerification = async (newEmail, otp) => {
  await sendEmail(newEmail, 'Verify your new email address', `<h2>Verification OTP: ${otp}</h2>`);
};

const sendContactReply = async (contact) => {
  await sendEmail(contact.email, 'Reply from DGW Autospa', `<h2>Our response</h2><p>${contact.reply}</p>`);
};

const sendPromotionReminder = async (booking) => {
  await sendEmail(booking.customerEmail, 'Reminder: Your FREE Wheel Service is today!', `<p>Your FREE Wheel Service is scheduled for today at ${booking.time}.</p>`);
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