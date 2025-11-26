// src/components/BlogList.jsx
import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { Calendar, User, Eye, ArrowRight, Search } from 'lucide-react';
import blogService from '../services/blogService';

const BlogList = ({ onSelectBlog }) => {
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadBlogs();
  }, []);

  const loadBlogs = async () => {
    setLoading(true);
    const result = await blogService.getBlogs({ published: true, limit: 50 });
    if (result.success) {
      setBlogs(result.blogs);
    }
    setLoading(false);
  };

  const filteredBlogs = blogs.filter(blog =>
    blog.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    blog.excerpt?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      <Helmet>
        <title>Blog - Stories from Kashmir | Vadi Kashmir</title>
        <meta name="description" content="Explore stories, traditions, and craftsmanship of Kashmir. Learn about authentic Kashmiri products and culture." />
        <meta name="keywords" content="Kashmir blog, Kashmiri culture, handicrafts, traditions, stories" />
      </Helmet>

      <div className="min-h-screen bg-gradient-to-b from-amber-50 to-white py-12">
        <div className="max-w-7xl mx-auto px-4">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-serif font-bold text-stone-800 mb-4">
              Stories from Kashmir
            </h1>
            <p className="text-lg text-stone-600 max-w-2xl mx-auto mb-8">
              Discover the rich heritage, artisan craftsmanship, and timeless traditions of Kashmir
            </p>

            {/* Search */}
            <div className="max-w-md mx-auto relative">
              <Search className="w-5 h-5 absolute left-4 top-1/2 transform -translate-y-1/2 text-stone-400" />
              <input
                type="text"
                placeholder="Search articles..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border-2 border-stone-200 rounded-full focus:border-amber-500 focus:outline-none"
              />
            </div>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600"></div>
              <p className="mt-4 text-stone-600">Loading articles...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredBlogs.map(blog => (
                <article
                  key={blog.$id}
                  className="bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 cursor-pointer group"
                  onClick={() => window.location.hash = `#blog/${blog.slug || blog.$id}`}
                >
                  {/* Featured Image */}
                  <div className="aspect-video bg-gradient-to-br from-amber-100 to-stone-100 overflow-hidden">
                    {blog.featuredImage ? (
                      <img
                        src={blog.featuredImage}
                        alt={blog.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="text-6xl">📝</span>
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="p-6">
                    <h2 className="text-xl font-bold text-stone-800 mb-3 group-hover:text-amber-600 transition-colors line-clamp-2">
                      {blog.title}
                    </h2>

                    {blog.excerpt && (
                      <p className="text-stone-600 mb-4 line-clamp-3">
                        {blog.excerpt}
                      </p>
                    )}

                    {/* Meta Info */}
                    <div className="flex items-center gap-4 text-sm text-stone-500 mb-4">
                      <div className="flex items-center gap-1">
                        <User className="w-4 h-4" />
                        <span>{blog.author}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        <span>{new Date(blog.$createdAt).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Eye className="w-4 h-4" />
                        <span>{blog.views || 0}</span>
                      </div>
                    </div>

                    {/* Tags */}
                    {blog.tags && blog.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-4">
                        {blog.tags.slice(0, 3).map((tag, index) => (
                          <span
                            key={index}
                            className="px-3 py-1 bg-amber-50 text-amber-700 rounded-full text-xs font-medium"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Read More */}
                    <div className="flex items-center gap-2 text-amber-600 font-medium group-hover:gap-4 transition-all">
                      <span>Read More</span>
                      <ArrowRight className="w-4 h-4" />
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}

          {!loading && filteredBlogs.length === 0 && (
            <div className="text-center py-12">
              <p className="text-xl text-stone-600">No articles found</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default BlogList;
