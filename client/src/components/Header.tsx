import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'wouter';
import MegaMenu from '@/components/navigation/MegaMenu';
import { moduleData } from '@/data/modules';

type NavMenuItem = 'products' | 'solutions' | 'resources' | 'company' | null;

const Header: React.FC = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeMobileMenu, setActiveMobileMenu] = useState<NavMenuItem>(null);
  const [activeDesktopMenu, setActiveDesktopMenu] = useState<NavMenuItem>(null);
  
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };
    
    window.addEventListener('scroll', handleScroll);
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);
  
  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
    if (mobileMenuOpen) {
      setActiveMobileMenu(null);
    }
  };
  
  const toggleMobileSubmenu = (menu: NavMenuItem) => {
    setActiveMobileMenu(activeMobileMenu === menu ? null : menu);
  };
  
  const toggleDesktopMenu = (menu: NavMenuItem) => {
    setActiveDesktopMenu(activeDesktopMenu === menu ? null : menu);
  };
  
  // Close desktop menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (activeDesktopMenu && 
          !(event.target as HTMLElement).closest(`.nav-item-${activeDesktopMenu}`) && 
          !(event.target as HTMLElement).closest('.mega-menu')) {
        setActiveDesktopMenu(null);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [activeDesktopMenu]);

  return (
    <header className={`sticky top-0 z-50 bg-white transition-shadow duration-300 ${scrolled ? 'shadow-md' : 'border-b border-gray-100'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 md:h-20">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-3">
              <img 
                src="/assets/logo.ico" 
                alt="CogniFlow Logo" 
                className="h-9 w-auto"
              />
              <span className="text-blue-600 font-bold text-xl md:text-2xl tracking-tight">CogniFlow ERP</span>
            </Link>
          </div>

          {/* Navigation - Desktop */}
          <nav className="hidden lg:flex items-center space-x-6">
            {/* Products Menu - Replaced with Zoho-style MegaMenu */}
            <div className="relative nav-item nav-item-products">
              <div className="py-1">
                <MegaMenu modules={moduleData} />
              </div>
            </div>
            
            {/* Solutions Menu */}
            <div className={`relative nav-item nav-item-solutions ${activeDesktopMenu === 'solutions' ? 'active' : ''}`}>
              <button 
                onClick={() => toggleDesktopMenu('solutions')}
                className="flex items-center space-x-1 py-2 text-gray-700 hover:text-blue-600 font-medium transition duration-150"
              >
                <span>Solutions</span>
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  className={`h-4 w-4 ml-1 transition-transform duration-200 ${activeDesktopMenu === 'solutions' ? 'rotate-180' : ''}`}
                  viewBox="0 0 20 20" 
                  fill="currentColor"
                >
                  <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
              <div className={`mega-menu ${activeDesktopMenu === 'solutions' ? 'visible opacity-100' : 'invisible opacity-0'} transition-all duration-300 ease-in-out bg-white shadow-xl rounded-lg absolute top-full left-1/2 transform -translate-x-1/2 w-[600px] z-50`}>
                <div className="grid grid-cols-2 gap-6 p-8">
                  <div>
                    <h3 className="font-semibold text-lg mb-3 text-blue-700">By Industry</h3>
                    <ul className="space-y-2">
                      <li><a href="#" className="text-gray-600 hover:text-blue-600 flex items-center text-sm"><span className="w-6 text-amber-600 mr-2"><i className="fas fa-hard-hat"></i></span> Construction</a></li>
                      <li><a href="#" className="text-gray-600 hover:text-blue-600 flex items-center text-sm"><span className="w-6 text-fuchsia-500 mr-2"><i className="fas fa-store"></i></span> Retail</a></li>
                      <li><a href="#" className="text-gray-600 hover:text-blue-600 flex items-center text-sm"><span className="w-6 text-slate-600 mr-2"><i className="fas fa-industry"></i></span> Manufacturing</a></li>
                      <li><a href="#" className="text-gray-600 hover:text-blue-600 flex items-center text-sm"><span className="w-6 text-emerald-500 mr-2"><i className="fas fa-concierge-bell"></i></span> Services</a></li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-3 text-blue-700">By Size</h3>
                    <ul className="space-y-2">
                      <li><a href="#" className="text-gray-600 hover:text-blue-600 flex items-center text-sm"><span className="w-6 text-rose-500 mr-2"><i className="fas fa-rocket"></i></span> Startups</a></li>
                      <li><a href="#" className="text-gray-600 hover:text-blue-600 flex items-center text-sm"><span className="w-6 text-purple-600 mr-2"><i className="fas fa-building"></i></span> Small Business</a></li>
                      <li><a href="#" className="text-gray-600 hover:text-blue-600 flex items-center text-sm"><span className="w-6 text-indigo-600 mr-2"><i className="fas fa-city"></i></span> Enterprise</a></li>
                    </ul>
                  </div>
                </div>
                <div className="bg-gray-50 p-4 rounded-b-lg">
                  <a href="/solutions" className="text-blue-600 hover:text-blue-800 font-medium flex items-center justify-center text-sm">
                    View all solutions <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </a>
                </div>
              </div>
            </div>
            
            {/* Pricing Link */}
            <a href="/pricing" className="py-2 text-gray-700 hover:text-blue-600 font-medium transition duration-150">Pricing</a>
            
            {/* Resources Menu */}
            <div className={`relative nav-item nav-item-resources ${activeDesktopMenu === 'resources' ? 'active' : ''}`}>
              <button 
                onClick={() => toggleDesktopMenu('resources')}
                className="flex items-center space-x-1 py-2 text-gray-700 hover:text-blue-600 font-medium transition duration-150"
              >
                <span>Resources</span>
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  className={`h-4 w-4 ml-1 transition-transform duration-200 ${activeDesktopMenu === 'resources' ? 'rotate-180' : ''}`}
                  viewBox="0 0 20 20" 
                  fill="currentColor"
                >
                  <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
              <div className={`mega-menu ${activeDesktopMenu === 'resources' ? 'visible opacity-100' : 'invisible opacity-0'} transition-all duration-300 ease-in-out bg-white shadow-xl rounded-lg absolute top-full left-1/2 transform -translate-x-1/2 w-[600px] z-50`}>
                <div className="grid grid-cols-3 gap-4 p-6">
                  <div>
                    <h3 className="font-semibold text-base mb-2 text-blue-700">Learn</h3>
                    <ul className="space-y-2">
                      <li><a href="#" className="text-gray-600 hover:text-blue-600 flex items-center text-sm"><span className="w-5 text-orange-500 mr-2"><i className="fas fa-rss"></i></span> Blog</a></li>
                      <li><a href="#" className="text-gray-600 hover:text-blue-600 flex items-center text-sm"><span className="w-5 text-red-500 mr-2"><i className="fas fa-video"></i></span> Webinars</a></li>
                      <li><a href="#" className="text-gray-600 hover:text-blue-600 flex items-center text-sm"><span className="w-5 text-green-500 mr-2"><i className="fas fa-book"></i></span> eBooks</a></li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="font-semibold text-base mb-2 text-blue-700">Support</h3>
                    <ul className="space-y-2">
                      <li><a href="#" className="text-gray-600 hover:text-blue-600 flex items-center text-sm"><span className="w-5 text-purple-500 mr-2"><i className="fas fa-question-circle"></i></span> Help Center</a></li>
                      <li><a href="#" className="text-gray-600 hover:text-blue-600 flex items-center text-sm"><span className="w-5 text-sky-500 mr-2"><i className="fas fa-comments"></i></span> Community Forum</a></li>
                      <li><a href="#" className="text-gray-600 hover:text-blue-600 flex items-center text-sm"><span className="w-5 text-slate-500 mr-2"><i className="fas fa-file-alt"></i></span> Documentation</a></li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="font-semibold text-base mb-2 text-blue-700">Tools</h3>
                    <ul className="space-y-2">
                      <li><a href="#" className="text-gray-600 hover:text-blue-600 flex items-center text-sm"><span className="w-5 text-yellow-500 mr-2"><i className="fas fa-calculator"></i></span> ROI Calculator</a></li>
                      <li><a href="#" className="text-gray-600 hover:text-blue-600 flex items-center text-sm"><span className="w-5 text-teal-500 mr-2"><i className="fas fa-code"></i></span> API Documentation</a></li>
                      <li><a href="#" className="text-gray-600 hover:text-blue-600 flex items-center text-sm"><span className="w-5 text-cyan-500 mr-2"><i className="fas fa-plug"></i></span> Integration Guide</a></li>
                    </ul>
                  </div>
                </div>
                <div className="bg-gray-50 p-4 rounded-b-lg">
                  <a href="/resources" className="text-blue-600 hover:text-blue-800 font-medium flex items-center justify-center text-sm">
                    View all resources <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </a>
                </div>
              </div>
            </div>
            
            {/* Company Menu */}
            <div className={`relative nav-item nav-item-company ${activeDesktopMenu === 'company' ? 'active' : ''}`}>
              <button 
                onClick={() => toggleDesktopMenu('company')}
                className="flex items-center space-x-1 py-2 text-gray-700 hover:text-blue-600 font-medium transition duration-150"
              >
                <span>Company</span>
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  className={`h-4 w-4 ml-1 transition-transform duration-200 ${activeDesktopMenu === 'company' ? 'rotate-180' : ''}`}
                  viewBox="0 0 20 20" 
                  fill="currentColor"
                >
                  <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
              <div className={`mega-menu ${activeDesktopMenu === 'company' ? 'visible opacity-100' : 'invisible opacity-0'} transition-all duration-300 ease-in-out bg-white shadow-xl rounded-lg absolute top-full right-0 transform translate-x-8 w-[300px] z-50`}>
                <div className="p-6">
                  <ul className="space-y-4">
                    <li><a href="#" className="text-gray-600 hover:text-blue-600 flex items-center text-sm"><span className="w-6 text-purple-500 mr-2"><i className="fas fa-building"></i></span> About Us</a></li>
                    <li><a href="#" className="text-gray-600 hover:text-blue-600 flex items-center text-sm"><span className="w-6 text-blue-500 mr-2"><i className="fas fa-users"></i></span> Our Team</a></li>
                    <li><a href="#" className="text-gray-600 hover:text-blue-600 flex items-center text-sm"><span className="w-6 text-green-500 mr-2"><i className="fas fa-newspaper"></i></span> News & Press</a></li>
                    <li><a href="#" className="text-gray-600 hover:text-blue-600 flex items-center text-sm"><span className="w-6 text-yellow-500 mr-2"><i className="fas fa-briefcase"></i></span> Careers</a></li>
                    <li><a href="#" className="text-gray-600 hover:text-blue-600 flex items-center text-sm"><span className="w-6 text-red-500 mr-2"><i className="fas fa-handshake"></i></span> Partners</a></li>
                    <li><a href="#" className="text-gray-600 hover:text-blue-600 flex items-center text-sm"><span className="w-6 text-teal-500 mr-2"><i className="fas fa-envelope"></i></span> Contact Us</a></li>
                  </ul>
                </div>
              </div>
            </div>
          </nav>
          
          {/* Action Buttons - Desktop */}
          <div className="hidden lg:flex items-center space-x-4">
            <a href="/auth" className="text-gray-700 hover:text-blue-600 font-medium">Login</a>
            <a href="/auth" className="bg-blue-600 text-white px-5 py-2 rounded-md hover:bg-blue-700 transition duration-300 font-medium text-sm">Get Started</a>
          </div>
          
          {/* Mobile Menu Button */}
          <div className="lg:hidden flex items-center">
            <button
              onClick={toggleMobileMenu}
              className="text-gray-500 hover:text-blue-600 focus:outline-none"
            >
              {mobileMenuOpen ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>
      
      {/* Mobile Menu */}
      <div 
        className={`lg:hidden ${mobileMenuOpen ? 'max-h-screen opacity-100' : 'max-h-0 opacity-0 invisible'} transition-all duration-300 ease-in-out overflow-hidden bg-white`}
        style={{ maxHeight: mobileMenuOpen ? '100vh' : '0' }}
      >
        <div className="px-4 py-3 space-y-3 border-t border-gray-100">
          <div>
            <button
              onClick={() => toggleMobileSubmenu('products')}
              className="flex justify-between items-center w-full py-2 text-gray-700 font-medium"
            >
              <span>Products</span>
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                className={`h-4 w-4 transition-transform duration-200 ${activeMobileMenu === 'products' ? 'rotate-180' : ''}`}
                viewBox="0 0 20 20" 
                fill="currentColor"
              >
                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
            <div 
              className={`mt-2 pl-4 space-y-2 ${activeMobileMenu === 'products' ? 'block' : 'hidden'}`}
            >
              <div className="mb-3">
                <h3 className="font-semibold text-md mb-2 text-blue-700">Core Modules</h3>
                <ul className="space-y-2 pl-2">
                  <li><a href="#" className="text-gray-600 hover:text-blue-600 flex items-center text-sm"><span className="w-6 text-green-500 mr-2"><i className="fas fa-chart-line"></i></span> Sales Management</a></li>
                  <li><a href="#" className="text-gray-600 hover:text-blue-600 flex items-center text-sm"><span className="w-6 text-purple-500 mr-2"><i className="fas fa-boxes"></i></span> Inventory Management</a></li>
                </ul>
              </div>
              <div className="mb-3">
                <h3 className="font-semibold text-md mb-2 text-blue-700">Business Functions</h3>
                <ul className="space-y-2 pl-2">
                  <li><a href="#" className="text-gray-600 hover:text-blue-600 flex items-center text-sm"><span className="w-6 text-teal-500 mr-2"><i className="fas fa-users"></i></span> Customers Management</a></li>
                  <li><a href="#" className="text-gray-600 hover:text-blue-600 flex items-center text-sm"><span className="w-6 text-indigo-500 mr-2"><i className="fas fa-truck"></i></span> Suppliers Management</a></li>
                </ul>
              </div>
              <a href="/products" className="block text-blue-600 hover:text-blue-800 font-medium pt-2">View all modules →</a>
            </div>
          </div>
          
          <div>
            <button
              onClick={() => toggleMobileSubmenu('solutions')}
              className="flex justify-between items-center w-full py-2 text-gray-700 font-medium"
            >
              <span>Solutions</span>
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                className={`h-4 w-4 transition-transform duration-200 ${activeMobileMenu === 'solutions' ? 'rotate-180' : ''}`}
                viewBox="0 0 20 20" 
                fill="currentColor"
              >
                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
            <div 
              className={`mt-2 pl-4 space-y-2 ${activeMobileMenu === 'solutions' ? 'block' : 'hidden'}`}
            >
              <div className="mb-3">
                <h3 className="font-semibold text-md mb-2 text-blue-700">By Industry</h3>
                <ul className="space-y-2 pl-2">
                  <li><a href="#" className="text-gray-600 hover:text-blue-600 flex items-center text-sm"><span className="w-6 text-amber-600 mr-2"><i className="fas fa-hard-hat"></i></span> Construction</a></li>
                  <li><a href="#" className="text-gray-600 hover:text-blue-600 flex items-center text-sm"><span className="w-6 text-fuchsia-500 mr-2"><i className="fas fa-store"></i></span> Retail</a></li>
                </ul>
              </div>
              <div className="mb-3">
                <h3 className="font-semibold text-md mb-2 text-blue-700">By Size</h3>
                <ul className="space-y-2 pl-2">
                  <li><a href="#" className="text-gray-600 hover:text-blue-600 flex items-center text-sm"><span className="w-6 text-rose-500 mr-2"><i className="fas fa-rocket"></i></span> Startups</a></li>
                  <li><a href="#" className="text-gray-600 hover:text-blue-600 flex items-center text-sm"><span className="w-6 text-purple-600 mr-2"><i className="fas fa-building"></i></span> Small Business</a></li>
                </ul>
              </div>
              <a href="/solutions" className="block text-blue-600 hover:text-blue-800 font-medium pt-2">View all solutions →</a>
            </div>
          </div>
          
          <div>
            <a href="/pricing" className="block py-2 text-gray-700 font-medium">Pricing</a>
          </div>
          
          <div>
            <button
              onClick={() => toggleMobileSubmenu('resources')}
              className="flex justify-between items-center w-full py-2 text-gray-700 font-medium"
            >
              <span>Resources</span>
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                className={`h-4 w-4 transition-transform duration-200 ${activeMobileMenu === 'resources' ? 'rotate-180' : ''}`}
                viewBox="0 0 20 20" 
                fill="currentColor"
              >
                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
            <div 
              className={`mt-2 pl-4 space-y-2 ${activeMobileMenu === 'resources' ? 'block' : 'hidden'}`}
            >
              <div className="mb-3">
                <h3 className="font-semibold text-md mb-2 text-blue-700">Learn</h3>
                <ul className="space-y-2 pl-2">
                  <li><a href="#" className="text-gray-600 hover:text-blue-600 flex items-center text-sm"><span className="w-6 text-orange-500 mr-2"><i className="fas fa-rss"></i></span> Blog</a></li>
                  <li><a href="#" className="text-gray-600 hover:text-blue-600 flex items-center text-sm"><span className="w-6 text-red-500 mr-2"><i className="fas fa-video"></i></span> Webinars</a></li>
                </ul>
              </div>
              <a href="/resources" className="block text-blue-600 hover:text-blue-800 font-medium pt-2">View all resources →</a>
            </div>
          </div>
          
          <div>
            <button
              onClick={() => toggleMobileSubmenu('company')}
              className="flex justify-between items-center w-full py-2 text-gray-700 font-medium"
            >
              <span>Company</span>
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                className={`h-4 w-4 transition-transform duration-200 ${activeMobileMenu === 'company' ? 'rotate-180' : ''}`}
                viewBox="0 0 20 20" 
                fill="currentColor"
              >
                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
            <div 
              className={`mt-2 pl-4 space-y-2 ${activeMobileMenu === 'company' ? 'block' : 'hidden'}`}
            >
              <ul className="space-y-2 pl-2">
                <li><a href="#" className="text-gray-600 hover:text-blue-600 flex items-center text-sm"><span className="w-6 text-purple-500 mr-2"><i className="fas fa-building"></i></span> About Us</a></li>
                <li><a href="#" className="text-gray-600 hover:text-blue-600 flex items-center text-sm"><span className="w-6 text-blue-500 mr-2"><i className="fas fa-users"></i></span> Our Team</a></li>
                <li><a href="#" className="text-gray-600 hover:text-blue-600 flex items-center text-sm"><span className="w-6 text-teal-500 mr-2"><i className="fas fa-envelope"></i></span> Contact Us</a></li>
              </ul>
            </div>
          </div>
          
          <div className="pt-4 border-t border-gray-100 flex flex-col space-y-3">
            <a href="/auth" className="py-2 text-center text-gray-700 font-medium border border-gray-300 rounded-md hover:bg-gray-50 transition duration-150">Login</a>
            <a href="/auth" className="py-2 text-center text-white font-medium bg-blue-600 rounded-md hover:bg-blue-700 transition duration-150">Get Started</a>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;