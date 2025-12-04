// src/components/ThankYou.jsx
import React from 'react';
import { Check, ArrowRight } from 'lucide-react';

const ThankYou = ({ orderData }) => {
  if (!orderData) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-stone-600 mb-4">No order data found</p>
          <button
            onClick={() => window.location.hash = '#'}
            className="px-6 py-3 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
          >
            Return Home
          </button>
        </div>
      </div>
    );
  }

  const { orderNumber, total, paymentMethod, items, customerName, shippingAddress } = orderData;

  return (
    <div className="min-h-screen bg-stone-50 py-16 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Success Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-600 rounded-full mb-6">
            <Check className="w-10 h-10 text-white" strokeWidth={3} />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-stone-900 mb-3">
            Order Confirmed
          </h1>
          <p className="text-lg text-stone-600">
            Thank you for your purchase, {customerName.split(' ')[0]}
          </p>
        </div>

        {/* Order Number Card */}
        <div className="bg-white rounded-lg shadow-sm border border-stone-200 p-8 mb-8">
          <div className="text-center pb-6 border-b border-stone-200">
            <p className="text-sm text-stone-500 uppercase tracking-wide mb-2">Order Number</p>
            <h2 className="text-2xl font-bold text-stone-900 mb-1">
              {orderNumber}
            </h2>
            <p className="text-sm text-stone-500">
              We'll send tracking information to your email
            </p>
          </div>

          {/* Order Summary */}
          <div className="grid grid-cols-3 gap-4 pt-6">
            <div className="text-center">
              <p className="text-sm text-stone-500 mb-1">Items</p>
              <p className="text-lg font-semibold text-stone-900">{items?.length || 0}</p>
            </div>
            <div className="text-center border-x border-stone-200">
              <p className="text-sm text-stone-500 mb-1">Payment</p>
              <p className="text-lg font-semibold text-stone-900">
                {paymentMethod === 'COD' ? 'COD' : 'Online'}
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-stone-500 mb-1">Total</p>
              <p className="text-lg font-semibold text-stone-900">₹{total?.toLocaleString()}</p>
            </div>
          </div>
        </div>

        {/* Order Details */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Order Items */}
          <div className="bg-white rounded-lg shadow-sm border border-stone-200 p-6">
            <h3 className="font-semibold text-stone-900 mb-4 pb-3 border-b border-stone-200">
              Order Items
            </h3>
            <div className="space-y-3">
              {items?.map((item, index) => (
                <div key={index} className="flex gap-3">
                  <img
                    src={item.image || '/placeholder.png'}
                    alt={item.productName}
                    className="w-14 h-14 object-cover rounded"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-stone-900 text-sm truncate">
                      {item.productName}
                    </p>
                    <p className="text-xs text-stone-500 mt-0.5">Quantity: {item.quantity}</p>
                    <p className="text-sm font-semibold text-stone-900 mt-1">
                      ₹{(item.price * item.quantity).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Shipping Address */}
          <div className="bg-white rounded-lg shadow-sm border border-stone-200 p-6">
            <h3 className="font-semibold text-stone-900 mb-4 pb-3 border-b border-stone-200">
              Delivery Address
            </h3>
            <div className="text-sm text-stone-600 leading-relaxed">
              <p className="font-semibold text-stone-900 mb-3">{customerName}</p>
              <p>
                {shippingAddress?.address1}
                {shippingAddress?.address2 && <>, {shippingAddress.address2}</>}
              </p>
              <p className="mt-1">
                {shippingAddress?.city}, {shippingAddress?.state} {shippingAddress?.pincode}
              </p>
            </div>
          </div>
        </div>

        {/* Next Steps */}
        <div className="bg-stone-900 rounded-lg p-6 mb-8 text-white">
          <h3 className="font-semibold text-lg mb-4">What's Next</h3>
          <div className="space-y-4 text-sm">
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-white text-stone-900 flex items-center justify-center text-xs font-semibold mt-0.5">
                1
              </div>
              <div>
                <p className="font-medium mb-1">Order Processing</p>
                <p className="text-stone-300 text-sm">Your order is being prepared for shipment</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-white text-stone-900 flex items-center justify-center text-xs font-semibold mt-0.5">
                2
              </div>
              <div>
                <p className="font-medium mb-1">Quality Check & Packaging</p>
                <p className="text-stone-300 text-sm">We ensure everything is perfect before shipping</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-white text-stone-900 flex items-center justify-center text-xs font-semibold mt-0.5">
                3
              </div>
              <div>
                <p className="font-medium mb-1">Delivery</p>
                <p className="text-stone-300 text-sm">Track your shipment and receive at your doorstep</p>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => window.location.hash = '#track'}
            className="flex-1 flex items-center justify-center gap-2 px-6 py-3.5 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors font-medium"
          >
            Track Order
            <ArrowRight className="w-4 h-4" />
          </button>
          <button
            onClick={() => window.location.hash = '#my-orders'}
            className="flex-1 px-6 py-3.5 bg-white text-stone-900 rounded-lg hover:bg-stone-50 transition-colors border border-stone-300 font-medium"
          >
            View All Orders
          </button>
          <button
            onClick={() => window.location.hash = '#'}
            className="flex-1 px-6 py-3.5 bg-white text-stone-900 rounded-lg hover:bg-stone-50 transition-colors border border-stone-300 font-medium"
          >
            Continue Shopping
          </button>
        </div>

        {/* Footer */}
        <div className="mt-12 pt-8 border-t border-stone-200 text-center">
          <p className="text-sm text-stone-500">
            Need help? Contact us at <a href="mailto:hello@vadiekashmir.com" className="text-amber-600 hover:underline">hello@vadiekashmir.com</a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ThankYou;
