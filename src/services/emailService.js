// src/services/emailService.js
// Service to send emails via Appwrite Functions

import { functions } from '../config/appwrite';

// Get the function ID from environment or use a default
const EMAIL_FUNCTION_ID = process.env.REACT_APP_EMAIL_FUNCTION_ID || 'send-email';

class EmailService {
  // Send order confirmation email to customer
  async sendOrderConfirmation(orderData) {
    try {
      const execution = await functions.createExecution(
        EMAIL_FUNCTION_ID,
        JSON.stringify({
          type: 'order_confirmation',
          orderData: orderData
        }),
        false // async execution
      );

      console.log('📧 Order confirmation email triggered');
      return { success: true, executionId: execution.$id };
    } catch (error) {
      console.error('❌ Email error:', error);
      return { success: false, error: error.message };
    }
  }

  // Send order status update email
  async sendStatusUpdate(orderData) {
    try {
      const execution = await functions.createExecution(
        EMAIL_FUNCTION_ID,
        JSON.stringify({
          type: 'status_update',
          orderData: orderData
        }),
        false
      );

      console.log('📧 Status update email triggered');
      return { success: true, executionId: execution.$id };
    } catch (error) {
      console.error('❌ Email error:', error);
      return { success: false, error: error.message };
    }
  }

  // Notify admin about new order
  async notifyAdmin(orderData) {
    try {
      const execution = await functions.createExecution(
        EMAIL_FUNCTION_ID,
        JSON.stringify({
          type: 'admin_notification',
          orderData: orderData
        }),
        false
      );

      console.log('📧 Admin notification triggered');
      return { success: true, executionId: execution.$id };
    } catch (error) {
      console.error('❌ Admin notification error:', error);
      return { success: false, error: error.message };
    }
  }

  // Send all emails for a new order (customer + admin)
  async sendNewOrderEmails(orderData) {
    const results = await Promise.all([
      this.sendOrderConfirmation(orderData),
      this.notifyAdmin(orderData)
    ]);

    return {
      customerEmail: results[0],
      adminEmail: results[1]
    };
  }
}

const emailService = new EmailService();
export default emailService;
