export interface BlogPost {
  id: number;
  title: string;
  summary: string;
  category: string;
  categoryColor: string;
  date: string;
  image: string;
}

export const blogPosts: BlogPost[] = [
  {
    id: 1,
    title: "How AI is Transforming the ERP Landscape",
    summary: "Discover how artificial intelligence is revolutionizing ERP systems and driving business efficiency.",
    category: "AI Insights",
    categoryColor: "bg-blue-600",
    date: "May 15, 2025",
    image: "https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=800&h=500&q=80"
  },
  {
    id: 2,
    title: "Facial Detection: The Future of HR Management",
    summary: "Learn how facial detection technology is streamlining attendance tracking and improving employee experience.",
    category: "Technology",
    categoryColor: "bg-green-600",
    date: "May 8, 2025",
    image: "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=800&h=500&q=80"
  },
  {
    id: 3,
    title: "5 Ways MPESA Integration Boosts East African Businesses",
    summary: "Discover how mobile payment integration is transforming business operations across East Africa.",
    category: "Payments",
    categoryColor: "bg-orange-600",
    date: "May 3, 2025",
    image: "https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&w=800&h=500&q=80"
  },
  {
    id: 4,
    title: "Construction Industry ERP: Building for the Future",
    summary: "How modern ERP solutions are helping construction companies improve project management and profitability.",
    category: "Industry",
    categoryColor: "bg-purple-600",
    date: "April 28, 2025",
    image: "https://images.unsplash.com/photo-1576267423048-15c0040fec78?auto=format&fit=crop&w=800&h=500&q=80"
  }
];
