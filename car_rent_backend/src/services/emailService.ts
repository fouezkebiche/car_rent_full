import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: Number(process.env.EMAIL_PORT),
  secure: false, // Use TLS
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

interface CarEmailOptions {
  to: string;
  ownerName: string;
  carDetails: string;
  status: 'approved' | 'rejected' | 'resubmitted';
  rejectionReason?: string;
  chauffeur?: boolean;
}

interface BookingEmailOptions {
  to: string;
  userName: string;
  carDetails: string;
  status: 'pending' | 'confirmed' | 'cancelled';
  pickupLocation: string;
  startDate: Date;
  rejectionReason?: string;
}

interface RegistrationPendingEmailOptions {
  to: string;
  userName: string;
}

interface OwnerApprovalEmailOptions {
  to: string;
  userName: string;
}

interface DeclineUserEmailOptions {
  to: string;
  userName: string;
}

export const sendCarStatusEmail = async ({ to, ownerName, carDetails, status, rejectionReason, chauffeur }: CarEmailOptions) => {
  let subject: string;
  let html: string;

  switch (status) {
    case 'approved':
      subject = `Your Car ${carDetails} Has Been Approved!`;
      html = `
        <h2>Hello ${ownerName},</h2>
        <p>We are pleased to inform you that your car, <strong>${carDetails}</strong>, has been approved by our admin team.</p>
        <p>It is now available for booking on our platform${chauffeur ? ' with chauffeur service' : ''}. You can view and manage your car in the Owner Panel.</p>
        <p>Thank you for listing with us!</p>
        <p>Best regards,<br>Your Car Rental Team</p>
      `;
      break;
    case 'rejected':
      subject = `Update on Your Car ${carDetails}`;
      html = `
        <h2>Hello ${ownerName},</h2>
        <p>We regret to inform you that your car, <strong>${carDetails}</strong>, has been rejected by our admin team.</p>
        ${rejectionReason ? `<p><strong>Reason:</strong> ${rejectionReason}</p>` : ''}
        <p>${rejectionReason !== 'Permanently rejected' ? 'You can edit and resubmit your car details in the Owner Panel to address the issue.' : 'This is a definitive rejection and the car cannot be resubmitted.'}</p>
        <p>Please contact us if you have any questions.</p>
        <p>Best regards,<br>Your Car Rental Team</p>
      `;
      break;
    case 'resubmitted':
      subject = `Your Car ${carDetails} Has Been Resubmitted`;
      html = `
        <h2>Hello ${ownerName},</h2>
        <p>Your car, <strong>${carDetails}</strong>, has been successfully resubmitted for admin review${chauffeur ? ' with chauffeur service' : ''}.</p>
        <p>We will notify you once the admin team reviews your updated submission.</p>
        <p>Thank you for your patience!</p>
        <p>Best regards,<br>Your Car Rental Team</p>
      `;
      break;
    default:
      throw new Error('Invalid status');
  }

  try {
    await transporter.sendMail({
      from: `"Car Rental Platform" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
    });
    console.log(`Email sent to ${to} for car ${carDetails} with status ${status}`);
  } catch (error) {
    console.error('Error sending email:', error);
    throw new Error('Failed to send email');
  }
};

export const sendBookingStatusEmail = async ({ to, userName, carDetails, status, pickupLocation, startDate, rejectionReason }: BookingEmailOptions) => {
  let subject: string;
  let html: string;

  switch (status) {
    case 'pending':
      subject = `New Booking Request for ${carDetails}`;
      html = `
        <h2>Hello ${userName},</h2>
        <p>A new booking request has been made for your car: <strong>${carDetails}</strong>.</p>
        <p><strong>Details:</strong></p>
        <ul>
          <li>Pickup Location: ${pickupLocation}</li>
          <li>Pickup Date: ${new Date(startDate).toLocaleDateString()}</li>
        </ul>
        <p>Please review the booking in your Owner Panel and approve or reject it.</p>
        <p>Best regards,<br>Your Car Rental Team</p>
      `;
      break;
    case 'confirmed':
      subject = `Your Booking for ${carDetails} Has Been Confirmed!`;
      html = `
        <h2>Hello ${userName},</h2>
        <p>We are pleased to confirm your booking for <strong>${carDetails}</strong>.</p>
        <p><strong>Details:</strong></p>
        <ul>
          <li>Pickup Location: ${pickupLocation}</li>
          <li>Pickup Date: ${new Date(startDate).toLocaleDateString()}</li>
        </ul>
        <p>Please visit our location at the specified time to collect your vehicle. If you have any questions, feel free to contact us.</p>
        <p>Thank you for choosing our service!</p>
        <p>Best regards,<br>Your Car Rental Team</p>
      `;
      break;
    case 'cancelled':
      subject = `Update on Your Booking for ${carDetails}`;
      html = `
        <h2>Hello ${userName},</h2>
        <p>We regret to inform you that your booking for <strong>${carDetails}</strong> has been cancelled.</p>
        ${rejectionReason ? `<p><strong>Reason:</strong> ${rejectionReason}</p>` : ''}
        <p>Please contact us if you have any questions or would like to make another booking.</p>
        <p>Best regards,<br>Your Car Rental Team</p>
      `;
      break;
    default:
      throw new Error('Invalid status');
  }

  try {
    await transporter.sendMail({
      from: `"Car Rental Platform" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
    });
    console.log(`Booking email sent to ${to} for ${carDetails} with status ${status}`);
  } catch (error) {
    console.error('Error sending booking email:', error);
    throw new Error('Failed to send booking email');
  }
};

