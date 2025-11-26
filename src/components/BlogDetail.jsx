// src/components/BlogDetail.jsx
import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { ArrowLeft, Calendar, User, Eye, Share2, Facebook, Twitter, Heart } from 'lucide-react';
import blogService from '../services/blogService';

const BlogDetail = ({ blogSlug, onClose }) => {
  const [blog, setBlog] = useState(null);
  const [loading, setLoading] = useState(true);

  // Get slug from URL hash if not provided as prop
  const slug = blogSlug || window.location.hash.replace('#blog/', '');

  useEffect(() => {
    if (slug) {
      loadBlog();
    }
  }, [slug]);

  const loadBlog = async () => {
    setLoading(true);
    const result = await blogService.getBlogBySlug(slug);
    if (result.success) {
      setBlog(result.blog);
      // Increment views
      await blogService.incrementViews(result.blog.$id);
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-white z-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mb-4"></div>
          <p className="text-stone-600">Loading article...</p>
        </div>
      </div>
    );
  }

  if (!blog) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl text-stone-600 mb-4">Article not found</p>
          <button 
            onClick={() => window.location.hash = '#blogs'} 
            className="px-6 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700"
          >
            Back to Blog
          </button>
        </div>
      </div>
    );
  }

  const shareUrl = window.location.href;

  return (
    <>
      <Helmet>
        <title>{blog.metaTitle || blog.title} | Vadi Kashmir Blog</title>
        <meta name="description" content={blog.metaDescription || blog.excerpt || blog.content.substring(0, 160)} />
        
        {/* Open Graph */}
        <meta property="og:title" content={blog.title} />
        <meta property="og:description" content={blog.excerpt || blog.content.substring(0, 160)} />
        <meta property="og:image" content={blog.featuredImage || ''} />
        <meta property="og:type" content="article" />
        <meta property="article:published_time" content={blog.$createdAt} />
        <meta property="article:author" content={blog.author} />
        
        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={blog.title} />
        <meta name="twitter:description" content={blog.excerpt || blog.content.substring(0, 160)} />
        <meta name="twitter:image" content={blog.featuredImage || ''} />
        
        {/* JSON-LD Structured Data */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BlogPosting",
            "headline": blog.title,
            "image": blog.featuredImage,
            "author": {
              "@type": "Person",
              "name": blog.author
            },
            "publisher": {
              "@type": "Organization",
              "name": "Vadi Kashmir",
              "logo": {
                "@type": "ImageObject",
                "url": "https://vadikashmir.com/logo.png"
              }
            },
            "datePublished": blog.$createdAt,
            "description": blog.excerpt || blog.content.substring(0, 160)
          })}
        </script>
      </Helmet>

      <div className="min-h-screen bg-white">
        <div className="max-w-4xl mx-auto px-4 py-6">
          {/* Back Button */}
          <button 
            onClick={() => window.location.hash = '#blogs'}
            className="flex items-center gap-2 text-stone-600 hover:text-amber-600 transition-colors mb-6"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Blog
          </button>

          {/* Featured Image */}
          {blog.featuredImage && (
            <div className="aspect-video rounded-2xl overflow-hidden mb-8 shadow-xl">
              <img
                src={blog.featuredImage}
                alt={blog.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          {/* Article Header */}
          <article className="prose prose-lg max-w-none">
            <h1 className="text-4xl md:text-5xl font-serif font-bold text-stone-800 mb-4">
              {blog.title}
            </h1>

            {/* Meta Info */}
            <div className="flex flex-wrap items-center gap-6 text-stone-600 mb-8 not-prose">
              <div className="flex items-center gap-2">
                <User className="w-5 h-5" />
                <span className="font-medium">{blog.author}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                <span>{new Date(blog.$createdAt).toLocaleDateString('en-US', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}</span>
              </div>
              <div className="flex items-center gap-2">
                <Eye className="w-5 h-5" />
                <span>{blog.views || 0} views</span>
              </div>
            </div>

            {/* Tags */}
            {blog.tags && blog.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-8 not-prose">
                {blog.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="px-4 py-2 bg-amber-50 text-amber-700 rounded-full text-sm font-medium"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}

            {/* Excerpt */}
            {blog.excerpt && (
              <p className="text-xl text-stone-700 font-medium leading-relaxed mb-8 italic border-l-4 border-amber-600 pl-6">
                {blog.excerpt}
              </p>
            )}

            {/* Content */}
            <div className="text-stone-700 leading-relaxed">
              {blog.content.split('\n').map((paragraph, index) => (
                paragraph.trim() && <p key={index} className="mb-4">{paragraph}</p>
              ))}
            </div>
          </article>

          {/* Share Section */}
          <div className="mt-12 pt-8 border-t border-stone-200">
            <h3 className="text-lg font-bold text-stone-800 mb-4">Share this article</h3>
            <div className="flex gap-4">
              <button
                onClick={() => window.open(`https://www.facebook.com/sharer/sharer.php?u=${shareUrl}`, '_blank')}
                className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Facebook className="w-5 h-5" />
                Facebook
              </button>
              <button
                onClick={() => window.open(`https://twitter.com/intent/tweet?url=${shareUrl}&text=${blog.title}`, '_blank')}
                className="flex items-center gap-2 px-6 py-3 bg-sky-500 text-white rounded-lg hover:bg-sky-600 transition-colors"
              >
                <Twitter className="w-5 h-5" />
                Twitter
              </button>
              <button
                onClick={() => navigator.clipboard.writeText(shareUrl)}
                className="flex items-center gap-2 px-6 py-3 bg-stone-200 text-stone-700 rounded-lg hover:bg-stone-300 transition-colors"
              >
                <Share2 className="w-5 h-5" />
                Copy Link
              </button>
            </div>
          </div>

          {/* Author Box */}
          <div className="mt-12 p-6 bg-amber-50 rounded-2xl">
            <div className="flex items-center gap-4 mb-3">
              <div className="w-16 h-16 bg-amber-200 rounded-full flex items-center justify-center">
                <span className="text-2xl font-bold text-amber-800">{blog.author.charAt(0)}</span>
              </div>
              <div>
                <h4 className="text-lg font-bold text-stone-800">{blog.author}</h4>
                <p className="text-stone-600">Content Writer at Vadi Kashmir</p>
              </div>
            </div>
            <p className="text-stone-700">
              Passionate about sharing the rich heritage and craftsmanship of Kashmir with the world.
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default BlogDetail;
