import React from 'react';
import Header from '@/components/Header';
import Hero from '@/components/Hero';
import Features from '@/components/Features';
import AIFeatures from '@/components/AIFeatures';
import ModulesSection from '@/components/ModulesSection';
import ComparisonTable from '@/components/ComparisonTable';
import Testimonials from '@/components/Testimonials';
import Solutions from '@/components/Solutions';
import Blog from '@/components/Blog';
import Resources from '@/components/Resources';
import CTA from '@/components/CTA';
import Footer from '@/components/Footer';
import ChatBot from '@/components/ChatBot';
import CookieConsent from '@/components/CookieConsent';

const Home: React.FC = () => {
  return (
    <div className="min-h-screen bg-white">
      <Header />
      <Hero />
      <Features />
      <ModulesSection />
      <AIFeatures />
      <ComparisonTable />
      <Testimonials />
      <Solutions />
      <Blog />
      <Resources />
      <CTA />
      <Footer />
      <ChatBot />
      <CookieConsent />
    </div>
  );
};

export default Home;