export const sendRegistrationPendingEmail = async ({ to, userName }: RegistrationPendingEmailOptions) => {
  const subject = 'Your Registration is Under Review';
  const html = `
    <h2>Hello ${userName},</h2>
    <p>Thank you for registering as an owner on our Car Rental Platform.</p>
    <p>Your registration is currently under review. Our admin team will contact you as soon as possible to discuss or set up a meeting to verify your documents.</p>
    <p>You will receive another email once your account is approved.</p>
    <p>If you have any questions, please contact our support team.</p>
    <p>Best regards,<br>Your Car Rental Team</p>
  `;

  try {
    await transporter.sendMail({
      from: `"Car Rental Platform" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
    });
    console.log(`Registration pending email sent to ${to}`);
  } catch (error) {
    console.error('Error sending registration pending email:', error);
    throw new Error('Failed to send registration pending email');
  }
};

export const sendOwnerApprovalEmail = async ({ to, userName }: OwnerApprovalEmailOptions) => {
  const subject = 'Your Owner Account Has Been Approved!';
  const html = `
    <h2>Hello ${userName},</h2>
    <p>We are pleased to inform you that your owner account has been approved by our admin team.</p>
    <p>You can now log in to your account and start adding cars to our platform.</p>
    <p>Visit the Owner Panel to get started.</p>
    <p>Thank you for joining our platform!</p>
    <p>Best regards,<br>Your Car Rental Team</p>
  `;

  try {
    await transporter.sendMail({
      from: `"Car Rental Platform" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
    });
    console.log(`Owner approval email sent to ${to}`);
  } catch (error) {
    console.error('Error sending owner approval email:', error);
    throw new Error('Failed to send owner approval email');
  }
};

export const sendDeclineUserEmail = async ({ to, userName }: DeclineUserEmailOptions) => {
  const subject = 'Your Registration Has Been Declined';
  const html = `
    <h2>Hello ${userName},</h2>
    <p>We regret to inform you that your registration on our Car Rental Platform has been declined.</p>
    <p>If you believe this is an error or have any questions, please contact our support team.</p>
    <p>Thank you for your interest in our platform.</p>
    <p>Best regards,<br>Your Car Rental Platform Team</p>
  `;

  try {
    await transporter.sendMail({
      from: `"Car Rental Platform" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
    });
    console.log(`Decline email sent to ${to}`);
  } catch (error) {
    console.error('Error sending decline email:', error);
    throw new Error('Failed to send decline email');
  }
};