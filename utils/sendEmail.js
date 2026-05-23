const axios = require('axios');
const cron = require('node-cron');
const Booking = require('../models/Booking');

// ---------- Helper to get admin email ----------
const getAdminEmail = async () => {
    try {
        const Setting = require('../models/Setting');
        const settings = await Setting.findOne();
        return settings?.superAdminEmail || process.env.SUPER_ADMIN_EMAIL;
    } catch (error) {
        console.error('Error getting admin email:', error);
        return process.env.SUPER_ADMIN_EMAIL;
    }
};

// ---------- Core sendEmail using Brevo API ----------
const sendEmail = async (to, subject, html) => {
    console.log(`📧 Attempting to send email to: ${to}, subject: ${subject}`);

    const apiKey = process.env.BREVO_API_KEY;
    if (!apiKey) {
        console.error('❌ BREVO_API_KEY is missing!');
        throw new Error('Missing BREVO_API_KEY environment variable');
    }
    if (!process.env.EMAIL_FROM) {
        console.error('❌ EMAIL_FROM is missing!');
        throw new Error('Missing EMAIL_FROM environment variable');
    }

    const data = {
        sender: { name: 'DGW Autospa', email: process.env.EMAIL_FROM },
        to: [{ email: to }],
        subject: subject,
        htmlContent: html,
    };

    try {
        console.log('📤 Sending request to Brevo API...');
        const response = await axios.post('https://api.brevo.com/v3/smtp/email', data, {
            headers: {
                'api-key': apiKey,
                'Content-Type': 'application/json',
            },
        });
        console.log('✅ Email sent successfully. Brevo response:', response.data);
        return response.data;
    } catch (error) {
        console.error('❌ Brevo API error:', error.response?.data || error.message);
        throw error;
    }
};

