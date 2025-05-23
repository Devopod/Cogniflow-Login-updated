import React, { useState } from 'react';
import { resources } from '@/data/resources';

const Resources: React.FC = () => {
  const [activeTab, setActiveTab] = useState<number>(1);
  
  return (
    <section className="py-16 md:py-28 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <span className="text-blue-600 font-medium text-sm uppercase tracking-wider">Learning Resources</span>
          <h2 className="section-title mt-2">Resources to Help You Succeed</h2>
          <p className="section-subtitle">
            Explore our comprehensive library of resources designed to maximize your CogniFlow ERP experience
          </p>
        </div>

        {/* Tabs Navigation */}
        <div className="flex justify-center mb-12 px-4">
          <div className="inline-flex p-1 bg-gray-100 rounded-lg flex-wrap justify-center">
            {resources.map(resource => (
              <button
                key={resource.id}
                className={`px-3 sm:px-6 py-2.5 text-sm font-medium rounded-md transition-all duration-200 ${
                  activeTab === resource.id
                    ? 'bg-white text-blue-700 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
                onClick={() => setActiveTab(resource.id)}
              >
                {resource.title}
              </button>
            ))}
          </div>
        </div>

        {/* Resources Content */}
        <div className="bg-gray-50 rounded-2xl overflow-hidden shadow-sm border border-gray-100">
          {resources.map(resource => (
            <div
              key={resource.id}
              className={`transition-opacity duration-300 ${activeTab === resource.id ? 'block' : 'hidden'}`}
            >
              <div className="p-8 md:p-12">
                <div className="flex flex-col sm:flex-row items-center text-center sm:text-left mb-8">
                  <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mb-4 sm:mb-0 sm:mr-6">
                    <i className={`fas fa-${resource.icon} text-blue-600 text-2xl`}></i>
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-gray-800">{resource.title}</h3>
                    <p className="text-gray-600 mt-1">{resource.description}</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                  {resource.items.map(item => (
                    <div 
                      key={item.id} 
                      className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-all duration-300 hover:border-blue-100"
                    >
                      {/* Resource Item Card */}
                      <div className="h-36 bg-gradient-to-r from-blue-50 to-indigo-50 flex items-center justify-center">
                        {resource.id === 1 ? (
                          // Webinar item
                          <div className="text-center">
                            <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-500 text-white rounded-full mb-2">
                              <i className="fas fa-play text-lg"></i>
                            </div>
                            <p className={`${item.tagColor} text-sm font-medium`}>{item.tag}</p>
                          </div>
                        ) : resource.id === 2 ? (
                          // eBook item
                          <div className="relative w-20 h-28 bg-white shadow-md rounded transform rotate-3">
                            <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-blue-600 m-1 rounded-sm flex items-center justify-center">
                              <i className="fas fa-book text-white text-2xl"></i>
                            </div>
                          </div>
                        ) : (
                          // Community item
                          <div className="text-center">
                            <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 text-blue-600 rounded-full mb-2">
                              <i className="fas fa-comments text-lg"></i>
                            </div>
                            <p className={`${item.tagColor} text-sm font-medium`}>{item.tag}</p>
                          </div>
                        )}
                      </div>
                      <div className="p-6">
                        <span className={`${item.tagColor} text-xs font-medium uppercase`}>{item.tag}</span>
                        <h4 className="text-lg font-semibold text-gray-800 mb-3 mt-1">{item.title}</h4>
                        <a href="#" className="text-blue-600 hover:text-blue-800 text-sm font-medium inline-flex items-center group">
                          {resource.id === 1 
                            ? "Watch webinar" 
                            : resource.id === 2 
                              ? "Download eBook" 
                              : "Join discussion"
                          }
                          <svg className="w-4 h-4 ml-1 transform transition-transform group-hover:translate-x-1" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H3a1 1 0 110-2h9.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                          </svg>
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Additional Content Based on Resource Type */}
                {resource.id === 1 && (
                  <div className="mt-12 bg-white p-6 rounded-xl border border-gray-200">
                    <h4 className="text-lg font-semibold text-gray-800 mb-4">Upcoming Live Webinars</h4>
                    <div className="space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:justify-between border-b border-gray-100 pb-4">
                        <div className="flex items-start">
                          <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mr-4 flex-shrink-0">
                            <i className="fas fa-calendar-alt text-blue-600"></i>
                          </div>
                          <div>
                            <h5 className="font-medium">Mastering Facial Detection in HR</h5>
                            <p className="text-sm text-gray-500">May 20, 2025 • 2:00 PM EST</p>
                          </div>
                        </div>
                        <a href="#" className="btn-outline text-sm py-2 text-center sm:text-left">Register</a>
                      </div>
                      <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:justify-between">
                        <div className="flex items-start">
                          <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mr-4 flex-shrink-0">
                            <i className="fas fa-calendar-alt text-blue-600"></i>
                          </div>
                          <div>
                            <h5 className="font-medium">Advanced MPESA Integration Techniques</h5>
                            <p className="text-sm text-gray-500">June 12, 2025 • 10:00 AM EST</p>
                          </div>
                        </div>
                        <a href="#" className="btn-outline text-sm py-2 text-center sm:text-left">Register</a>
                      </div>
                    </div>
                  </div>
                )}
                
                {resource.id === 2 && (
                  <div className="mt-12 bg-blue-50 p-6 rounded-xl border border-blue-100">
                    <div className="flex flex-col md:flex-row items-center">
                      <div className="mb-6 md:mb-0 md:mr-8">
                        <h4 className="text-lg font-semibold text-gray-800 mb-2">Exclusive Content</h4>
                        <p className="text-gray-600 mb-4">Get our comprehensive guide on implementing CogniFlow ERP in your business</p>
                        <a href="#" className="btn-primary">Download Free Guide</a>
                      </div>
                      <div className="flex-shrink-0 w-40 h-56 bg-white rounded-lg shadow-md relative transform rotate-3">
                        <div className="absolute inset-0 m-1 rounded bg-gradient-to-r from-blue-600 to-indigo-600 flex items-center justify-center text-white">
                          <div className="text-center p-4">
                            <i className="fas fa-file-pdf text-4xl mb-2"></i>
                            <div className="text-sm font-medium">Implementation Guide</div>
                            <div className="text-xs">32 pages</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                {resource.id === 3 && (
                  <div className="mt-12 bg-white p-6 rounded-xl border border-gray-200">
                    <h4 className="text-lg font-semibold text-gray-800 mb-4">Join Our Community</h4>
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                        <h5 className="font-medium flex items-center mb-2">
                          <i className="fas fa-users text-blue-600 mr-2"></i> 10,000+ Members
                        </h5>
                        <p className="text-sm text-gray-600">Connect with other CogniFlow users around the world</p>
                      </div>
                      <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                        <h5 className="font-medium flex items-center mb-2">
                          <i className="fas fa-headset text-blue-600 mr-2"></i> Expert Support
                        </h5>
                        <p className="text-sm text-gray-600">Get answers from our certified product experts</p>
                      </div>
                    </div>
                    <div className="mt-6 text-center">
                      <a href="#" className="btn-primary">Join Community</a>
                    </div>
                  </div>
                )}
                
                <div className="mt-8 text-center">
                  <a href="#" className="text-blue-600 hover:text-blue-800 font-medium inline-flex items-center">
                    View all {resource.title.toLowerCase()}
                    <svg className="w-5 h-5 ml-1" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H3a1 1 0 110-2h9.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {/* Resource Stats */}
        <div className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="text-3xl font-bold text-blue-700 mb-2">56+</div>
            <div className="text-gray-600">Webinars</div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="text-3xl font-bold text-blue-700 mb-2">28</div>
            <div className="text-gray-600">eBooks</div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="text-3xl font-bold text-blue-700 mb-2">15K+</div>
            <div className="text-gray-600">Community Members</div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="text-3xl font-bold text-blue-700 mb-2">24/7</div>
            <div className="text-gray-600">Support</div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Resources;
