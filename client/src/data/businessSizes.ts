export interface BusinessSize {
  id: number;
  title: string;
  description: string;
  icon: string;
  highlight: string;
  highlightColor: string;
}

export const businessSizes: BusinessSize[] = [
  {
    id: 1,
    title: "Startups",
    description: "Affordable ERP solutions to help startups scale efficiently with minimal overhead.",
    icon: "rocket",
    highlight: "Free plan available for teams up to 5 users",
    highlightColor: "text-green-600"
  },
  {
    id: 2,
    title: "Small Business",
    description: "Comprehensive solutions designed specifically for the needs of small businesses.",
    icon: "building",
    highlight: "Most popular choice for growing teams",
    highlightColor: "text-blue-600"
  },
  {
    id: 3,
    title: "Enterprise",
    description: "Robust and scalable solutions for large organizations with complex requirements.",
    icon: "city",
    highlight: "Custom implementation and dedicated support",
    highlightColor: "text-purple-600"
  }
];
