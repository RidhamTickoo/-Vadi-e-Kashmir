// src/components/ProductDetail.jsx
import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { Star, ShoppingCart, Heart, Share2, Truck, ShieldCheck, ArrowLeft, Plus, Minus, Check, X, Facebook, Twitter, Mail, Link as LinkIcon } from 'lucide-react';
import toast from 'react-hot-toast';
import productService from '../services/productService';
import orderService from '../services/orderService';

const ProductDetail = ({ productSlug, onClose, onAddToCart }) => {
  const [product, setProduct] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [userRating, setUserRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [showCheckout, setShowCheckout] = useState(false);
  const [checkoutForm, setCheckoutForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address1: '',
    address2: '',
    city: '',
    pincode: '',
    state: ''
  });
  const [placingOrder, setPlacingOrder] = useState(false);

  // Get slug from URL hash if not provided as prop
  const slug = productSlug || window.location.hash.replace('#product/', '');

  useEffect(() => {
    if (slug) {
      loadProduct();
      checkWishlist();
    }
  }, [slug]);

  const checkWishlist = () => {
    const wishlist = JSON.parse(localStorage.getItem('wishlist') || '[]');
    setIsWishlisted(wishlist.some(item => item.slug === slug));
  };

  const loadProduct = async () => {
    setLoading(true);
    const result = await productService.getProductBySlug(slug);
    if (result.success) {
      setProduct(result.product);
      // Load reviews
      const reviewsResult = await productService.getProductReviews(result.product.$id);
      if (reviewsResult.success) {
        setReviews(reviewsResult.reviews);
      }
    }
    setLoading(false);
  };

  const handleAddToCart = () => {
    if (product && onAddToCart) {
      onAddToCart({ ...product, quantity });
      toast.success(`${product.name} added to cart!`);
    }
  };

  const handleBuyNow = () => {
    if (product) {
      onAddToCart({ ...product, quantity });
      setShowCheckout(true);
    }
  };

  const toggleWishlist = () => {
    const wishlist = JSON.parse(localStorage.getItem('wishlist') || '[]');
    
    if (isWishlisted) {
      const newWishlist = wishlist.filter(item => item.slug !== slug);
      localStorage.setItem('wishlist', JSON.stringify(newWishlist));
      setIsWishlisted(false);
      toast.success('Removed from wishlist');
    } else {
      wishlist.push({
        id: product.$id,
        slug: product.slug,
        name: product.name,
        price: product.price,
        image: product.images?.[0] || '',
        addedAt: new Date().toISOString()
      });
      localStorage.setItem('wishlist', JSON.stringify(wishlist));
      setIsWishlisted(true);
      toast.success('Added to wishlist ❤️');
    }
  };

  const handleShare = (platform) => {
    const url = window.location.href;
    const text = `Check out ${product.name} on Vadi-e-Kashmir`;
    
    const shareUrls = {
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
      twitter: `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`,
      whatsapp: `https://wa.me/?text=${encodeURIComponent(text + ' ' + url)}`,
      email: `mailto:?subject=${encodeURIComponent(text)}&body=${encodeURIComponent(url)}`
    };

    if (platform === 'copy') {
      navigator.clipboard.writeText(url);
      toast.success('Link copied to clipboard!');
      setShowShareMenu(false);
      return;
    }

    if (platform === 'native' && navigator.share) {
      navigator.share({
        title: product.name,
        text: text,
        url: url
      }).catch(() => {});
      return;
    }

    if (shareUrls[platform]) {
      window.open(shareUrls[platform], '_blank', 'width=600,height=400');
      setShowShareMenu(false);
    }
  };

  const submitReview = async () => {
    if (userRating === 0) {
      toast.error('Please select a rating');
      return;
    }
    if (!reviewText.trim()) {
      toast.error('Please write a review');
      return;
    }

    // Here you would normally save to database
    const newReview = {
      userName: 'Guest User', // Replace with actual user name
      rating: userRating,
      comment: reviewText,
      createdAt: new Date().toISOString()
    };

    setReviews([newReview, ...reviews]);
    setUserRating(0);
    setReviewText('');
    setShowReviewForm(false);
    toast.success('Review submitted successfully!');
  };

  const handlePlaceOrder = async () => {
    // Validate form
    if (!checkoutForm.firstName || !checkoutForm.lastName) {
      toast.error('Please enter your full name');
      return;
    }
    if (!checkoutForm.email || !checkoutForm.email.includes('@')) {
      toast.error('Please enter a valid email address');
      return;
    }
    if (!checkoutForm.phone || checkoutForm.phone.length < 10) {
      toast.error('Please enter a valid phone number');
      return;
    }
    if (!checkoutForm.address1) {
      toast.error('Please enter your address');
      return;
    }
    if (!checkoutForm.city || !checkoutForm.pincode || !checkoutForm.state) {
      toast.error('Please complete your address details');
      return;
    }

    setPlacingOrder(true);

    try {
      const orderData = {
        customerName: `${checkoutForm.firstName} ${checkoutForm.lastName}`,
        email: checkoutForm.email,
        phone: checkoutForm.phone,
        items: [{
          productId: product.$id,
          productName: product.name,
          price: product.price,
          quantity: quantity,
          image: product.images?.[0] || ''
        }],
        shippingAddress: {
          address1: checkoutForm.address1,
          address2: checkoutForm.address2,
          city: checkoutForm.city,
          state: checkoutForm.state,
          pincode: checkoutForm.pincode
        },
        subtotal: product.price * quantity,
        gst: Math.round(product.price * quantity * 0.05),
        total: Math.round(product.price * quantity * 1.05),
        paymentMethod: 'cod',
        userId: 'guest', // Can be updated if user is logged in
        createdAt: new Date().toISOString()
      };

      const result = await orderService.createOrder(orderData);

      if (result.success) {
        // Send order confirmation email
        await orderService.sendOrderConfirmationEmail({
          ...orderData,
          orderNumber: result.order.orderNumber
        });

        toast.success(`Order placed successfully! 🎉\nOrder ID: ${result.order.orderNumber}\nConfirmation email sent to ${checkoutForm.email}`);
        
        // Reset form
        setCheckoutForm({
          firstName: '',
          lastName: '',
          email: '',
          phone: '',
          address1: '',
          address2: '',
          city: '',
          pincode: '',
          state: ''
        });
        setShowCheckout(false);
        
        // Navigate to home or show success message
        setTimeout(() => {
          window.location.hash = '#home';
        }, 2000);
      } else {
        toast.error('Failed to place order. Please try again.');
      }
    } catch (error) {
      console.error('Order placement error:', error);
      toast.error('An error occurred while placing the order');
    } finally {
      setPlacingOrder(false);
    }
  };

  const handleFormChange = (field, value) => {
    setCheckoutForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-white z-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mb-4"></div>
          <p className="text-stone-600">Loading product...</p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl text-stone-600 mb-4">Product not found</p>
          <button 
            onClick={() => window.location.hash = '#shop'} 
            className="px-6 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700"
          >
            Back to Shop
          </button>
        </div>
      </div>
    );
  }

  const productImages = product.images || [];
  const discount = product.originalPrice 
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  return (
    <>
      <Helmet>
        <title>{product.metaTitle || product.name} | Vadi Kashmir</title>
        <meta name="description" content={product.metaDescription || product.shortDescription || product.description} />
        <meta name="keywords" content={product.metaKeywords || product.tags?.join(', ') || ''} />
        
        {/* Open Graph */}
        <meta property="og:title" content={product.name} />
        <meta property="og:description" content={product.shortDescription || product.description} />
        <meta property="og:image" content={productImages[0] || ''} />
        <meta property="og:type" content="product" />
        <meta property="og:price:amount" content={product.price} />
        <meta property="og:price:currency" content="INR" />
        
        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={product.name} />
        <meta name="twitter:description" content={product.shortDescription || product.description} />
        <meta name="twitter:image" content={productImages[0] || ''} />
        
        {/* JSON-LD Structured Data */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org/",
            "@type": "Product",
            "name": product.name,
            "image": productImages,
            "description": product.description,
            "sku": product.sku,
            "brand": {
              "@type": "Brand",
              "name": "Vadi Kashmir"
            },
            "offers": {
              "@type": "Offer",
              "url": window.location.href,
              "priceCurrency": "INR",
              "price": product.price,
              "availability": product.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock"
            },
            "aggregateRating": product.reviewCount > 0 ? {
              "@type": "AggregateRating",
              "ratingValue": product.rating,
              "reviewCount": product.reviewCount
            } : undefined
          })}
        </script>
      </Helmet>

      <div className="min-h-screen bg-white">
        <div className="max-w-7xl mx-auto px-4 py-6">
          {/* Back Button */}
          <button 
            onClick={() => window.location.hash = '#shop'}
            className="flex items-center gap-2 text-stone-600 hover:text-amber-600 transition-colors mb-6"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Shop
          </button>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
            {/* Image Gallery */}
            <div className="space-y-4">
              <div className="aspect-square rounded-2xl overflow-hidden bg-stone-100">
                {productImages.length > 0 ? (
                  <img 
                    src={productImages[selectedImage]} 
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <ShoppingCart className="w-24 h-24 text-stone-300" />
                  </div>
                )}
              </div>
              
              {productImages.length > 1 && (
                <div className="grid grid-cols-4 gap-4">
                  {productImages.map((img, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedImage(index)}
                      className={`aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                        selectedImage === index 
                          ? 'border-amber-600 scale-105' 
                          : 'border-stone-200 hover:border-amber-300'
                      }`}
                    >
                      <img src={img} alt={`${product.name} ${index + 1}`} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Product Info */}
            <div className="space-y-6">
              <div>
                <h1 className="text-3xl md:text-4xl font-serif font-bold text-stone-800 mb-2">
                  {product.name}
                </h1>
                
                {/* Rating */}
                {product.reviewCount > 0 && (
                  <div className="flex items-center gap-2 mb-4">
                    <div className="flex items-center">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-5 h-5 ${
                            i < Math.floor(product.rating)
                              ? 'fill-amber-400 text-amber-400'
                              : 'text-stone-300'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-stone-600">
                      {product.rating.toFixed(1)} ({product.reviewCount} reviews)
                    </span>
                  </div>
                )}

                {/* Price */}
                <div className="flex items-center gap-4 mb-6">
                  <span className="text-4xl font-bold text-amber-600">
                    ₹{product.price.toLocaleString()}
                  </span>
                  {product.originalPrice && (
                    <>
                      <span className="text-2xl text-stone-400 line-through">
                        ₹{product.originalPrice.toLocaleString()}
                      </span>
                      <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                        {discount}% OFF
                      </span>
                    </>
                  )}
                </div>
              </div>

              {/* Short Description */}
              {product.shortDescription && (
                <p className="text-lg text-stone-600 leading-relaxed">
                  {product.shortDescription}
                </p>
              )}

              {/* Stock Status */}
              <div className="flex items-center gap-2">
                {product.stock > 0 ? (
                  <>
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span className="text-green-700 font-medium">In Stock ({product.stock} available)</span>
                  </>
                ) : (
                  <>
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                    <span className="text-red-700 font-medium">Out of Stock</span>
                  </>
                )}
              </div>

              {/* Quantity Selector */}
              <div className="flex items-center gap-4">
                <span className="text-stone-700 font-medium">Quantity:</span>
                <div className="flex items-center border border-stone-300 rounded-lg">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="p-3 hover:bg-stone-100 transition-colors"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="px-6 font-medium">{quantity}</span>
                  <button
                    onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                    className="p-3 hover:bg-stone-100 transition-colors"
                    disabled={quantity >= product.stock}
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-4">
                <div className="flex gap-4">
                  <button
                    onClick={handleAddToCart}
                    disabled={product.stock === 0}
                    className="flex-1 px-8 py-4 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-medium"
                  >
                    <ShoppingCart className="w-5 h-5" />
                    Add to Cart
                  </button>
                  
                  <button 
                    onClick={toggleWishlist}
                    className={`p-4 border-2 rounded-lg transition-all ${
                      isWishlisted 
                        ? 'border-red-500 text-red-500 bg-red-50' 
                        : 'border-stone-300 hover:border-red-500 hover:text-red-500'
                    }`}
                    title={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
                  >
                    <Heart className={`w-6 h-6 ${isWishlisted ? 'fill-red-500' : ''}`} />
                  </button>
                  
                  <div className="relative">
                    <button 
                      onClick={() => setShowShareMenu(!showShareMenu)}
                      className="p-4 border-2 border-stone-300 rounded-lg hover:border-amber-600 hover:text-amber-600 transition-colors"
                      title="Share product"
                    >
                      <Share2 className="w-6 h-6" />
                    </button>
                    
                    {showShareMenu && (
                      <>
                        <div 
                          className="fixed inset-0 z-40" 
                          onClick={() => setShowShareMenu(false)}
                        ></div>
                        <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-2xl border border-stone-200 py-2 z-50">
                          <p className="px-4 py-2 text-sm font-medium text-stone-700 border-b border-stone-200">
                            Share this product
                          </p>
                          
                          {navigator.share && (
                            <button
                              onClick={() => handleShare('native')}
                              className="w-full px-4 py-3 hover:bg-stone-50 transition-colors flex items-center gap-3 text-left"
                            >
                              <Share2 className="w-5 h-5 text-amber-600" />
                              <span className="text-stone-700">Share via...</span>
                            </button>
                          )}
                          
                          <button
                            onClick={() => handleShare('facebook')}
                            className="w-full px-4 py-3 hover:bg-stone-50 transition-colors flex items-center gap-3 text-left"
                          >
                            <Facebook className="w-5 h-5 text-blue-600" />
                            <span className="text-stone-700">Facebook</span>
                          </button>
                          
                          <button
                            onClick={() => handleShare('twitter')}
                            className="w-full px-4 py-3 hover:bg-stone-50 transition-colors flex items-center gap-3 text-left"
                          >
                            <Twitter className="w-5 h-5 text-sky-500" />
                            <span className="text-stone-700">Twitter</span>
                          </button>
                          
                          <button
                            onClick={() => handleShare('whatsapp')}
                            className="w-full px-4 py-3 hover:bg-stone-50 transition-colors flex items-center gap-3 text-left"
                          >
                            <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.890-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                            </svg>
                            <span className="text-stone-700">WhatsApp</span>
                          </button>
                          
                          <button
                            onClick={() => handleShare('email')}
                            className="w-full px-4 py-3 hover:bg-stone-50 transition-colors flex items-center gap-3 text-left"
                          >
                            <Mail className="w-5 h-5 text-stone-600" />
                            <span className="text-stone-700">Email</span>
                          </button>
                          
                          <button
                            onClick={() => handleShare('copy')}
                            className="w-full px-4 py-3 hover:bg-stone-50 transition-colors flex items-center gap-3 text-left border-t border-stone-200"
                          >
                            <LinkIcon className="w-5 h-5 text-amber-600" />
                            <span className="text-stone-700">Copy Link</span>
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
                
                <button
                  onClick={handleBuyNow}
                  disabled={product.stock === 0}
                  className="w-full px-8 py-4 bg-stone-800 text-white rounded-lg hover:bg-stone-900 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-medium"
                >
                  Buy Now
                </button>
              </div>

              {/* Trust Badges */}
              <div className="grid grid-cols-2 gap-4 pt-6 border-t border-stone-200">
                <div className="flex items-center gap-3">
                  <Truck className="w-6 h-6 text-amber-600" />
                  <div>
                    <p className="font-medium text-stone-800">Free Delivery</p>
                    <p className="text-sm text-stone-600">On orders above ₹500</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <ShieldCheck className="w-6 h-6 text-amber-600" />
                  <div>
                    <p className="font-medium text-stone-800">Authentic Products</p>
                    <p className="text-sm text-stone-600">100% Genuine</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Product Description */}
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-stone-800 mb-4">Product Description</h2>
            <div className="prose max-w-none text-stone-600 leading-relaxed">
              {product.description}
            </div>
          </div>

          {/* Reviews Section */}
          <div className="mb-12">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-stone-800">Customer Reviews</h2>
              <button 
                onClick={() => setShowReviewForm(!showReviewForm)}
                className="px-6 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
              >
                {showReviewForm ? 'Cancel' : 'Write a Review'}
              </button>
            </div>

            {/* Review Form */}
            {showReviewForm && (
              <div className="bg-white border-2 border-amber-200 rounded-xl p-6 mb-6">
                <h3 className="text-lg font-bold text-stone-800 mb-4">Write Your Review</h3>
                
                <div className="mb-4">
                  <label className="block text-stone-700 font-medium mb-2">Your Rating</label>
                  <div className="flex items-center gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        onClick={() => setUserRating(star)}
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(0)}
                        className="transition-transform hover:scale-110"
                      >
                        <Star
                          className={`w-8 h-8 ${
                            star <= (hoverRating || userRating)
                              ? 'fill-amber-400 text-amber-400'
                              : 'text-stone-300'
                          }`}
                        />
                      </button>
                    ))}
                    {userRating > 0 && (
                      <span className="ml-2 text-stone-600 font-medium">
                        {userRating} {userRating === 1 ? 'star' : 'stars'}
                      </span>
                    )}
                  </div>
                </div>

                <div className="mb-4">
                  <label className="block text-stone-700 font-medium mb-2">Your Review</label>
                  <textarea
                    value={reviewText}
                    onChange={(e) => setReviewText(e.target.value)}
                    placeholder="Share your experience with this product..."
                    rows="4"
                    className="w-full px-4 py-3 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none"
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={submitReview}
                    className="px-6 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors font-medium"
                  >
                    Submit Review
                  </button>
                  <button
                    onClick={() => {
                      setShowReviewForm(false);
                      setUserRating(0);
                      setReviewText('');
                    }}
                    className="px-6 py-2 border border-stone-300 text-stone-700 rounded-lg hover:bg-stone-50 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Reviews List */}
            {reviews.length > 0 ? (
              <div className="space-y-6">
                {reviews.map((review, index) => (
                  <div key={index} className="bg-stone-50 rounded-xl p-6">
                    <div className="flex items-center gap-4 mb-3">
                      <div className="w-12 h-12 bg-amber-200 rounded-full flex items-center justify-center">
                        <span className="text-amber-800 font-bold text-lg">{review.userName.charAt(0).toUpperCase()}</span>
                      </div>
                      <div>
                        <p className="font-medium text-stone-800">{review.userName}</p>
                        <div className="flex items-center gap-2">
                          <div className="flex">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`w-4 h-4 ${
                                  i < review.rating ? 'fill-amber-400 text-amber-400' : 'text-stone-300'
                                }`}
                              />
                            ))}
                          </div>
                          {review.createdAt && (
                            <span className="text-sm text-stone-500">
                              {new Date(review.createdAt).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <p className="text-stone-600 leading-relaxed">{review.comment}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-stone-50 rounded-xl">
                <Star className="w-12 h-12 text-stone-300 mx-auto mb-3" />
                <p className="text-stone-600 font-medium mb-2">No reviews yet</p>
                <p className="text-stone-500 text-sm">Be the first to review this product!</p>
              </div>
            )}
          </div>
        </div>

        {/* Checkout Modal */}
        {showCheckout && product && (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-stone-200 p-6 flex items-center justify-between">
                <h2 className="text-2xl font-bold text-stone-800">Checkout</h2>
                <button
                  onClick={() => setShowCheckout(false)}
                  className="p-2 hover:bg-stone-100 rounded-lg transition-colors"
                >
                  <X className="w-6 h-6 text-stone-600" />
                </button>
              </div>

              <div className="p-6">
                {/* Order Summary */}
                <div className="mb-6 pb-6 border-b border-stone-200">
                  <h3 className="font-bold text-lg text-stone-800 mb-4">Order Summary</h3>
                  <div className="flex gap-4 bg-stone-50 rounded-xl p-4">
                    <img 
                      src={product.images?.[0]} 
                      alt={product.name}
                      className="w-20 h-20 object-cover rounded-lg"
                    />
                    <div className="flex-1">
                      <h4 className="font-medium text-stone-800">{product.name}</h4>
                      <p className="text-stone-600 text-sm">{product.category}</p>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-stone-600">Quantity: {quantity}</span>
                        <span className="font-bold text-amber-600">₹{(product.price * quantity).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 space-y-2">
                    <div className="flex justify-between text-stone-600">
                      <span>Subtotal</span>
                      <span>₹{(product.price * quantity).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-stone-600">
                      <span>Shipping</span>
                      <span>Free</span>
                    </div>
                    <div className="flex justify-between text-stone-600">
                      <span>GST (5%)</span>
                      <span>₹{Math.round(product.price * quantity * 0.05).toLocaleString()}</span>
                    </div>
                    <div className="h-px bg-stone-200 my-2"></div>
                    <div className="flex justify-between font-bold text-lg text-stone-800">
                      <span>Total</span>
                      <span className="text-amber-600">₹{Math.round(product.price * quantity * 1.05).toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                {/* Shipping Address */}
                <div className="mb-6">
                  <h3 className="font-bold text-lg text-stone-800 mb-4">Shipping Address</h3>
                  <form className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-stone-700 font-medium mb-2 text-sm">First Name *</label>
                        <input
                          type="text"
                          placeholder="John"
                          value={checkoutForm.firstName}
                          onChange={(e) => handleFormChange('firstName', e.target.value)}
                          className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-stone-700 font-medium mb-2 text-sm">Last Name *</label>
                        <input
                          type="text"
                          placeholder="Doe"
                          value={checkoutForm.lastName}
                          onChange={(e) => handleFormChange('lastName', e.target.value)}
                          className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-stone-700 font-medium mb-2 text-sm">Email Address *</label>
                      <input
                        type="email"
                        placeholder="john.doe@example.com"
                        value={checkoutForm.email}
                        onChange={(e) => handleFormChange('email', e.target.value)}
                        className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none"
                        required
                      />
                      <p className="text-xs text-stone-500 mt-1">Order confirmation will be sent to this email</p>
                    </div>

                    <div>
                      <label className="block text-stone-700 font-medium mb-2 text-sm">Phone Number *</label>
                      <input
                        type="tel"
                        placeholder="+91 98765 43210"
                        value={checkoutForm.phone}
                        onChange={(e) => handleFormChange('phone', e.target.value)}
                        className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-stone-700 font-medium mb-2 text-sm">Address Line 1 *</label>
                      <input
                        type="text"
                        placeholder="House No., Street Name"
                        value={checkoutForm.address1}
                        onChange={(e) => handleFormChange('address1', e.target.value)}
                        className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-stone-700 font-medium mb-2 text-sm">Address Line 2 (Optional)</label>
                      <input
                        type="text"
                        placeholder="Area, Landmark"
                        value={checkoutForm.address2}
                        onChange={(e) => handleFormChange('address2', e.target.value)}
                        className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-stone-700 font-medium mb-2 text-sm">City *</label>
                        <input
                          type="text"
                          placeholder="Srinagar"
                          value={checkoutForm.city}
                          onChange={(e) => handleFormChange('city', e.target.value)}
                          className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-stone-700 font-medium mb-2 text-sm">Pincode *</label>
                        <input
                          type="text"
                          placeholder="190001"
                          value={checkoutForm.pincode}
                          onChange={(e) => handleFormChange('pincode', e.target.value)}
                          className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-stone-700 font-medium mb-2 text-sm">State / UT *</label>
                      <select 
                        value={checkoutForm.state}
                        onChange={(e) => handleFormChange('state', e.target.value)}
                        className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none"
                        required
                      >
                        <option value="">Select State / Union Territory</option>
                        <optgroup label="States">
                          <option value="AP">Andhra Pradesh</option>
                          <option value="AR">Arunachal Pradesh</option>
                          <option value="AS">Assam</option>
                          <option value="BR">Bihar</option>
                          <option value="CT">Chhattisgarh</option>
                          <option value="GA">Goa</option>
                          <option value="GJ">Gujarat</option>
                          <option value="HR">Haryana</option>
                          <option value="HP">Himachal Pradesh</option>
                          <option value="JH">Jharkhand</option>
                          <option value="KA">Karnataka</option>
                          <option value="KL">Kerala</option>
                          <option value="MP">Madhya Pradesh</option>
                          <option value="MH">Maharashtra</option>
                          <option value="MN">Manipur</option>
                          <option value="ML">Meghalaya</option>
                          <option value="MZ">Mizoram</option>
                          <option value="NL">Nagaland</option>
                          <option value="OR">Odisha</option>
                          <option value="PB">Punjab</option>
                          <option value="RJ">Rajasthan</option>
                          <option value="SK">Sikkim</option>
                          <option value="TN">Tamil Nadu</option>
                          <option value="TG">Telangana</option>
                          <option value="TR">Tripura</option>
                          <option value="UP">Uttar Pradesh</option>
                          <option value="UT">Uttarakhand</option>
                          <option value="WB">West Bengal</option>
                        </optgroup>
                        <optgroup label="Union Territories">
                          <option value="AN">Andaman and Nicobar Islands</option>
                          <option value="CH">Chandigarh</option>
                          <option value="DN">Dadra and Nagar Haveli and Daman and Diu</option>
                          <option value="DL">Delhi</option>
                          <option value="JK">Jammu and Kashmir</option>
                          <option value="LA">Ladakh</option>
                          <option value="LD">Lakshadweep</option>
                          <option value="PY">Puducherry</option>
                        </optgroup>
                      </select>
                    </div>
                  </form>
                </div>

                {/* Payment Method */}
                <div className="mb-6">
                  <h3 className="font-bold text-lg text-stone-800 mb-4">Payment Method</h3>
                  <div className="space-y-3">
                    <label className="flex items-center gap-3 p-4 border-2 border-stone-200 rounded-lg cursor-pointer hover:border-amber-500 transition-colors">
                      <input type="radio" name="payment" className="w-4 h-4 text-amber-600" defaultChecked />
                      <div>
                        <p className="font-medium text-stone-800">Cash on Delivery</p>
                        <p className="text-sm text-stone-600">Pay when you receive the product</p>
                      </div>
                    </label>

                    <label className="flex items-center gap-3 p-4 border-2 border-stone-200 rounded-lg cursor-pointer hover:border-amber-500 transition-colors opacity-50">
                      <input type="radio" name="payment" className="w-4 h-4 text-amber-600" disabled />
                      <div>
                        <p className="font-medium text-stone-800">Online Payment</p>
                        <p className="text-sm text-stone-600">UPI, Cards, Net Banking (Coming Soon)</p>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Place Order Button */}
                <div className="flex gap-3">
                  <button
                    onClick={handlePlaceOrder}
                    disabled={placingOrder}
                    className="flex-1 bg-amber-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-amber-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {placingOrder ? (
                      <>
                        <div className="inline-block animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        Placing Order...
                      </>
                    ) : (
                      'Place Order'
                    )}
                  </button>
                  <button
                    onClick={() => setShowCheckout(false)}
                    disabled={placingOrder}
                    className="px-6 py-4 border-2 border-stone-300 text-stone-700 rounded-xl font-medium hover:bg-stone-50 transition-colors disabled:opacity-50"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default ProductDetail;