// ---------- Password Reset Email ----------
const sendResetEmail = async (toEmail, resetToken, userName) => {
    const adminUrl = process.env.ADMIN_URL || 'https://dgwautospa.com';
    const resetUrl = `${adminUrl}/admin/reset-password?token=${resetToken}`;
    const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
        <div style="background: linear-gradient(135deg, #1e3a8a, #2563eb); padding: 30px; text-align: center;">
            <h1 style="color: white; margin: 0;">DGW Autospa</h1>
            <p style="color: #bfdbfe; margin: 5px 0 0;">Deep Gleam On Wheels</p>
        </div>
        <div style="padding: 30px;">
            <h2 style="color: #1e3a8a; margin-top: 0;">Password Reset Request</h2>
            <p>Hello <strong>${userName}</strong>,</p>
            <p>You requested a password reset for your DGW Autospa admin account.</p>
            <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" style="background: linear-gradient(135deg, #1e3a8a, #2563eb); color: white; padding: 12px 28px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold;">Reset My Password</a>
            </div>
            <p style="color: #6b7280; font-size: 14px;">This link will expire in <strong>1 hour</strong>.</p>
            <p style="color: #6b7280; font-size: 14px;">If you didn't request this, please ignore this email.</p>
            <hr style="margin: 20px 0; border-color: #e5e7eb;">
            <p style="color: #9ca3af; font-size: 12px; margin: 0;">© 2024 DGW Autospa - Premium Automotive Care</p>
            <p style="color: #9ca3af; font-size: 12px; margin: 5px 0 0;">4, Ibrahim Odofin Street, Idado Estate, Lekki, Lagos</p>
        </div>
        </div>
    `;
    try {
        await sendEmail(toEmail, '🔐 Password Reset Request - DGW Autospa', html);
    } catch (err) {
        console.error('Failed to send reset email:', err.message);
    }
};

// ---------- Booking Status Email ----------
const sendBookingStatusEmail = async (toEmail, customerName, bookingDetails, status) => {
    const statusMessages = {
        pending: { subject: '📋 Booking Request Received', message: 'We have received your booking request and will review it shortly. We\'ll contact you within 24 hours with pricing and confirmation.' },
        contacted: { subject: '📞 We\'ve Reviewed Your Request', message: 'We have reviewed your request and will contact you shortly with pricing details. Our team will reach out via phone or email.' },
        confirmed: { subject: '✅ Booking Confirmed', message: 'Your booking has been confirmed! We look forward to serving you. Please arrive 10 minutes before your scheduled time.' },
        completed: { subject: '🎉 Service Completed', message: 'Your service has been completed. Thank you for choosing DGW Autospa! We hope you\'re satisfied with our service.' },
        cancelled: { subject: '❌ Booking Cancelled', message: 'Your booking has been cancelled as requested. We hope to serve you again in the future.' }
    };
    const info = statusMessages[status] || statusMessages.pending;
    const bookingDate = new Date(bookingDetails.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
        <div style="background: linear-gradient(135deg, #1e3a8a, #2563eb); padding: 30px; text-align: center;">
            <h1 style="color: white; margin: 0;">DGW Autospa</h1>
            <p style="color: #bfdbfe; margin: 5px 0 0;">Premium Automotive Care</p>
        </div>
        <div style="padding: 30px;">
            <h2 style="color: #1e3a8a; margin-top: 0;">${info.subject}</h2>
            <p>Dear <strong>${customerName}</strong>,</p>
            <p>${info.message}</p>
            <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #1e3a8a;">Booking Details:</h3>
            <table style="width: 100%; border-collapse: collapse;">
                <tr><td style="padding: 8px 0;"><strong>Service:</strong></td><td style="padding: 8px 0;">${bookingDetails.serviceName}</td></tr>
                <tr><td style="padding: 8px 0;"><strong>Date:</strong></td><td style="padding: 8px 0;">${bookingDate}</td></tr>
                <tr><td style="padding: 8px 0;"><strong>Time:</strong></td><td style="padding: 8px 0;">${bookingDetails.time}</td></tr>
                ${bookingDetails.quotedPrice ? `<tr><td style="padding: 8px 0;"><strong>Quote:</strong></td><td style="padding: 8px 0;">₦${bookingDetails.quotedPrice.toLocaleString()}</td></tr>` : ''}
            </table>
            </div>
            <hr style="margin: 20px 0; border-color: #e5e7eb;">
            <p style="color: #9ca3af; font-size: 12px;">Need help? Call us at <strong>+234 702 588 7213</strong></p>
            <p style="color: #9ca3af; font-size: 12px; margin: 5px 0 0;">© 2024 DGW Autospa - All rights reserved</p>
        </div>
        </div>
    `;
    try {
        await sendEmail(toEmail, info.subject, html);
    } catch (err) {
        console.error('Failed to send booking status email:', err.message);
    }
};

// ---------- Review Status Email ----------
const sendReviewStatusEmail = async (customerEmail, customerName, status, reviewComment, replyMessage = null) => {
    const isApproved = status === 'approved';
    const subject = isApproved ? '⭐ Your Review Has Been Approved' : '📝 Update on Your Review Submission';
    const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
        <div style="background: linear-gradient(135deg, #1e3a8a, #2563eb); padding: 30px; text-align: center;">
            <h1 style="color: white; margin: 0;">DGW Autospa</h1>
            <p style="color: #bfdbfe; margin: 5px 0 0;">Customer Feedback</p>
        </div>
        <div style="padding: 30px;">
            <h2 style="color: #1e3a8a; margin-top: 0;">${subject}</h2>
            <p>Dear <strong>${customerName}</strong>,</p>
            <p>${isApproved ? 'Thank you for your feedback! Your review has been approved and published on our website.' : 'Thank you for your feedback. Unfortunately, your review was not published at this time.'}</p>
            ${replyMessage ? `<div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;"><p><strong>📝 Our response:</strong></p><p>${replyMessage}</p></div>` : ''}
            <hr style="margin: 20px 0; border-color: #e5e7eb;">
            <p style="color: #9ca3af; font-size: 12px; margin: 0;">We value your feedback and look forward to serving you again!</p>
        </div>
        </div>
    `;
    try {
        await sendEmail(customerEmail, subject, html);
    } catch (err) {
        console.error('Failed to send review status email:', err.message);
    }
};

// ---------- Contact Auto‑Reply ----------
const sendContactAutoReply = async (toEmail, customerName) => {
    const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
        <div style="background: linear-gradient(135deg, #1e3a8a, #2563eb); padding: 30px; text-align: center;">
            <h1 style="color: white; margin: 0;">Thank You for Contacting Us!</h1>
        </div>
        <div style="padding: 30px;">
            <p>Dear <strong>${customerName}</strong>,</p>
            <p>Thank you for reaching out to DGW Autospa. We have received your message and will get back to you within <strong>24 hours</strong> with pricing and availability.</p>
            <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p><strong>📞 Need immediate assistance?</strong></p>
            <p>Call us at: <strong>+234 702 588 7213</strong><br>Visit us at: <strong>4, Ibrahim Odofin Street, Idado Estate, Lekki, Lagos</strong></p>
            </div>
            <hr style="margin: 20px 0; border-color: #e5e7eb;">
            <p style="color: #9ca3af; font-size: 12px; margin: 0;">We look forward to serving you!</p>
        </div>
        </div>
    `;
    try {
        await sendEmail(toEmail, '📧 We Received Your Message - DGW Autospa', html);
    } catch (err) {
        console.error('Failed to send contact auto-reply:', err.message);
    }
};

// ---------- Promotion Booking Email ----------
const sendPromotionBookingEmail = async (customerEmail, customerName, bookingDetails, status) => {
    const statusMessages = {
        pending: { subject: '🎁 FREE Wheel Service Booking Received', message: 'Your FREE Wheel Service booking has been received. We\'ll confirm your slot soon.' },
        confirmed: { subject: '✅ FREE Wheel Service Booking Confirmed', message: 'Your FREE Wheel Service booking is confirmed! We look forward to seeing you.' },
        completed: { subject: '🎉 FREE Wheel Service Completed', message: 'Your FREE Wheel Service has been completed. Thank you for choosing DGW Autospa!' },
        cancelled: { subject: '❌ Promotion Booking Cancelled', message: 'Your promotion booking has been cancelled. Please contact us if this was a mistake.' }
    };
    const info = statusMessages[status] || statusMessages.pending;
    const formattedDate = new Date(bookingDetails.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
        <div style="background: linear-gradient(135deg, #1e3a8a, #2563eb); padding: 30px; text-align: center;">
            <h1 style="color: white; margin: 0;">FREE WHEEL SERVICE</h1>
            <p style="color: #bfdbfe; margin: 5px 0 0;">Saturday Promotion</p>
        </div>
        <div style="padding: 30px;">
            <h2 style="color: #1e3a8a; margin-top: 0;">${info.subject}</h2>
            <p>Dear <strong>${customerName}</strong>,</p>
            <p>${info.message}</p>
            <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #1e3a8a;">Booking Details:</h3>
            <table style="width: 100%; border-collapse: collapse;">
                <tr><td style="padding: 8px 0;"><strong>Service:</strong></td><td style="padding: 8px 0;">FREE Wheel Service (Balancing & Alignment Check)</td></tr>
                <tr><td style="padding: 8px 0;"><strong>Date:</strong></td><td style="padding: 8px 0;">${formattedDate}</td></tr>
                <tr><td style="padding: 8px 0;"><strong>Time:</strong></td><td style="padding: 8px 0;">${bookingDetails.time}</td></tr>
                <tr><td style="padding: 8px 0;"><strong>Promo Code:</strong></td><td style="padding: 8px 0;"><strong style="color: #2563eb;">MYFREEWHEEL</strong></td></tr>
            </table>
            </div>
            <hr style="margin: 20px 0; border-color: #e5e7eb;">
            <p style="color: #9ca3af; font-size: 12px; margin: 0;">Questions? Call us at <strong>+234 702 588 7213</strong></p>
        </div>
        </div>
    `;
    try {
        await sendEmail(customerEmail, info.subject, html);
    } catch (err) {
        console.error('Failed to send promotion booking email:', err.message);
    }
};

// ---------- Get customers for promotion campaign ----------
const getCustomerEmails = async () => {
    const customers = await Booking.aggregate([
        { $match: { status: { $in: ['confirmed', 'completed'] }, customerEmail: { $exists: true, $ne: null } } },
        { $group: { _id: '$customerEmail', name: { $first: '$customerName' }, lastBooking: { $max: '$date' } } }
    ]);
    return customers;
};

// ---------- Saturday Promotion (single) ----------
const sendSaturdayPromotionEmail = async (customerEmail, customerName) => {
    const frontendUrl = process.env.FRONTEND_URL || 'https://dgwautospa.com';
    const bookingUrl = `${frontendUrl}/free-wheel-service`;
    const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
        <div style="background: linear-gradient(135deg, #1e3a8a, #2563eb); padding: 30px; text-align: center;">
            <h1 style="color: white; margin: 0;">🎁 FREE WHEEL SERVICE</h1>
            <p style="color: #bfdbfe; margin: 5px 0 0;">Limited Time Offer</p>
        </div>
        <div style="padding: 30px;">
            <p>Dear <strong>${customerName}</strong>,</p>
            <p>As a valued customer, we're offering you a <strong style="color: #2563eb;">FREE Wheel Service</strong> this Saturday!</p>
            <div style="background: linear-gradient(135deg, #fef3c7, #fde68a); padding: 20px; border-radius: 10px; margin: 20px 0; text-align: center;">
            <p style="font-size: 28px; font-weight: bold; color: #1e3a8a; margin: 0;">MYFREEWHEEL</p>
            <p style="color: #6b7280; margin: 5px 0 0;">Use this code when booking</p>
            </div>
            <div style="text-align: center; margin: 30px 0;">
            <a href="${bookingUrl}" style="background: linear-gradient(135deg, #1e3a8a, #2563eb); color: white; padding: 12px 28px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold;">Book Your Free Service</a>
            </div>
            <p style="color: #6b7280; font-size: 12px;">✓ Includes: Wheel Balancing (4 wheels) • Alignment Check • Tyre Pressure Optimization</p>
            <p style="color: #9ca3af; font-size: 12px;">This offer is valid every Saturday from 10AM - 4PM. Terms and conditions apply.</p>
        </div>
        </div>
    `;
    try {
        await sendEmail(customerEmail, '🎁 FREE WHEEL SERVICE THIS SATURDAY!', html);
        console.log(`✅ Saturday promo sent to ${customerEmail}`);
        return true;
    } catch (error) {
        console.error(`❌ Failed to send to ${customerEmail}:`, error.message);
        return false;
    }
};

// ---------- Saturday Promotion to All ----------
const sendSaturdayPromotionToAll = async () => {
    console.log('📧 Starting Saturday promotion campaign...');
    try {
        const customers = await getCustomerEmails();
        let successCount = 0, failCount = 0;
        for (const customer of customers) {
            const success = await sendSaturdayPromotionEmail(customer._id, customer.name);
            success ? successCount++ : failCount++;
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
        console.log(`📊 Campaign completed: ${successCount} sent, ${failCount} failed`);
        return { total: customers.length, sent: successCount, failed: failCount };
    } catch (error) {
        console.error('❌ Promotion campaign failed:', error);
        return { total: 0, sent: 0, failed: 0, error: error.message };
    }
};

// ---------- Cron Scheduler ----------
const startScheduler = () => {
    cron.schedule('0 8 * * 6', async () => {
        console.log('🕐 Running scheduled Saturday promotion...');
        await sendSaturdayPromotionToAll();
    }, { timezone: "Africa/Lagos", scheduled: true });
    console.log('📅 Saturday promotion scheduler started! (Runs every Saturday at 8:00 AM Nigeria time)');
};

// ---------- Welcome Email ----------
const sendWelcomeEmail = async (toEmail, customerName) => {
    const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
        <div style="background: linear-gradient(135deg, #1e3a8a, #2563eb); padding: 30px; text-align: center;">
            <h1 style="color: white; margin: 0;">Welcome to DGW Autospa!</h1>
        </div>
        <div style="padding: 30px;">
            <p>Dear <strong>${customerName}</strong>,</p>
            <p>Welcome to the DGW Autospa family! We're excited to have you on board.</p>
            <p>As a valued customer, you'll receive:</p>
            <ul><li>Exclusive promotions and discounts</li><li>Priority booking for our FREE Saturday Wheel Service</li><li>Expert automotive care tips</li></ul>
            <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.FRONTEND_URL}/services" style="background: linear-gradient(135deg, #1e3a8a, #2563eb); color: white; padding: 12px 28px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold;">Explore Our Services</a>
            </div>
            <hr style="margin: 20px 0; border-color: #e5e7eb;">
            <p style="color: #9ca3af; font-size: 12px; margin: 0;">Need help? Call us at <strong>+234 702 588 7213</strong></p>
        </div>
        </div>
    `;
    try {
        await sendEmail(toEmail, '👋 Welcome to DGW Autospa Family!', html);
    } catch (err) {
        console.error('Failed to send welcome email:', err.message);
    }
};

// ========== NEW WRAPPER FUNCTIONS FOR CONTROLLERS ==========
const getCompanyEmail = () => process.env.COMPANY_EMAIL || process.env.EMAIL_FROM;

const sendContactAlert = async (contact) => {
    const subject = `📧 New Contact Message from ${contact.name}`;
    const html = `<h2>New Contact Message</h2><p><strong>Name:</strong> ${contact.name}</p><p><strong>Email:</strong> ${contact.email}</p><p><strong>Message:</strong><br/>${contact.message}</p>`;
    try {
        await sendEmail(getCompanyEmail(), subject, html);
        console.log(`Contact alert sent for ${contact.name}`);
    } catch (error) {
        console.error('sendContactAlert failed:', error.message);
    }
};

const sendCustomerBookingConfirmation = async (booking) => {
    const subject = `🎉 Booking Received – ${booking.serviceName}`;
    const html = `<h2>Thank you, ${booking.customerName}!</h2><p>Your booking for ${booking.serviceName} has been received.</p>`;
    try {
        await sendEmail(booking.customerEmail, subject, html);
    } catch (error) {
        console.error('sendCustomerBookingConfirmation failed:', error.message);
    }
};

const sendBookingAlert = async (booking) => {
    const subject = `🚗 New Booking: ${booking.serviceName}`;
    const html = `<h2>New Booking</h2><p><strong>Customer:</strong> ${booking.customerName}</p><p><strong>Service:</strong> ${booking.serviceName}</p>`;
    try {
        await sendEmail(getCompanyEmail(), subject, html);
    } catch (error) {
        console.error('sendBookingAlert failed:', error.message);
    }
};

const sendBookingStatusUpdate = async (booking) => {
    try {
        await sendBookingStatusEmail(booking.customerEmail, booking.customerName, booking, booking.status);
    } catch (error) {
        console.error('sendBookingStatusUpdate failed:', error.message);
    }
};

const sendReviewStatusUpdate = async (review, status) => {
    try {
        await sendReviewStatusEmail(review.customerEmail, review.customerName, status, review.comment, review.reply);
    } catch (error) {
        console.error('sendReviewStatusUpdate failed:', error.message);
    }
};

const sendOTP = async (email, otp, purpose) => {
    const html = `<h2>OTP: <strong>${otp}</strong></h2><p>Valid for 10 minutes.</p>`;
    try {
        await sendEmail(email, `🔐 Your OTP for ${purpose}`, html);
    } catch (error) {
        console.error('sendOTP failed:', error.message);
    }
};

const sendNewReviewAlert = async (review) => {
    const subject = `⭐ New Review Submitted by ${review.customerName}`;
    const html = `
        <h2>New Review Submitted</h2>
        <p><strong>Customer:</strong> ${review.customerName}</p>
        <p><strong>Rating:</strong> ${review.rating} / 5</p>
        <p><strong>Comment:</strong><br/>${review.comment}</p>
    `;
    try {
        await sendEmail(getCompanyEmail(), subject, html);
        console.log(`New review alert sent for ${review.customerName}`);
    } catch (error) {
        console.error('sendNewReviewAlert failed:', error.message);
    }
};

const sendEmailChangeVerification = async (newEmail, otp) => {
    const html = `<h2>Verification OTP: ${otp}</h2>`;
    try {
        await sendEmail(newEmail, 'Verify your new email address', html);
    } catch (error) {
        console.error('sendEmailChangeVerification failed:', error.message);
    }
};

const sendContactReply = async (contact) => {
    const html = `<h2>Our response</h2><p>${contact.reply}</p>`;
    try {
        await sendEmail(contact.email, 'Reply from DGW Autospa', html);
    } catch (error) {
        console.error('sendContactReply failed:', error.message);
    }
};

const sendSuperAdminNotification = async (subject, messageHtml) => {
    const adminEmail = await getAdminEmail();  // uses the existing helper
    try {
        await sendEmail(adminEmail, `🛡️ ${subject}`, `<h2>${subject}</h2>${messageHtml}`);
        console.log(`Super admin notification sent to ${adminEmail}`);
    } catch (error) {
        console.error('sendSuperAdminNotification failed:', error.message);
    }
};

const sendPromotionReminder = async (booking) => {
    const html = `<p>Your FREE Wheel Service is scheduled for today at ${booking.time}.</p>`;
    try {
        await sendEmail(booking.customerEmail, 'Reminder: Your FREE Wheel Service is today!', html);
    } catch (error) {
        console.error('sendPromotionReminder failed:', error.message);
    }
};

// ========== EXPORT EVERYTHING ==========
module.exports = {
    startScheduler,
    sendSaturdayPromotionToAll,
    sendResetEmail,
    sendBookingStatusEmail,
    sendReviewStatusEmail,
    sendContactAutoReply,
    sendPromotionBookingEmail,
    sendWelcomeEmail,
    getAdminEmail,
    sendEmail,
    sendNewReviewAlert, 
    sendContactAlert,
    sendSuperAdminNotification,
    sendCustomerBookingConfirmation,
    sendBookingAlert,
    sendBookingStatusUpdate,
    sendReviewStatusUpdate,
    sendOTP,
    sendEmailChangeVerification,
    sendContactReply,
    sendPromotionReminder,
};