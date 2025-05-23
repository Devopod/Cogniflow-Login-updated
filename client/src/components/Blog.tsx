import React from 'react';
import { blogPosts } from '@/data/blog';

const Blog: React.FC = () => {
  // Featured post is the first post
  const featuredPost = blogPosts[0];
  // Rest of the posts
  const remainingPosts = blogPosts.slice(1);
  
  return (
    <section className="py-16 md:py-24 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <span className="text-blue-600 font-medium text-sm uppercase tracking-wider">Knowledge Center</span>
          <h2 className="section-title mt-2">Latest Insights & Resources</h2>
          <p className="section-subtitle">
            Expert articles and guides to help you optimize your ERP experience
          </p>
        </div>

        {/* Featured Article */}
        <div className="mb-16">
          <div className="bg-white rounded-xl shadow-sm overflow-hidden md:grid md:grid-cols-2 border border-gray-100">
            <div className="relative h-64 lg:h-full bg-blue-100 overflow-hidden">
              {featuredPost.image ? (
                <img 
                  src={featuredPost.image} 
                  alt={featuredPost.title}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-r from-blue-600 to-blue-800">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-20 w-20 text-white opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                  </svg>
                </div>
              )}
              <div className={`absolute top-4 left-4 ${featuredPost.categoryColor} text-white text-xs font-semibold px-3 py-1.5 rounded-full uppercase`}>
                {featuredPost.category}
              </div>
            </div>
            
            <div className="p-8 lg:p-10 flex flex-col">
              <div className="flex-grow">
                <div className="text-sm text-gray-500 mb-3">{featuredPost.date}</div>
                <h3 className="text-2xl font-bold text-gray-800 mb-4 hover:text-blue-600 transition-colors">
                  <a href="#">{featuredPost.title}</a>
                </h3>
                <p className="text-gray-600 mb-6">{featuredPost.summary}</p>
              </div>
              
              <div className="flex items-center justify-between mt-4">
                <div className="flex items-center">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold mr-3">
                    CZ
                  </div>
                  <div className="text-sm">
                    <p className="font-medium text-gray-800">Chris Zawadi</p>
                    <p className="text-gray-500">Chief Product Officer</p>
                  </div>
                </div>
                
                <a href="#" className="text-blue-600 hover:text-blue-800 font-medium inline-flex items-center text-sm group">
                  Read article
                  <svg className="w-4 h-4 ml-2 transform transition-transform group-hover:translate-x-1" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H3a1 1 0 110-2h9.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Articles Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-8">
          {remainingPosts.map(post => (
            <article key={post.id} className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100 transition-all duration-300 hover:shadow-md hover:border-blue-100">
              <div className="relative h-48 bg-gray-100 overflow-hidden">
                {post.image ? (
                  <img 
                    src={post.image} 
                    alt={post.title}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="h-full w-full bg-gradient-to-r from-blue-100 to-blue-200 flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                    </svg>
                  </div>
                )}
                <div className={`absolute top-4 left-4 ${post.categoryColor} text-white text-xs font-semibold px-3 py-1 rounded-full uppercase`}>
                  {post.category}
                </div>
              </div>
              <div className="p-6">
                <div className="text-sm text-gray-500 mb-2">{post.date}</div>
                <h3 className="text-xl font-semibold mb-3 text-gray-800 hover:text-blue-600 transition-colors line-clamp-2">
                  <a href="#">{post.title}</a>
                </h3>
                <p className="text-gray-600 mb-4 text-sm line-clamp-3">{post.summary}</p>
                <div className="flex justify-between items-center pt-2">
                  <div className="flex items-center text-sm text-gray-500">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>5 min read</span>
                  </div>
                  <a href="#" className="text-blue-600 hover:text-blue-800 text-sm font-medium group inline-flex items-center">
                    Read more
                    <svg className="w-3 h-3 ml-1 transform transition-transform group-hover:translate-x-1" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H3a1 1 0 110-2h9.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </a>
                </div>
              </div>
            </article>
          ))}
        </div>

        {/* Popular Topics */}
        <div className="mt-16 text-center">
          <h3 className="text-xl font-semibold text-gray-800 mb-6">Popular Topics</h3>
          <div className="flex flex-wrap justify-center gap-3">
            <a href="#" className="bg-white border border-gray-200 hover:border-blue-300 text-gray-700 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200">
              Facial Detection
            </a>
            <a href="#" className="bg-white border border-gray-200 hover:border-blue-300 text-gray-700 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200">
              MPESA Integration
            </a>
            <a href="#" className="bg-white border border-gray-200 hover:border-blue-300 text-gray-700 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200">
              AI Analytics
            </a>
            <a href="#" className="bg-white border border-gray-200 hover:border-blue-300 text-gray-700 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200">
              Inventory Management
            </a>
            <a href="#" className="bg-white border border-gray-200 hover:border-blue-300 text-gray-700 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200">
              Implementation Guide
            </a>
          </div>
        </div>

        {/* CTA Banner */}
        <div className="mt-16 bg-gradient-to-r from-blue-600 to-blue-800 rounded-xl p-8 md:p-10 text-white text-center">
          <h3 className="text-xl md:text-2xl font-bold mb-4">Stay Updated with ERP Insights</h3>
          <p className="text-blue-100 mb-6 max-w-xl mx-auto">Subscribe to our newsletter for the latest industry trends, tips, and best practices</p>
          <div className="max-w-md mx-auto flex flex-col sm:flex-row gap-3">
            <input 
              type="email" 
              placeholder="Enter your email" 
              className="flex-grow px-4 py-3 rounded-md text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-300"
            />
            <button className="btn-white">
              Subscribe
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Blog;
