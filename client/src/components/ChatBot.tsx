import React, { useState } from 'react';

const ChatBot: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      sender: 'bot',
      text: 'Hi there! I\'m your CogniFlow AI assistant. How can I help you today?'
    }
  ]);
  const [inputValue, setInputValue] = useState('');

  const toggleChat = () => {
    setIsOpen(!isOpen);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    // Add user message
    const updatedMessages = [
      ...messages,
      { sender: 'user', text: inputValue }
    ];
    setMessages(updatedMessages);
    setInputValue('');

    // Simulate bot response after a short delay
    setTimeout(() => {
      setMessages([
        ...updatedMessages,
        { 
          sender: 'bot', 
          text: getBotResponse(inputValue)
        }
      ]);
    }, 800);
  };

  const getBotResponse = (input: string): string => {
    const lowerInput = input.toLowerCase();
    
    if (lowerInput.includes('facial') || lowerInput.includes('detection') || lowerInput.includes('face')) {
      return "CogniFlow's facial detection technology streamlines employee attendance tracking with real-time check-ins, eliminates buddy punching, and provides mood analysis to help HR departments gauge team morale. Would you like to learn more about how it works or schedule a demo?";
    } else if (lowerInput.includes('mpesa') || lowerInput.includes('payment') || lowerInput.includes('mobile')) {
      return "Our MPESA integration allows businesses in East Africa to process mobile payments seamlessly, with automatic reconciliation and instant notifications. This reduces transaction times by up to 70% and improves customer satisfaction.";
    } else if (lowerInput.includes('price') || lowerInput.includes('cost') || lowerInput.includes('pricing')) {
      return "CogniFlow ERP offers flexible pricing plans starting with a forever-free plan for up to 5 users. For specific pricing details tailored to your business needs, I'd be happy to connect you with our sales team.";
    } else if (lowerInput.includes('demo') || lowerInput.includes('trial')) {
      return "You can start a free 14-day trial of CogniFlow ERP with full access to all features. No credit card required. Would you like me to guide you through the signup process?";
    } else {
      return "Thank you for your interest in CogniFlow ERP. I can provide information about our features, pricing, implementation process, or connect you with our sales team. What specific aspect would you like to know more about?";
    }
  };

  return (
    <div className="fixed bottom-8 right-8 z-30">
      <button 
        onClick={toggleChat}
        className="bg-primary text-white rounded-full w-16 h-16 flex items-center justify-center shadow-lg hover:bg-blue-700 transition-colors focus:outline-none"
        aria-label="Toggle chat"
      >
        <i className="fas fa-comments text-2xl"></i>
      </button>
      
      {isOpen && (
        <div className="absolute bottom-20 right-0 w-96 bg-white rounded-lg shadow-xl overflow-hidden">
          <div className="bg-primary text-white p-4 flex justify-between items-center">
            <h3 className="font-semibold">CogniFlow Assistant</h3>
            <button 
              onClick={toggleChat}
              className="text-white focus:outline-none"
              aria-label="Close chat"
            >
              <i className="fas fa-times"></i>
            </button>
          </div>
          
          <div className="p-4 h-80 overflow-y-auto bg-gray-50">
            {messages.map((message, index) => (
              <div key={index} className={`flex mb-4 ${message.sender === 'user' ? 'justify-end' : ''}`}>
                {message.sender === 'bot' && (
                  <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white mr-2 flex-shrink-0">
                    <i className="fas fa-robot text-sm"></i>
                  </div>
                )}
                <div className={`${message.sender === 'bot' ? 'bg-gray-200' : 'bg-primary text-white'} rounded-lg py-2 px-3 max-w-[80%]`}>
                  <p>{message.text}</p>
                </div>
                {message.sender === 'user' && (
                  <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center ml-2 flex-shrink-0">
                    <i className="fas fa-user text-sm text-gray-700"></i>
                  </div>
                )}
              </div>
            ))}
          </div>
          
          <form onSubmit={handleSubmit} className="p-4 border-t">
            <div className="flex">
              <input 
                type="text" 
                value={inputValue}
                onChange={handleInputChange}
                placeholder="Type your message..." 
                className="border rounded-l-lg px-4 py-2 w-full focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <button 
                type="submit"
                className="bg-primary text-white px-4 py-2 rounded-r-lg hover:bg-blue-700 transition-colors"
              >
                <i className="fas fa-paper-plane"></i>
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default ChatBot;
