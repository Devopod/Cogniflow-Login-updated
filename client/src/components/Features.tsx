import React, { useState } from 'react';
import { features } from '@/data/features';

const Features: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('all');
  
  // Categorize features
  const categories = {
    all: features,
    core: features.slice(0, 4),
    business: features.slice(4, 8)
  };
  
  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
  };

  return (
    <section className="py-16 md:py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <span className="text-blue-600 font-medium text-sm uppercase tracking-wider">Key Features</span>
          <h2 className="section-title mt-2">Enterprise-Grade ERP Made Simple</h2>
          <p className="section-subtitle">
            AI-powered tools to streamline operations, boost productivity, and scale your business
          </p>
        </div>

        {/* Filter tabs */}
        <div className="flex justify-center mb-12 px-4">
          <div className="bg-gray-100 rounded-full p-1 inline-flex flex-wrap justify-center border border-gray-200">
            <button 
              onClick={() => handleTabChange('all')} 
              className={`px-3 sm:px-5 py-2 rounded-full text-sm font-medium transition-all duration-200 m-1 ${
                activeTab === 'all' 
                  ? 'bg-blue-600 text-white shadow-md' 
                  : 'text-gray-700 hover:text-blue-700'
              }`}
            >
              All Features
            </button>
            <button 
              onClick={() => handleTabChange('core')} 
              className={`px-3 sm:px-5 py-2 rounded-full text-sm font-medium transition-all duration-200 m-1 ${
                activeTab === 'core' 
                  ? 'bg-blue-600 text-white shadow-md' 
                  : 'text-gray-700 hover:text-blue-700'
              }`}
            >
              Core Features
            </button>
            <button 
              onClick={() => handleTabChange('business')} 
              className={`px-3 sm:px-5 py-2 rounded-full text-sm font-medium transition-all duration-200 m-1 ${
                activeTab === 'business' 
                  ? 'bg-blue-600 text-white shadow-md' 
                  : 'text-gray-700 hover:text-blue-700'
              }`}
            >
              Business Features
            </button>
          </div>
        </div>

        {/* Features grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8">
          {categories[activeTab as keyof typeof categories].map(feature => (
            <div 
              key={feature.id} 
              className="feature-card bg-white border border-gray-100 p-5 sm:p-6 rounded-xl shadow-sm hover:border-blue-100 flex flex-col h-full text-center sm:text-left"
            >
              <div className={`feature-icon p-3 bg-${feature.color?.replace('600', '50')} rounded-full w-14 h-14 flex items-center justify-center mb-5 mx-auto sm:mx-0`}>
                <i className={`fas fa-${feature.icon} text-${feature.color} text-xl`}></i>
              </div>
              <h3 className="text-lg font-semibold mb-3 text-gray-800">
                <span className={`text-${feature.color} mr-2`}>🔹</span>
                {feature.title}
              </h3>
              <p className="text-gray-600 text-sm leading-relaxed flex-grow mb-4">{feature.description}</p>
              <div className="flex justify-center sm:justify-start">
                <a href="#" className="text-blue-600 hover:text-blue-800 font-medium text-sm inline-flex items-center group">
                  Learn more
                  <svg className="w-4 h-4 ml-1 transform transition-transform duration-300 group-hover:translate-x-1" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M12.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </a>
              </div>
            </div>
          ))}
        </div>
        
        {/* Compare plans button */}
        <div className="mt-16 text-center">
          <a href="#" className="btn-outline inline-flex items-center shadow-sm">
            Compare all plans and features
            <svg className="w-5 h-5 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </a>
        </div>
        
        {/* Integrations section */}
        <div className="mt-24 bg-gray-50 rounded-2xl p-8 md:p-12">
          <div className="text-center mb-12">
            <span className="text-blue-600 font-medium text-sm uppercase tracking-wider">Seamless Integration</span>
            <h3 className="text-2xl font-bold text-gray-800 mt-2">Works with the tools you already use</h3>
            <p className="text-gray-600 max-w-2xl mx-auto mt-4">
              Connect CogniFlow ERP with your favorite business tools and automate your workflow
            </p>
          </div>
          
          <div className="flex flex-wrap justify-center gap-4 md:gap-8">
            <div className="bg-white p-4 md:p-6 rounded-lg shadow-sm w-24 h-24 md:w-32 md:h-32 flex items-center justify-center">
              <div className="text-gray-400 text-sm md:text-base">Slack</div>
            </div>
            <div className="bg-white p-4 md:p-6 rounded-lg shadow-sm w-24 h-24 md:w-32 md:h-32 flex items-center justify-center">
              <div className="text-gray-400 text-sm md:text-base">Microsoft</div>
            </div>
            <div className="bg-white p-4 md:p-6 rounded-lg shadow-sm w-24 h-24 md:w-32 md:h-32 flex items-center justify-center">
              <div className="text-gray-400 text-sm md:text-base">Google</div>
            </div>
            <div className="bg-white p-4 md:p-6 rounded-lg shadow-sm w-24 h-24 md:w-32 md:h-32 flex items-center justify-center">
              <div className="text-gray-400 text-sm md:text-base">Stripe</div>
            </div>
            <div className="bg-white p-4 md:p-6 rounded-lg shadow-sm w-24 h-24 md:w-32 md:h-32 flex items-center justify-center">
              <div className="text-gray-400 text-sm md:text-base">AWS</div>
            </div>
            <div className="bg-white p-4 md:p-6 rounded-lg shadow-sm w-24 h-24 md:w-32 md:h-32 flex items-center justify-center">
              <div className="text-gray-400 text-sm md:text-base">MPESA</div>
            </div>
          </div>
          
          <div className="mt-10 text-center">
            <a href="#" className="text-blue-600 hover:text-blue-800 font-medium inline-flex items-center">
              View all integrations
              <svg className="w-5 h-5 ml-1" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H3a1 1 0 110-2h9.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Features;
