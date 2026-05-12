
import { db } from './db';
import { Order, User } from '../types';

/**
 * Simulates a backend email service.
 */
export const sendOrderConfirmationEmail = async (order: Order): Promise<boolean> => {
  // Simulate network latency for email server
  await new Promise(resolve => setTimeout(resolve, 1000));

  const { id, totalAmount, customerEmail } = order;

  // In a real app, this would use an email provider like SendGrid or AWS SES
  const emailBody = `
    <h1>Order Confirmed</h1>
    <p>Thank you for ordering with MediGen.</p>
    <p>Order ID: <strong>${id}</strong></p>
    <p>Total Amount: <strong>₹${totalAmount}</strong></p>
    <p>Status: Placed</p>
  `;

  // Log to our local "database" so Admin can see it
  await db.saveEmail(customerEmail, `Order Confirmation - #${id}`, emailBody);

  console.group('%c📧 [Email Service Simulation] Email Sent', 'color: #0D9488; font-weight: bold; font-size: 14px;');
  console.log(`%cTo: %c${customerEmail}`, 'color: gray', 'color: #333; font-weight: bold');
  console.log(`%cSubject: %cYour Medicine Order is Confirmed – Order #${id}`, 'color: gray', 'color: #333; font-weight: bold');
  console.log(`%cAmount: %c₹${totalAmount}`, 'color: gray', 'color: #333; font-weight: bold');
  console.log('%cStatus: Sent successfully (Logged to DB)', 'color: green');
  console.groupEnd();

  return true;
};

/**
 * Simulates sending a login security alert via Email and SMS.
 */
export const sendLoginAlert = async (user: User): Promise<void> => {
  // Simulate slight delay
  await new Promise(resolve => setTimeout(resolve, 500));

  const emailSubject = `Security Alert: New Login to MediGen`;
  const emailBody = `
    <h1>New Login Detected</h1>
    <p>Hello ${user.name},</p>
    <p>We detected a new login to your MediGen account.</p>
    <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
    <p>If this wasn't you, please contact support immediately.</p>
  `;

  // 1. Simulate Email
  await db.saveEmail(user.email, emailSubject, emailBody);

  // 2. Simulate SMS (Log to Console)
  const phone = user.phone || 'Active Mobile';
  const smsContent = `MediGen Alert: Login detected for ${user.email} at ${new Date().toLocaleTimeString()}. Not you? Report now.`;

  console.group('%c🚨 [Notification Service] Security Alert Sent', 'color: #ef4444; font-weight: bold; font-size: 14px;');
  console.log(`%cType: %cEmail & SMS`, 'color: gray', 'color: #333; font-weight: bold');
  console.log(`%cTo Email: %c${user.email}`, 'color: gray', 'color: #333; font-weight: bold');
  console.log(`%cTo Phone: %c${phone}`, 'color: gray', 'color: #333; font-weight: bold');
  console.log(`%cSMS Body: %c${smsContent}`, 'color: gray', 'color: #333; font-style: italic;');
  console.groupEnd();

  // 3. Dispatch Event for UI Toast
  window.dispatchEvent(new CustomEvent('medigen-toast', { 
      detail: { 
          title: 'Security Alert Sent',
          message: `Login notification sent to ${user.email} & ${phone}.`,
          type: 'info'
      } 
  }));
};
