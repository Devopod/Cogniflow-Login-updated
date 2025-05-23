import React, { useState, useEffect } from 'react';

const CookieConsent: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check if user has already accepted or rejected cookies
    const consentStatus = localStorage.getItem('cookie-consent');
    if (!consentStatus) {
      setIsVisible(true);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('cookie-consent', 'accepted');
    setIsVisible(false);
    // Here you could also trigger actual cookie setting logic
  };

  const handleReject = () => {
    localStorage.setItem('cookie-consent', 'rejected');
    setIsVisible(false);
    // Here you could implement logic to ensure no tracking cookies are used
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-0 left-0 w-full bg-gray-800 text-white p-4 z-50 flex justify-between items-center">
      <p className="text-sm">We use cookies to enhance your experience. By continuing to visit this site you agree to our use of cookies.</p>
      <div className="flex space-x-2">
        <button 
          onClick={handleAccept}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm"
        >
          Accept
        </button>
        <button 
          onClick={handleReject}
          className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded text-sm"
        >
          Reject
        </button>
      </div>
    </div>
  );
};

export default CookieConsent;
