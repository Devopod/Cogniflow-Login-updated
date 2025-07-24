import React, { useState, useEffect, useRef } from 'react';
import { testimonials } from '@/data/testimonials';

const Testimonials: React.FC = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  
  const visibleItems = () => {
    if (typeof window !== 'undefined') {
      return window.innerWidth >= 1200 ? 3 : window.innerWidth >= 768 ? 2 : 1;
    }
    return 1;
  };
  
  const [itemsShown, setItemsShown] = useState(visibleItems());
  const maxIndex = Math.max(0, testimonials.length - itemsShown);
  
  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      setItemsShown(visibleItems());
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  // Update container transformation
  useEffect(() => {
    if (containerRef.current) {
      const translateValue = -currentIndex * (100 / itemsShown);
      containerRef.current.style.transform = `translateX(${translateValue}%)`;
    }
  }, [currentIndex, itemsShown]);
  
  // Auto-advance carousel
  useEffect(() => {
    const startAutoPlay = () => {
      intervalRef.current = setInterval(() => {
        if (!isTransitioning) {
          setIsTransitioning(true);
          setCurrentIndex(prevIndex => {
            const nextIndex = prevIndex >= maxIndex ? 0 : prevIndex + 1;
            return nextIndex;
          });
          
          setTimeout(() => {
            setIsTransitioning(false);
          }, 700); // Slightly longer than transition duration
        }
      }, 5000);
    };
    
    startAutoPlay();
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [maxIndex, isTransitioning]);
  
  // Navigation functions
  const goToPrev = () => {
    if (isTransitioning) return;
    
    setIsTransitioning(true);
    setCurrentIndex(prev => Math.max(0, prev - 1));
    
    setTimeout(() => {
      setIsTransitioning(false);
    }, 500);
  };
  
  const goToNext = () => {
    if (isTransitioning) return;
    
    setIsTransitioning(true);
    setCurrentIndex(prev => prev >= maxIndex ? 0 : prev + 1);
    
    setTimeout(() => {
      setIsTransitioning(false);
    }, 500);
  };
  
  const goToSlide = (index: number) => {
    if (isTransitioning) return;
    
    setIsTransitioning(true);
    setCurrentIndex(Math.min(index, maxIndex));
    
    setTimeout(() => {
      setIsTransitioning(false);
    }, 500);
  };
  
  // Pause auto-advance on hover
  const handleMouseEnter = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };
  
  const handleMouseLeave = () => {
    if (!intervalRef.current) {
      intervalRef.current = setInterval(() => {
        if (!isTransitioning) {
          setIsTransitioning(true);
          setCurrentIndex(prevIndex => {
            const nextIndex = prevIndex >= maxIndex ? 0 : prevIndex + 1;
            return nextIndex;
          });
          
          setTimeout(() => {
            setIsTransitioning(false);
          }, 700);
        }
      }, 5000);
    }
  };
  
  return (
    <section className="py-16 md:py-24 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <span className="text-blue-600 font-medium text-sm uppercase tracking-wider">Customer Success Stories</span>
          <h2 className="section-title mt-2">What Our Customers Say</h2>
          <p className="section-subtitle">
            Real stories from businesses that transformed their operations with CogniFlow ERP
          </p>
        </div>

        <div 
          className="relative mx-auto max-w-6xl" 
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          <div className="testimonial-carousel overflow-hidden rounded-lg">
            <div 
              ref={containerRef}
              className="flex transition-transform duration-500 ease-in-out" 
              style={{ transform: `translateX(-${currentIndex * (100 / itemsShown)}%)` }}
            >
              {testimonials.map(testimonial => (
                <div key={testimonial.id} className="w-full md:w-1/2 lg:w-1/3 flex-shrink-0 px-4 py-2">
                  <div className="testimonial-card bg-white rounded-xl shadow-md hover:shadow-lg p-8 h-full border border-gray-100">
                    {/* Rating Stars */}
                    <div className="flex items-center mb-6">
                      <div className="text-yellow-400 flex">
                        {[...Array(5)].map((_, i) => (
                          <span key={i}>
                            {i < Math.floor(testimonial.rating) ? (
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                              </svg>
                            ) : i === Math.floor(testimonial.rating) && testimonial.rating % 1 !== 0 ? (
                              <span className="relative">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-300" viewBox="0 0 20 20" fill="currentColor">
                                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                </svg>
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-2.5 absolute left-0 top-0 overflow-hidden" viewBox="0 0 20 20" fill="currentColor">
                                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                </svg>
                              </span>
                            ) : (
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-300" viewBox="0 0 20 20" fill="currentColor">
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                              </svg>
                            )}
                          </span>
                        ))}
                      </div>
                      <span className="ml-2 text-gray-500 text-sm font-medium">{testimonial.rating.toFixed(1)}</span>
                    </div>
                    
                    {/* Quote */}
                    <blockquote className="text-gray-700 mb-8 italic text-base leading-relaxed">
                      "{testimonial.quote}"
                    </blockquote>
                    
                    {/* Customer Info */}
                    <div className="flex items-center mt-auto">
                      {testimonial.image ? (
                        <img 
                          src={testimonial.image} 
                          alt={testimonial.name}
                          className="w-12 h-12 rounded-full object-cover mr-4 border-2 border-blue-100"
                        />
                      ) : (
                        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mr-4 text-blue-600 font-bold text-xl">
                          {testimonial.name?.charAt(0) || 'T'}
                        </div>
                      )}
                      <div>
                        <p className="font-semibold text-gray-800">{testimonial.name}</p>
                        <p className="text-gray-500 text-sm">{testimonial.company}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Navigation Controls - Arrows */}
          <button 
            className={`absolute top-1/2 -left-4 transform -translate-y-1/2 bg-white rounded-full p-3 shadow-lg text-gray-800 hover:text-blue-600 focus:outline-none z-10 border border-gray-100 transition-all duration-300 hover:shadow-xl ${currentIndex === 0 && !isTransitioning ? 'opacity-50 cursor-not-allowed hover:text-gray-800' : ''}`}
            onClick={goToPrev}
            disabled={currentIndex === 0 && !isTransitioning}
            aria-label="Previous testimonial"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button 
            className={`absolute top-1/2 -right-4 transform -translate-y-1/2 bg-white rounded-full p-3 shadow-lg text-gray-800 hover:text-blue-600 focus:outline-none z-10 border border-gray-100 transition-all duration-300 hover:shadow-xl ${currentIndex === maxIndex && !isTransitioning ? 'opacity-50 cursor-not-allowed hover:text-gray-800' : ''}`}
            onClick={goToNext}
            disabled={currentIndex === maxIndex && !isTransitioning}
            aria-label="Next testimonial"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        {/* Navigation Controls - Dots */}
        <div className="flex justify-center mt-12">
          <div className="flex items-center space-x-3">
            {testimonials.slice(0, maxIndex + 1).map((_, index) => (
              <button 
                key={index}
                className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                  index === currentIndex 
                    ? 'bg-blue-600 w-8' 
                    : 'bg-gray-300 hover:bg-gray-400'
                }`}
                onClick={() => goToSlide(index)}
                aria-label={`Go to testimonial ${index + 1}`}
              ></button>
            ))}
          </div>
        </div>
        
        {/* Call to action */}
        <div className="mt-16 text-center">
          <a href="#" className="btn-outline">
            Read More Success Stories
          </a>
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
