export interface Testimonial {
  id: number;
  quote: string;
  name: string;
  company: string;
  rating: number;
  image: string;
}

export const testimonials: Testimonial[] = [
  {
    id: 1,
    quote: "Facial detection technology revolutionized our HR processes. Employee check-ins are now seamless, and the mood analysis helps us gauge team morale in real-time.",
    name: "John Doe",
    company: "TechBuild Inc.",
    rating: 5,
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&h=150&q=80"
  },
  {
    id: 2,
    quote: "The MPESA integration streamlined our payment processes in East Africa. We've reduced transaction times by 70% and improved customer satisfaction dramatically.",
    name: "Aisha Khan",
    company: "RetailPro",
    rating: 4.5,
    image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&h=150&q=80"
  },
  {
    id: 3,
    quote: "The inventory management system saved us 30% in costs. The real-time stock tracking and automatic re-ordering have eliminated stockouts completely.",
    name: "Rahul Sharma",
    company: "ManuFacture Co.",
    rating: 4.8,
    image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&h=150&q=80"
  },
  {
    id: 4,
    quote: "The AI-powered reports and dashboards are game-changing. We now have real-time insights that help us make better business decisions every day.",
    name: "Emily Chen",
    company: "ServiceNow Ltd.",
    rating: 4.7,
    image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=150&h=150&q=80"
  },
  {
    id: 5,
    quote: "CogniFlow ERP provides a secure and user-friendly platform for our construction business. The tight security features give us peace of mind while managing sensitive data.",
    name: "Omar Ali",
    company: "BuildEasy",
    rating: 5,
    image: "https://images.unsplash.com/photo-1566492031773-4f4e44671857?auto=format&fit=crop&w=150&h=150&q=80"
  }
];
