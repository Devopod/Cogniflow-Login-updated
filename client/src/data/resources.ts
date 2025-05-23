export interface Resource {
  id: number;
  title: string;
  description: string;
  icon: string;
  items: ResourceItem[];
}

export interface ResourceItem {
  id: number;
  title: string;
  tag: string;
  tagColor: string;
}

export const resources: Resource[] = [
  {
    id: 1,
    title: "Webinars",
    description: "Join our live sessions with industry experts and learn how to leverage CogniFlow ERP for your business.",
    icon: "video",
    items: [
      {
        id: 1,
        title: "Facial Detection for Modern HR Departments",
        tag: "Upcoming - May 20, 2025",
        tagColor: "text-blue-600"
      },
      {
        id: 2,
        title: "Optimizing Inventory Management in Retail",
        tag: "On-demand",
        tagColor: "text-blue-600"
      },
      {
        id: 3,
        title: "Construction ERP: Best Practices",
        tag: "On-demand",
        tagColor: "text-blue-600"
      }
    ]
  },
  {
    id: 2,
    title: "eBooks",
    description: "Download comprehensive guides on how to implement and optimize your ERP system.",
    icon: "book",
    items: [
      {
        id: 1,
        title: "AI-Driven ERP: The Complete Guide",
        tag: "New Release",
        tagColor: "text-green-600"
      },
      {
        id: 2,
        title: "Implementing Facial Detection in Your Business",
        tag: "Popular",
        tagColor: "text-blue-600"
      },
      {
        id: 3,
        title: "Mobile Payments in East Africa: MPESA Guide",
        tag: "Featured",
        tagColor: "text-blue-600"
      }
    ]
  },
  {
    id: 3,
    title: "Community",
    description: "Join our vibrant community of CogniFlow ERP users to share experiences and best practices.",
    icon: "users",
    items: [
      {
        id: 1,
        title: "Best Practices for Inventory Management",
        tag: "Active Discussion",
        tagColor: "text-blue-600"
      },
      {
        id: 2,
        title: "Facial Detection Privacy Considerations",
        tag: "Hot Topic",
        tagColor: "text-orange-600"
      },
      {
        id: 3,
        title: "Success Stories: Manufacturing Implementations",
        tag: "User Showcase",
        tagColor: "text-blue-600"
      }
    ]
  }
];
