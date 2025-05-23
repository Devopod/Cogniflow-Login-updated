import React, { useState } from 'react';

const AIFeatures: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);
  
  const features = [
    {
      id: 0,
      title: "Facial Recognition",
      description: "Secure login and authentication through advanced facial recognition technology, eliminating password issues and enhancing system security.",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </svg>
      ),
      animation: "fade-right",
      imageUrl: "https://images.unsplash.com/photo-1526378787940-576a539ba69d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTJ8fGZhY2UlMjByZWNvZ25pdGlvbnxlbnwwfHwwfHx8MA%3D%3D&auto=format&fit=crop&w=800&q=60"
    },
    {
      id: 1,
      title: "Voice Recognition",
      description: "Interact with your ERP system using natural language commands, making data entry and retrieval faster and more intuitive.",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
        </svg>
      ),
      animation: "fade-up",
      imageUrl: "https://images.unsplash.com/photo-1589254065909-b7086229d08c?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTd8fHZvaWNlJTIwcmVjb2duaXRpb258ZW58MHx8MHx8fDA%3D&auto=format&fit=crop&w=800&q=60"
    },
    {
      id: 2,
      title: "Predictive Analytics",
      description: "Leverage AI-powered analytics to forecast trends, optimize inventory levels, and make data-driven business decisions.",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      animation: "fade-left",
      imageUrl: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8M3x8YW5hbHl0aWNzfGVufDB8fDB8fHww&auto=format&fit=crop&w=800&q=60"
    }
  ];

  return (
    <section className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-sm font-semibold tracking-wide text-blue-600 uppercase">AI-Powered Features</span>
          <h2 className="mt-2 text-3xl md:text-4xl font-bold text-gray-900 leading-tight">
            Transforming Business Operations with Artificial Intelligence
          </h2>
          <p className="mt-4 text-xl text-gray-600">
            Our advanced AI capabilities deliver smarter, faster, and more intuitive ERP experiences
          </p>
        </div>

        {/* Feature Tabs */}
        <div className="grid md:grid-cols-3 gap-4 mb-12">
          {features.map((feature, index) => (
            <button
              key={feature.id}
              onClick={() => setActiveTab(index)}
              className={`relative overflow-hidden rounded-xl p-6 text-left transition-all ${
                activeTab === index 
                  ? 'bg-white shadow-lg border-2 border-blue-500' 
                  : 'bg-white shadow hover:shadow-md border border-gray-100'
              }`}
            >
              <div className="flex items-start">
                <div className={`transition-all duration-300 ${activeTab === index ? 'text-blue-600' : 'text-gray-400'}`}>
                  {feature.icon}
                </div>
                <div className="ml-4">
                  <h3 className={`text-lg font-semibold ${activeTab === index ? 'text-blue-600' : 'text-gray-900'}`}>
                    {feature.title}
                  </h3>
                  <p className="mt-2 text-sm text-gray-600 line-clamp-2">
                    {feature.description}
                  </p>
                </div>
              </div>
              {activeTab === index && (
                <div className="absolute bottom-0 left-0 w-full h-1 bg-blue-500"></div>
              )}
            </button>
          ))}
        </div>

        {/* Feature Demo Section */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="grid md:grid-cols-2 items-stretch">
            {/* Left: Feature Description */}
            <div className="p-8 md:p-12 flex flex-col justify-center">
              <div className="flex items-center mb-4">
                <div className="mr-4">{features[activeTab].icon}</div>
                <h3 className="text-2xl font-bold text-gray-900">{features[activeTab].title}</h3>
              </div>
              
              <p className="text-gray-600 mb-6">{features[activeTab].description}</p>
              
              <ul className="space-y-3 mb-8">
                {activeTab === 0 && (
                  <>
                    <li className="flex items-start">
                      <svg className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-gray-700">99.7% accuracy in user identification</span>
                    </li>
                    <li className="flex items-start">
                      <svg className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-gray-700">Sub-second authentication time</span>
                    </li>
                    <li className="flex items-start">
                      <svg className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-gray-700">Advanced anti-spoofing technology</span>
                    </li>
                  </>
                )}
                {activeTab === 1 && (
                  <>
                    <li className="flex items-start">
                      <svg className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-gray-700">Natural language processing understands context</span>
                    </li>
                    <li className="flex items-start">
                      <svg className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-gray-700">Supports multiple languages and dialects</span>
                    </li>
                    <li className="flex items-start">
                      <svg className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-gray-700">Hands-free operation for warehouses and field work</span>
                    </li>
                  </>
                )}
                {activeTab === 2 && (
                  <>
                    <li className="flex items-start">
                      <svg className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-gray-700">Reduce inventory costs by up to 23%</span>
                    </li>
                    <li className="flex items-start">
                      <svg className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-gray-700">Accurate sales forecasting (95% confidence)</span>
                    </li>
                    <li className="flex items-start">
                      <svg className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-gray-700">Anomaly detection for fraud prevention</span>
                    </li>
                  </>
                )}
              </ul>
              
              <div>
                <a 
                  href="/demo" 
                  className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition"
                >
                  See it in action
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </a>
              </div>
            </div>
            
            {/* Right: Demo Visualization */}
            <div className="bg-gray-100 h-96 md:h-auto overflow-hidden relative">
              <div className="absolute inset-0 bg-gradient-to-tr from-blue-600/20 to-purple-600/20"></div>
              <div className="absolute inset-0 flex items-center justify-center p-6">
                <div className="bg-white rounded-lg shadow-xl overflow-hidden max-w-md w-full">
                  {activeTab === 0 && (
                    <div className="p-4">
                      <div className="h-48 bg-blue-50 rounded-md flex items-center justify-center mb-4">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      </div>
                      <div className="space-y-2 mb-4">
                        <div className="h-2 bg-blue-200 rounded-full w-3/4 animate-pulse"></div>
                        <div className="h-2 bg-blue-200 rounded-full animate-pulse"></div>
                        <div className="h-2 bg-blue-200 rounded-full w-5/6 animate-pulse"></div>
                      </div>
                      <div className="flex justify-between">
                        <div className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded-full">Verified</div>
                        <div className="text-xs text-gray-500">Login successful</div>
                      </div>
                    </div>
                  )}
                  
                  {activeTab === 1 && (
                    <div className="p-4">
                      <div className="h-12 bg-gray-100 rounded-md flex items-center px-4 mb-4">
                        <div className="w-full">
                          <div className="flex items-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-500 mr-3 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                            </svg>
                            <span className="text-gray-700 text-sm">Listening...</span>
                          </div>
                        </div>
                      </div>
                      <div className="space-y-3 mb-4">
                        <div className="flex">
                          <div className="bg-blue-100 rounded-tl-lg rounded-tr-lg rounded-br-lg px-4 py-2 text-sm text-gray-700">
                            "Show me sales for Q1 2023"
                          </div>
                        </div>
                        <div className="flex justify-end">
                          <div className="bg-blue-500 rounded-tl-lg rounded-tr-lg rounded-bl-lg px-4 py-2 text-sm text-white">
                            Displaying Q1 2023 sales data...
                          </div>
                        </div>
                      </div>
                      <div className="h-32 bg-gray-100 rounded-md flex items-center justify-center">
                        <div className="w-full px-4">
                          <div className="mb-2 flex justify-between">
                            <span className="text-xs text-gray-500">Q1 Sales</span>
                            <span className="text-xs font-medium">$847,392</span>
                          </div>
                          <div className="h-2 bg-blue-200 rounded-full">
                            <div className="h-2 bg-blue-600 rounded-full w-3/4"></div>
                          </div>
                          <div className="mt-4 grid grid-cols-3 gap-2">
                            <div className="h-2 bg-gray-200 rounded-full"></div>
                            <div className="h-2 bg-gray-200 rounded-full"></div>
                            <div className="h-2 bg-gray-200 rounded-full"></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {activeTab === 2 && (
                    <div className="p-4">
                      <div className="mb-3">
                        <h3 className="text-sm font-medium text-gray-700">Predictive Sales Forecast</h3>
                        <p className="text-xs text-gray-500">Next 3 months projection</p>
                      </div>
                      
                      <div className="h-48 flex items-end space-x-2 mb-4">
                        <div className="w-1/12 bg-gray-200 rounded-t h-20"></div>
                        <div className="w-1/12 bg-gray-200 rounded-t h-28"></div>
                        <div className="w-1/12 bg-gray-200 rounded-t h-16"></div>
                        <div className="w-1/12 bg-gray-200 rounded-t h-32"></div>
                        <div className="w-1/12 bg-gray-200 rounded-t h-24"></div>
                        <div className="w-1/12 bg-gray-200 rounded-t h-36"></div>
                        <div className="w-1/12 bg-gray-200 rounded-t h-28"></div>
                        <div className="w-1/12 bg-gray-200 rounded-t h-20"></div>
                        <div className="w-1/12 bg-blue-500 rounded-t h-24"></div>
                        <div className="w-1/12 bg-blue-400 rounded-t h-32 border-2 border-dashed border-blue-600"></div>
                        <div className="w-1/12 bg-blue-300 rounded-t h-40 border-2 border-dashed border-blue-600"></div>
                        <div className="w-1/12 bg-blue-200 rounded-t h-36 border-2 border-dashed border-blue-600"></div>
                      </div>
                      
                      <div className="bg-yellow-100 border-l-4 border-yellow-500 p-3">
                        <div className="flex">
                          <div className="flex-shrink-0">
                            <svg className="h-5 w-5 text-yellow-500" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                            </svg>
                          </div>
                          <div className="ml-3">
                            <p className="text-xs text-yellow-800">
                              Predicted 28% increase in Q3 sales. Consider increasing inventory.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AIFeatures;