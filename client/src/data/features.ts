export interface Feature {
  id: number;
  title: string;
  description: string;
  icon: string;
  color?: string;
}

export const features: Feature[] = [
  { 
    id: 1, 
    title: "AI-Powered Automation", 
    description: "Save time with smart workflows, predictive analytics, and automated invoicing.", 
    icon: "robot",
    color: "purple-600"
  },
  { 
    id: 2, 
    title: "Voice & Facial Recognition Integration", 
    description: "Modern user onboarding and HR automation with cutting-edge AI.", 
    icon: "camera",
    color: "teal-600"
  },
  { 
    id: 3, 
    title: "Real-Time Business Insights", 
    description: "Make faster, smarter decisions with AI-driven sales, finance, and inventory analytics.", 
    icon: "chart-line",
    color: "green-600" 
  },
  { 
    id: 4, 
    title: "Modular ERP for Every Industry", 
    description: "Scalable architecture designed for construction, retail, manufacturing, and more.", 
    icon: "puzzle-piece",
    color: "indigo-600"
  },
  { 
    id: 5, 
    title: "Smart CRM with Lead Intelligence", 
    description: "Chatbots, segmentation, and real-time engagement for better conversions.", 
    icon: "users",
    color: "pink-600"
  },
  { 
    id: 6, 
    title: "Secure, Scalable, and Cloud-Ready", 
    description: "JWT security, Dockerized deployment, and AWS cloud compatibility.", 
    icon: "shield-alt",
    color: "red-600"
  },
  { 
    id: 7, 
    title: "MPESA & Local Payment Integration", 
    description: "Regional payment support built-in for seamless transactions.", 
    icon: "money-bill-wave",
    color: "amber-600"
  },
  { 
    id: 8, 
    title: "Low-Cost, High-Impact ERP", 
    description: "Enterprise features at startup-friendly pricing — no hidden fees, full ownership.", 
    icon: "rocket",
    color: "cyan-600"
  }
];
