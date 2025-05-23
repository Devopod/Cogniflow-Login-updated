import React from 'react';

const Hero: React.FC = () => {
  return (
    <section className="hero-gradient text-white py-20 lg:py-28 relative overflow-hidden">
      {/* Background Patterns */}
      <div className="dot-pattern absolute inset-0 opacity-5"></div>
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20">
        <div className="absolute -top-10 -right-10 w-64 h-64 bg-blue-400 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-1/3 w-72 h-72 bg-blue-300 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-0 w-80 h-80 bg-indigo-400 rounded-full blur-3xl"></div>
      </div>
      
      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left Column - Text Content */}
          <div className="space-y-8 text-center lg:text-left">
            {/* Highlight Badge */}
            <div className="inline-flex items-center px-3 py-1 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-white mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-yellow-300" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5 2a1 1 0 011 1v1h1a1 1 0 010 2H6v1a1 1 0 01-2 0V6H3a1 1 0 010-2h1V3a1 1 0 011-1zm0 10a1 1 0 011 1v1h1a1 1 0 110 2H6v1a1 1 0 11-2 0v-1H3a1 1 0 110-2h1v-1a1 1 0 011-1zM12 2a1 1 0 01.967.744L14.146 7.2 17.5 9.134a1 1 0 010 1.732l-3.354 1.935-1.18 4.455a1 1 0 01-1.933 0L9.854 12.8 6.5 10.866a1 1 0 010-1.732l3.354-1.935 1.18-4.455A1 1 0 0112 2z" clipRule="evenodd" />
              </svg>
              <span className="text-xs font-medium">NEXT-GEN ERP PLATFORM</span>
            </div>
            
            {/* Heading and Subheading */}
            <div>
              <h1 className="text-4xl md:text-5xl xl:text-6xl font-bold leading-tight mb-6">
                Transform Your Business with <span className="text-yellow-300 inline-block relative">
                  AI-Driven ERP 
                  <span className="absolute bottom-1 left-0 w-full h-1 bg-yellow-300 opacity-30"></span>
                </span>
              </h1>
              <p className="text-xl md:text-2xl text-blue-100 leading-relaxed max-w-xl mx-auto lg:mx-0 opacity-90">
                Powerful, affordable enterprise management for businesses of all sizes
              </p>
            </div>
            
            {/* Key Benefits */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/10 transition-all duration-300 hover:bg-white/15">
                <div className="flex items-center mb-2">
                  <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center mr-3 text-green-600">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <h3 className="font-medium text-white">Cost Savings</h3>
                </div>
                <p className="text-sm text-blue-100 ml-11">Reduce expenses by up to 35% with our efficient system</p>
              </div>
              
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/10 transition-all duration-300 hover:bg-white/15">
                <div className="flex items-center mb-2">
                  <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center mr-3 text-purple-600">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <h3 className="font-medium text-white">Efficiency Gains</h3>
                </div>
                <p className="text-sm text-blue-100 ml-11">Automate tasks and increase productivity by 42%</p>
              </div>
              
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/10 transition-all duration-300 hover:bg-white/15">
                <div className="flex items-center mb-2">
                  <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center mr-3 text-blue-600">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M7 2a1 1 0 00-.707 1.707L7 4.414v3.758a1 1 0 01-.293.707l-4 4C.817 14.769 2.156 18 4.828 18h10.343c2.673 0 4.012-3.231 2.122-5.121l-4-4A1 1 0 0113 8.172V4.414l.707-.707A1 1 0 0013 2H7zm2 6.172V4h2v4.172a3 3 0 00.879 2.12l1.027 1.028a4 4 0 00-2.171.102l-.47.156a4 4 0 01-2.53 0l-.563-.187a1.993 1.993 0 00-.114-.035l1.063-1.063A3 3 0 009 8.172z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <h3 className="font-medium text-white">Business Intelligence</h3>
                </div>
                <p className="text-sm text-blue-100 ml-11">Make decisions with AI-powered insights and analytics</p>
              </div>
            </div>
            
            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row justify-center lg:justify-start space-y-4 sm:space-y-0 sm:space-x-5 mt-8">
              <a href="/get-started" className="btn btn-lg group bg-white hover:bg-gray-50 text-blue-700 font-semibold shadow-lg shadow-blue-500/20 flex items-center justify-center">
                <span>Request a Demo</span>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2 transform transition-transform group-hover:translate-x-1" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </a>
              <a href="/pricing" className="btn btn-lg group bg-white/30 hover:bg-white/40 text-white font-bold border-2 border-white/70 flex items-center justify-center shadow-lg shadow-blue-600/10">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                </svg>
                <span>Watch Demo</span>
              </a>
            </div>
            
            {/* Trust Signals */}
            <div className="pt-6">
              <div className="flex items-center justify-center lg:justify-start mb-4">
                <span className="text-blue-100 font-medium mr-3">Trusted by 10,000+ businesses</span>
                <div className="flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  <span className="text-blue-100 text-xs ml-1">4.9/5</span>
                </div>
              </div>
              
              {/* Certifications */}
              <div className="flex flex-wrap justify-center lg:justify-start gap-3 mt-4">
                <div className="badge bg-white/20 backdrop-blur-sm text-white px-3 py-1.5 rounded-md flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  ISO 27001 Certified
                </div>
                <div className="badge bg-white/20 backdrop-blur-sm text-white px-3 py-1.5 rounded-md flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  GDPR Compliant
                </div>
                <div className="badge bg-white/20 backdrop-blur-sm text-white px-3 py-1.5 rounded-md flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  99.9% Uptime SLA
                </div>
              </div>
            </div>
          </div>
          
          {/* Right Column - Dashboard Mockup */}
          <div className="hidden lg:block relative">
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-600/10 to-purple-600/10 blur-xl"></div>
            <div className="relative bg-gray-900 rounded-2xl overflow-hidden shadow-2xl border border-white/10 backdrop-blur">
              {/* Dashboard UI */}
              <div className="bg-white rounded-t-2xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center mr-3">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM14 11a1 1 0 011 1v1h1a1 1 0 110 2h-1v1a1 1 0 11-2 0v-1h-1a1 1 0 110-2h1v-1a1 1 0 011-1z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900">CogniFlow Dashboard</h3>
                      <p className="text-xs text-gray-500">All systems operational</p>
                    </div>
                  </div>
                  <div className="flex space-x-1">
                    <div className="w-3 h-3 rounded-full bg-gray-300"></div>
                    <div className="w-3 h-3 rounded-full bg-gray-300"></div>
                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  </div>
                </div>
                
                {/* Dashboard Navigation */}
                <div className="flex space-x-4 mb-6 border-b border-gray-100 pb-2">
                  <button className="px-3 py-2 text-sm font-medium text-blue-600 border-b-2 border-blue-600">Overview</button>
                  <button className="px-3 py-2 text-sm font-medium text-gray-500">Analytics</button>
                  <button className="px-3 py-2 text-sm font-medium text-gray-500">Reports</button>
                  <button className="px-3 py-2 text-sm font-medium text-gray-500">Settings</button>
                </div>
                
                {/* Dashboard Stats Cards */}
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="bg-blue-50 p-4 rounded-xl">
                    <div className="flex justify-between items-center mb-2">
                      <div className="text-blue-500 font-bold">$48,294</div>
                      <span className="badge badge-primary">+12.5%</span>
                    </div>
                    <div className="text-xs text-gray-600">Total Revenue</div>
                    <div className="mt-2 h-1 w-full bg-blue-100 rounded-full overflow-hidden">
                      <div className="h-1 bg-blue-500 rounded-full" style={{ width: '75%' }}></div>
                    </div>
                  </div>
                  <div className="bg-green-50 p-4 rounded-xl">
                    <div className="flex justify-between items-center mb-2">
                      <div className="text-green-500 font-bold">287</div>
                      <span className="badge badge-success">+8.2%</span>
                    </div>
                    <div className="text-xs text-gray-600">New Orders</div>
                    <div className="mt-2 h-1 w-full bg-green-100 rounded-full overflow-hidden">
                      <div className="h-1 bg-green-500 rounded-full" style={{ width: '62%' }}></div>
                    </div>
                  </div>
                  <div className="bg-purple-50 p-4 rounded-xl">
                    <div className="flex justify-between items-center mb-2">
                      <div className="text-purple-500 font-bold">96%</div>
                      <span className="badge badge-primary">+2.4%</span>
                    </div>
                    <div className="text-xs text-gray-600">Satisfaction</div>
                    <div className="mt-2 h-1 w-full bg-purple-100 rounded-full overflow-hidden">
                      <div className="h-1 bg-purple-500 rounded-full" style={{ width: '96%' }}></div>
                    </div>
                  </div>
                </div>
                
                {/* AI Features Section */}
                <div className="border border-gray-100 rounded-xl p-4 mb-6">
                  <div className="flex items-center mb-4">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M3 5a2 2 0 012-2h10a2 2 0 012 2v8a2 2 0 01-2 2h-2.22l.123.489.804.804A1 1 0 0113 18H7a1 1 0 01-.707-1.707l.804-.804L7.22 15H5a2 2 0 01-2-2V5zm5.771 7H5V5h10v7H8.771z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <h4 className="ml-3 font-medium text-gray-900">AI-Powered Features</h4>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center">
                        <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                        <span className="text-xs text-gray-600 ml-2">Facial Recognition</span>
                      </div>
                      <span className="text-xs font-medium">97% accuracy</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-1.5">
                      <div className="bg-blue-600 h-1.5 rounded-full" style={{ width: '97%' }}></div>
                    </div>
                    
                    <div className="flex justify-between items-center mt-3">
                      <div className="flex items-center">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="text-xs text-gray-600 ml-2">Voice Commands</span>
                      </div>
                      <span className="text-xs font-medium">42 active users</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-1.5">
                      <div className="bg-green-500 h-1.5 rounded-full" style={{ width: '68%' }}></div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Floating Cards */}
              <div className="absolute top-32 -right-8 animate-float">
                <div className="bg-white p-3 rounded-xl shadow-lg">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-600" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div>
                      <div className="text-xs font-medium text-gray-800">AI Task Complete</div>
                      <div className="text-[10px] text-gray-500">Inventory optimized</div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="absolute bottom-24 -left-6 animate-float" style={{ animationDelay: '2s' }}>
                <div className="bg-white p-3 rounded-xl shadow-lg">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                        <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div>
                      <div className="text-xs font-medium text-gray-800">Facial ID</div>
                      <div className="text-[10px] text-gray-500">User authenticated</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Module Navigation Pills */}
        <div className="hidden md:flex justify-center mt-16">
          <div className="flex flex-wrap justify-center gap-3 bg-white/30 backdrop-blur-md px-6 py-3 rounded-full max-w-3xl border-2 border-white/60 shadow-lg">
            <span className="text-sm font-bold text-white px-2">Explore Modules:</span>
            <a href="/modules/finance" className="text-sm text-white bg-blue-600/80 px-4 py-1.5 rounded-full hover:bg-blue-700/80 transition-colors font-medium">Finance</a>
            <a href="/modules/inventory" className="text-sm text-white bg-blue-600/80 px-4 py-1.5 rounded-full hover:bg-blue-700/80 transition-colors font-medium">Inventory</a>
            <a href="/modules/hrms" className="text-sm text-white bg-blue-600/80 px-4 py-1.5 rounded-full hover:bg-blue-700/80 transition-colors font-medium">HRMS</a>
            <a href="/modules/crm" className="text-sm text-white bg-blue-600/80 px-4 py-1.5 rounded-full hover:bg-blue-700/80 transition-colors font-medium">CRM</a>
            <a href="/modules/analytics" className="text-sm text-white bg-blue-600/80 px-4 py-1.5 rounded-full hover:bg-blue-700/80 transition-colors font-medium">Analytics</a>
          </div>
        </div>
      </div>
      
      {/* Bottom Wave */}
      <div className="absolute bottom-0 left-0 right-0 h-8 bg-white" style={{ clipPath: 'polygon(0% 0%, 100% 100%, 100% 100%, 0% 100%)' }}></div>
    </section>
  );
};

export default Hero;