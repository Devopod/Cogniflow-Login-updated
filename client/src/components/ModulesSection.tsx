import React from 'react';

const modules = [
  {
    id: 1,
    title: 'Finance & Accounting',
    description: 'Manage financial transactions, budgeting, tax compliance, and reporting with intelligent automation',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    color: 'blue',
    badge: 'Most Popular',
    features: ['Financial Reporting', 'Expense Management', 'Vendor Payments', 'Tax Compliance']
  },
  {
    id: 2,
    title: 'Inventory Management',
    description: 'Track inventory levels, stock movements, and optimize supply chain operations with AI predictions',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
      </svg>
    ),
    color: 'amber',
    badge: '',
    features: ['Stock Tracking', 'Barcode Scanning', 'Demand Forecasting', 'Vendor Management']
  },
  {
    id: 3,
    title: 'Human Resources',
    description: 'Streamline HR processes from recruitment to retirement with facial recognition for attendance',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    ),
    color: 'green',
    badge: 'AI-Powered',
    features: ['Facial Recognition', 'Payroll Management', 'Employee Onboarding', 'Performance Reviews']
  },
  {
    id: 4,
    title: 'Customer Management',
    description: 'Build stronger customer relationships with voice-activated CRM tools and intelligent insights',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
      </svg>
    ),
    color: 'indigo',
    badge: '',
    features: ['Voice Commands', 'Lead Scoring', 'Customer Insights', 'Sales Pipeline']
  }
];

const ModulesSection: React.FC = () => {
  return (
    <section className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Everything Your Business Needs
          </h2>
          <p className="text-xl text-gray-600">
            Our comprehensive ERP solution offers fully integrated modules that work seamlessly together
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {modules.map((module) => (
            <div key={module.id} className="module-card group">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${module.color === 'blue' ? 'bg-blue-100 text-blue-600' : module.color === 'amber' ? 'bg-amber-100 text-amber-600' : module.color === 'green' ? 'bg-green-100 text-green-600' : 'bg-indigo-100 text-indigo-600'} mb-5`}>
                {module.icon}
              </div>
              
              <div className="flex justify-between items-start mb-3">
                <h3 className="text-xl font-bold text-gray-900">{module.title}</h3>
                {module.badge && (
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${module.color === 'blue' ? 'bg-blue-100 text-blue-800' : module.color === 'amber' ? 'bg-amber-100 text-amber-800' : module.color === 'green' ? 'bg-green-100 text-green-800' : 'bg-indigo-100 text-indigo-800'}`}>
                    {module.badge}
                  </span>
                )}
              </div>
              
              <p className="text-gray-600 mb-5">{module.description}</p>
              
              <ul className="space-y-2 mb-4">
                {module.features.map((feature, index) => (
                  <li key={index} className="flex items-start">
                    <svg className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-gray-700 text-sm">{feature}</span>
                  </li>
                ))}
              </ul>
              
              <a
                href={`/modules/${module.title.toLowerCase().replace(/\s+/g, '-')}`}
                className="inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-800 group-hover:underline"
              >
                Explore Module
                <svg
                  className="ml-1 h-4 w-4 transform transition-transform group-hover:translate-x-1"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </a>
            </div>
          ))}
        </div>
        
        <div className="text-center mt-12">
          <a
            href="/modules"
            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            View All Modules
          </a>
        </div>
      </div>
    </section>
  );
};

export default ModulesSection;