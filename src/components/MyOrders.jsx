// src/components/MyOrders.jsx
import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, Search } from 'lucide-react';
import toast from 'react-hot-toast';
import orderService from '../services/orderService';

const MyOrders = ({ user }) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedOrder, setExpandedOrder] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (user) {
      loadOrders();
    }
  }, [user]);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const result = await orderService.getUserOrders(user.$id || user.id);
      if (result.success) {
        // Sort by date (newest first)
        const sortedOrders = result.orders.sort((a, b) => 
          new Date(b.createdAt) - new Date(a.createdAt)
        );
        setOrders(sortedOrders);
      } else {
        toast.error('Failed to load orders');
      }
    } catch (error) {
      console.error('Load orders error:', error);
      toast.error('Error loading orders');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'confirmed':
      case 'processing':
        return 'bg-blue-50 text-blue-900 border-blue-200';
      case 'shipped':
        return 'bg-amber-50 text-amber-900 border-amber-200';
      case 'delivered':
        return 'bg-green-50 text-green-900 border-green-200';
      case 'cancelled':
        return 'bg-red-50 text-red-900 border-red-200';
      default:
        return 'bg-stone-100 text-stone-900 border-stone-200';
    }
  };

  const filteredOrders = orders.filter(order => {
    const matchesStatus = filterStatus === 'all' || order.status?.toLowerCase() === filterStatus.toLowerCase();
    const matchesSearch = !searchQuery || 
      order.orderNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.items?.some(item => item.productName?.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesStatus && matchesSearch;
  });

  if (!user) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center py-12 px-4">
        <div className="text-center max-w-md">
          <h2 className="text-2xl font-bold text-stone-900 mb-3">Login Required</h2>
          <p className="text-stone-600 mb-6">
            Please login to view your orders
          </p>
          <button
            onClick={() => window.location.hash = '#login'}
            className="px-6 py-3 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors font-medium"
          >
            Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50 py-12 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-stone-900 mb-2">Orders</h1>
          <p className="text-stone-600">View and track your order history</p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg border border-stone-200 p-5 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-stone-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search orders..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 border border-stone-300 rounded-lg focus:ring-1 focus:ring-amber-500 focus:border-amber-500 outline-none text-sm"
              />
            </div>

            {/* Status Filter */}
            <div className="flex gap-2 flex-wrap">
              {['all', 'processing', 'shipped', 'delivered', 'cancelled'].map((status) => (
                <button
                  key={status}
                  onClick={() => setFilterStatus(status)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    filterStatus === status
                      ? 'bg-stone-900 text-white'
                      : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                  }`}
                >
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Orders List */}
        {loading ? (
          <div className="text-center py-20">
            <div className="inline-block animate-spin rounded-full h-10 w-10 border-2 border-stone-200 border-t-amber-600"></div>
            <p className="text-stone-600 mt-4 text-sm">Loading orders...</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="bg-white rounded-lg border border-stone-200 p-12 text-center">
            <h3 className="text-xl font-semibold text-stone-900 mb-2">No Orders Found</h3>
            <p className="text-stone-600 mb-6 text-sm">
              {searchQuery || filterStatus !== 'all' 
                ? 'Try adjusting your filters' 
                : "You haven't placed any orders yet"}
            </p>
            <button
              onClick={() => window.location.hash = '#shop'}
              className="px-6 py-3 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors font-medium"
            >
              Browse Products
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredOrders.map((order) => (
              <div key={order.$id} className="bg-white rounded-lg border border-stone-200 overflow-hidden">
                {/* Order Header */}
                <div 
                  className="p-5 cursor-pointer hover:bg-stone-50 transition-colors"
                  onClick={() => setExpandedOrder(expandedOrder === order.$id ? null : order.$id)}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2 flex-wrap">
                        <h3 className="font-semibold text-stone-900 text-sm">
                          {order.orderNumber}
                        </h3>
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(order.status)}`}>
                          {order.status || 'Processing'}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-stone-500">
                        <span>
                          {new Date(order.createdAt).toLocaleDateString('en-IN', { 
                            day: 'numeric', 
                            month: 'short', 
                            year: 'numeric' 
                          })}
                        </span>
                        <span>
                          {order.items?.length || 0} {order.items?.length === 1 ? 'item' : 'items'}
                        </span>
                        <span>
                          {order.paymentMethod === 'COD' ? 'COD' : 'Prepaid'}
                        </span>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-lg font-semibold text-stone-900">₹{order.total?.toLocaleString()}</p>
                      <button className="text-stone-400 hover:text-stone-600 mt-1">
                        {expandedOrder === order.$id ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Expanded Details */}
                {expandedOrder === order.$id && (
                  <div className="border-t border-stone-200 p-5 bg-stone-50">
                    <div className="grid md:grid-cols-2 gap-5 mb-5">
                      {/* Items */}
                      <div>
                        <h4 className="font-semibold text-stone-900 text-sm mb-3">Items</h4>
                        <div className="space-y-2">
                          {order.items?.map((item, index) => (
                            <div key={index} className="flex gap-3 p-3 bg-white rounded-lg border border-stone-200">
                              <img
                                src={item.image || '/placeholder.png'}
                                alt={item.productName}
                                className="w-12 h-12 object-cover rounded"
                              />
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-stone-900 text-sm truncate">
                                  {item.productName}
                                </p>
                                <p className="text-xs text-stone-500 mt-0.5">Qty: {item.quantity}</p>
                                <p className="text-sm font-semibold text-stone-900 mt-1">
                                  ₹{(item.price * item.quantity).toLocaleString()}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Shipping Address */}
                      <div>
                        <h4 className="font-semibold text-stone-900 text-sm mb-3">Delivery Address</h4>
                        <div className="bg-white rounded-lg border border-stone-200 p-4">
                          <p className="font-semibold text-stone-900 text-sm mb-2">{order.customerName}</p>
                          <p className="text-stone-600 text-xs leading-relaxed">
                            {order.shippingAddress?.address1}
                            {order.shippingAddress?.address2 && <>, {order.shippingAddress.address2}</>}
                            <br />
                            {order.shippingAddress?.city}, {order.shippingAddress?.state} {order.shippingAddress?.pincode}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3">
                      <button
                        onClick={() => {
                          window.location.hash = '#track';
                          localStorage.setItem('trackOrderNumber', order.orderNumber);
                        }}
                        className="flex-1 px-4 py-2.5 bg-stone-900 text-white rounded-lg hover:bg-stone-800 transition-colors font-medium text-sm"
                      >
                        Track Order
                      </button>
                      {order.status?.toLowerCase() === 'delivered' && (
                        <button
                          className="flex-1 px-4 py-2.5 bg-white text-stone-900 border border-stone-300 rounded-lg hover:bg-stone-50 transition-colors font-medium text-sm"
                        >
                          Reorder
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyOrders;
