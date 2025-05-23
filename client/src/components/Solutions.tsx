import React, { useState } from 'react';
import { industries } from '@/data/industries';
import { businessSizes } from '@/data/businessSizes';

const Solutions: React.FC = () => {
  const [activeIndustry, setActiveIndustry] = useState<number>(1);
  
  return (
    <section className="py-16 md:py-28 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <span className="text-blue-600 font-medium text-sm uppercase tracking-wider">Specialized Solutions</span>
          <h2 className="section-title mt-2">ERP Solutions for Your Industry</h2>
          <p className="section-subtitle">
            Tailored to meet the unique challenges and requirements of your specific business
          </p>
        </div>

        {/* Industry Solutions */}
        <div className="bg-gray-50 rounded-2xl overflow-hidden mb-20">
          <div className="lg:grid lg:grid-cols-12">
            {/* Industry Navigation Sidebar - Mobile */}
            <div className="p-4 lg:hidden">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 px-2">Select Industry</h3>
              <div className="flex flex-wrap gap-2">
                {industries.map(industry => (
                  <button
                    key={industry.id}
                    className={`flex items-center px-3 py-2 rounded-lg transition-all duration-200 ${
                      activeIndustry === industry.id
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                    onClick={() => setActiveIndustry(industry.id)}
                  >
                    <span className={`w-6 h-6 mr-2 flex items-center justify-center rounded-full ${
                      activeIndustry === industry.id ? 'bg-blue-500 text-white' : 'bg-blue-100 text-blue-600'
                    }`}>
                      <i className={`fas fa-${industry.icon} text-xs`}></i>
                    </span>
                    <span className="font-medium text-sm">{industry.title}</span>
                  </button>
                ))}
              </div>
            </div>
            
            {/* Industry Navigation Sidebar - Desktop */}
            <div className="hidden lg:block lg:col-span-4 xl:col-span-3 bg-gray-100">
              <div className="sticky top-24">
                <div className="py-6 px-4">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 px-3">By Industry</h3>
                  <div className="space-y-1">
                    {industries.map(industry => (
                      <button
                        key={industry.id}
                        className={`w-full text-left px-3 py-3 rounded-lg transition-all duration-200 flex items-center ${
                          activeIndustry === industry.id
                            ? 'bg-blue-600 text-white shadow-md'
                            : 'text-gray-700 hover:bg-gray-200'
                        }`}
                        onClick={() => setActiveIndustry(industry.id)}
                      >
                        <span className={`w-8 h-8 mr-3 flex items-center justify-center rounded-full ${
                          activeIndustry === industry.id ? 'bg-blue-500 text-white' : 'bg-blue-100 text-blue-600'
                        }`}>
                          <i className={`fas fa-${industry.icon}`}></i>
                        </span>
                        <span className="font-medium">{industry.title}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            
            {/* Industry Content */}
            <div className="lg:col-span-8 xl:col-span-9 p-8 md:p-12">
              {industries.map(industry => (
                <div 
                  key={industry.id} 
                  className={`transition-opacity duration-300 ${activeIndustry === industry.id ? 'block' : 'hidden'}`}
                >
                  <div className="flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left mb-6">
                    <div className={`w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center sm:mr-6 mb-3 sm:mb-0`}>
                      <i className={`fas fa-${industry.icon} text-blue-600 text-2xl`}></i>
                    </div>
                    <h3 className="text-2xl md:text-3xl font-bold text-gray-800">{industry.title} Solutions</h3>
                  </div>
                  
                  <p className="text-lg text-gray-600 mb-8 max-w-3xl">{industry.description}</p>
                  
                  <div className="grid md:grid-cols-2 gap-8 mb-10">
                    <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100">
                      <h4 className="text-lg font-semibold text-gray-800 mb-4">Key Capabilities</h4>
                      <ul className="space-y-4">
                        {industry.features.map((feature, index) => (
                          <li key={index} className="flex">
                            <div className="flex-shrink-0 w-5 h-5 mt-1 mr-3">
                              <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
                              </svg>
                            </div>
                            <div>
                              <span className="text-gray-700">{feature}</span>
                            </div>
                          </li>
                        ))}
                        <li className="flex">
                          <div className="flex-shrink-0 w-5 h-5 mt-1 mr-3">
                            <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
                            </svg>
                          </div>
                          <div>
                            <span className="text-gray-700">Facial detection for employee attendance</span>
                          </div>
                        </li>
                      </ul>
                    </div>
                    
                    <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100">
                      <h4 className="text-lg font-semibold text-gray-800 mb-4">Customer Success</h4>
                      <div className="bg-blue-50 rounded-lg p-4 border border-blue-100 mb-6">
                        <p className="text-gray-700 italic mb-3">
                          "CogniFlow ERP completely transformed our {industry.title.toLowerCase()} operations, reducing costs by 30% and improving overall efficiency."
                        </p>
                        <div className="flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left">
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-semibold sm:mr-3 mb-2 sm:mb-0">
                            AB
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-800">Alex Bowen</p>
                            <p className="text-xs text-gray-500">CEO, {industry.title} Solutions Inc.</p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div className="text-center sm:text-left">
                          <span className="text-blue-600 font-medium text-sm">Success Rate</span>
                          <p className="text-xl font-bold">97%</p>
                        </div>
                        <div className="text-center sm:text-left">
                          <span className="text-blue-600 font-medium text-sm">Implementation Time</span>
                          <p className="text-xl font-bold">2-4 Weeks</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex justify-center">
                    <a href="#" className="btn-primary">
                      Explore {industry.title} Solutions
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Business Size Solutions */}
        <div className="mb-20">
          <div className="text-center mb-12">
            <span className="text-blue-600 font-medium text-sm uppercase tracking-wider">For Every Business</span>
            <h3 className="text-2xl md:text-3xl font-bold text-gray-800 mt-2">Solutions by Business Size</h3>
            <p className="mt-4 text-lg text-gray-600 max-w-3xl mx-auto">
              Whether you're a startup or an enterprise, we have the right solution for you
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
            {businessSizes.map(size => (
              <div 
                key={size.id} 
                className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 hover:shadow-lg transition-all duration-300 hover:border-blue-100 relative overflow-hidden"
              >
                {/* Background pattern */}
                <div className="absolute top-0 right-0 w-24 h-24 opacity-10">
                  <svg className="w-full h-full text-blue-500" viewBox="0 0 80 80" fill="currentColor">
                    <path d="M80 0L40 40 0 80V0h80z" />
                  </svg>
                </div>
                
                <div className="relative text-center sm:text-left">
                  <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mb-6 mx-auto sm:mx-0">
                    <i className={`fas fa-${size.icon} text-blue-600 text-2xl`}></i>
                  </div>
                  
                  <h4 className="text-xl font-bold text-gray-800 mb-3">{size.title}</h4>
                  <p className="text-gray-600 mb-6">{size.description}</p>
                  
                  <div className={`${size.highlightColor} bg-opacity-10 px-4 py-2 rounded-md inline-block mb-6`}>
                    <span className={`${size.highlightColor} font-medium text-sm`}>{size.highlight}</span>
                  </div>
                  
                  <ul className="space-y-3 mb-8 text-left">
                    <li className="flex items-start">
                      <svg className="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path>
                      </svg>
                      <span className="text-gray-600 text-sm">All 15 core modules</span>
                    </li>
                    <li className="flex items-start">
                      <svg className="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path>
                      </svg>
                      <span className="text-gray-600 text-sm">Facial detection technology</span>
                    </li>
                    <li className="flex items-start">
                      <svg className="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path>
                      </svg>
                      <span className="text-gray-600 text-sm">MPESA Integration</span>
                    </li>
                    <li className="flex items-start">
                      <svg className="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path>
                      </svg>
                      <span className="text-gray-600 text-sm">{size.id === 1 ? 'Basic' : size.id === 2 ? 'Standard' : 'Premium'} Support</span>
                    </li>
                  </ul>
                  
                  <div className="pt-2 flex justify-center sm:justify-start">
                    <a href="#" className={size.id === 2 ? "btn-primary" : "btn-outline"}>
                      View Details
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* FAQ Section */}
        <div className="bg-gray-50 rounded-2xl p-6 md:p-12">
          <div className="text-center mb-8 md:mb-12">
            <span className="text-blue-600 font-medium text-sm uppercase tracking-wider">Frequently Asked Questions</span>
            <h3 className="text-xl md:text-2xl font-bold text-gray-800 mt-2">Questions About Our Solutions?</h3>
            <p className="mt-3 md:mt-4 text-base md:text-lg text-gray-600 max-w-3xl mx-auto">
              Find answers to common questions about CogniFlow ERP solutions
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-4 md:gap-8 max-w-5xl mx-auto">
            <div className="bg-white p-5 md:p-6 rounded-xl shadow-sm border border-gray-100">
              <h4 className="text-md md:text-lg font-semibold text-gray-800 mb-2 md:mb-3">How long does implementation take?</h4>
              <p className="text-sm md:text-base text-gray-600">
                Implementation timelines vary based on business size and complexity, but typically range from 2-8 weeks with our streamlined onboarding process.
              </p>
            </div>
            <div className="bg-white p-5 md:p-6 rounded-xl shadow-sm border border-gray-100">
              <h4 className="text-md md:text-lg font-semibold text-gray-800 mb-2 md:mb-3">Is data migration included?</h4>
              <p className="text-sm md:text-base text-gray-600">
                Yes, all our packages include basic data migration. Our team will work with you to seamlessly transfer your existing data to CogniFlow ERP.
              </p>
            </div>
            <div className="bg-white p-5 md:p-6 rounded-xl shadow-sm border border-gray-100">
              <h4 className="text-md md:text-lg font-semibold text-gray-800 mb-2 md:mb-3">How does the facial detection work?</h4>
              <p className="text-sm md:text-base text-gray-600">
                Our AI-powered facial detection uses standard webcams or mobile cameras to recognize employees, track attendance, and provide mood analysis.
              </p>
            </div>
            <div className="bg-white p-5 md:p-6 rounded-xl shadow-sm border border-gray-100">
              <h4 className="text-md md:text-lg font-semibold text-gray-800 mb-2 md:mb-3">Can I customize modules for my industry?</h4>
              <p className="text-sm md:text-base text-gray-600">
                Absolutely! CogniFlow ERP is designed with customization in mind. Our industry experts will help tailor each module to your specific needs.
              </p>
            </div>
          </div>
          
          <div className="mt-8 text-center">
            <a href="#" className="text-blue-600 hover:text-blue-800 font-medium inline-flex items-center text-sm md:text-base">
              View all FAQs
              <svg className="w-4 h-4 md:w-5 md:h-5 ml-1" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H3a1 1 0 110-2h9.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Solutions;
