export interface Industry {
  id: number;
  title: string;
  description: string;
  icon: string;
  features: string[];
}

export const industries: Industry[] = [
  {
    id: 1,
    title: "Construction",
    description: "Manage projects, materials, equipment, and labor with specialized modules for the construction industry.",
    icon: "hard-hat",
    features: [
      "BOM and materials tracking",
      "Equipment management",
      "Project progress monitoring"
    ]
  },
  {
    id: 2,
    title: "Retail",
    description: "Streamline inventory, sales, and customer management for retail businesses of all sizes.",
    icon: "store",
    features: [
      "Point of sale integration",
      "Multi-store inventory",
      "Loyalty program management"
    ]
  },
  {
    id: 3,
    title: "Manufacturing",
    description: "Optimize production, supply chain, and inventory for manufacturing businesses.",
    icon: "industry",
    features: [
      "Production planning",
      "Raw materials management",
      "Quality control tracking"
    ]
  },
  {
    id: 4,
    title: "Services",
    description: "Manage clients, projects, and resources for service-based businesses.",
    icon: "concierge-bell",
    features: [
      "Time and billing",
      "Resource allocation",
      "Client portal access"
    ]
  }
];
