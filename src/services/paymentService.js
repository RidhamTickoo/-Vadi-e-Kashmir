// src/services/paymentService.js

class PaymentService {
  constructor() {
    this.razorpayKeyId = process.env.REACT_APP_RAZORPAY_KEY_ID;
  }

  // Load Razorpay script
  loadRazorpayScript() {
    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  }

  // Create Razorpay order
  async initiateRazorpayPayment(orderDetails) {
    try {
      // Load Razorpay script
      const isLoaded = await this.loadRazorpayScript();
      if (!isLoaded) {
        return {
          success: false,
          error: 'Failed to load Razorpay. Please check your internet connection.'
        };
      }

      // Razorpay options
      const options = {
        key: this.razorpayKeyId,
        amount: orderDetails.amount * 100, // Convert to paise (₹1 = 100 paise)
        currency: 'INR',
        name: 'Vadi-e-Kashmir',
        description: `Order #${orderDetails.orderNumber}`,
        image: '/logo192.png', // Your logo
        order_id: orderDetails.razorpayOrderId, // Optional: if you create order on backend
        
        // Customer details
        prefill: {
          name: orderDetails.customerName,
          email: orderDetails.customerEmail || 'customer@vadiekashmir.com',
          contact: orderDetails.customerPhone || '9999999999'
        },
        
        // Delivery address
        notes: {
          address: orderDetails.shippingAddress,
          orderNumber: orderDetails.orderNumber
        },
        
        theme: {
          color: '#B45309' // Amber color matching your brand
        },
        
        // Payment handlers
        handler: (response) => {
          // Payment successful
          console.log('Payment successful:', response);
          if (orderDetails.onSuccess) {
            orderDetails.onSuccess({
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_signature: response.razorpay_signature
            });
          }
        },
        
        modal: {
          ondismiss: () => {
            if (orderDetails.onDismiss) {
              orderDetails.onDismiss();
            }
          }
        }
      };

      // Open Razorpay checkout
      const razorpay = new window.Razorpay(options);
      
      razorpay.on('payment.failed', (response) => {
        console.error('Payment failed:', response.error);
        if (orderDetails.onFailure) {
          orderDetails.onFailure(response.error);
        }
      });

      razorpay.open();

      return {
        success: true,
        message: 'Payment initiated'
      };

    } catch (error) {
      console.error('Razorpay payment error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Process COD order
  async processCODOrder(orderDetails) {
    try {
      // For COD, we just return success
      // The order will be created with payment_method: 'COD'
      return {
        success: true,
        paymentMethod: 'COD',
        message: 'Order placed successfully. Pay on delivery.'
      };
    } catch (error) {
      console.error('COD order error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Verify payment (optional - for backend verification)
  async verifyPayment(paymentData) {
    try {
      // In production, verify payment signature on backend
      // For now, we'll just return success
      return {
        success: true,
        verified: true
      };
    } catch (error) {
      console.error('Payment verification error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Get payment methods
  getPaymentMethods() {
    return [
      {
        id: 'razorpay',
        name: 'Pay Online',
        description: 'UPI, Cards, Netbanking, Wallets',
        icon: '💳',
        fees: 0,
        enabled: true
      },
      {
        id: 'cod',
        name: 'Cash on Delivery',
        description: 'Pay when you receive',
        icon: '💵',
        fees: 50, // ₹50 extra for COD
        enabled: true
      }
    ];
  }

  // Calculate total with payment method fees
  calculateTotal(subtotal, paymentMethod) {
    const method = this.getPaymentMethods().find(m => m.id === paymentMethod);
    const fees = method?.fees || 0;
    return subtotal + fees;
  }
}

export default new PaymentService();
