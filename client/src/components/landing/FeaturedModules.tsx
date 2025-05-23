import { ChevronRight } from "lucide-react";
import { Link } from "wouter";

interface ModuleCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  path: string;
}

const ModuleCard = ({ icon, title, description, path }: ModuleCardProps) => {
  return (
    <div className="flex items-start p-4 hover:bg-gray-50 rounded-lg transition-all group">
      <div className="mr-4 text-primary">{icon}</div>
      <div className="flex-1">
        <h3 className="font-medium text-gray-900 mb-1">{title}</h3>
        <p className="text-sm text-gray-600 mb-2">{description}</p>
        <Link href={path} className="inline-flex items-center text-sm text-primary hover:underline">
          Learn more <ChevronRight className="ml-1 h-3 w-3" />
        </Link>
      </div>
    </div>
  );
};

export default function FeaturedModules() {
  return (
    <div className="bg-white py-16">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <h2 className="text-3xl font-bold mb-6">Featured Modules</h2>
            <p className="text-gray-600 mb-8">
              Powerful tools designed to streamline your business operations and
              boost productivity across all departments.
            </p>
            <Link
              href="/modules"
              className="inline-flex items-center justify-center px-5 py-3 bg-primary text-white rounded-md hover:bg-primary-dark transition-colors"
            >
              Explore All Modules
            </Link>
          </div>
          <div className="lg:col-span-2">
            <div className="grid md:grid-cols-2 gap-4">
              <ModuleCard
                icon={<div className="w-10 h-10 flex items-center justify-center bg-blue-100 text-blue-600 rounded-lg">CRM</div>}
                title="CRM"
                description="Comprehensive CRM platform for customer-facing teams."
                path="/crm"
              />
              <ModuleCard
                icon={<div className="w-10 h-10 flex items-center justify-center bg-green-100 text-green-600 rounded-lg">INV</div>}
                title="Inventory"
                description="Complete inventory management and control software."
                path="/inventory"
              />
              <ModuleCard
                icon={<div className="w-10 h-10 flex items-center justify-center bg-purple-100 text-purple-600 rounded-lg">HR</div>}
                title="HRMS"
                description="Organize, automate, and simplify your HR processes."
                path="/hrms"
              />
              <ModuleCard
                icon={<div className="w-10 h-10 flex items-center justify-center bg-amber-100 text-amber-600 rounded-lg">FIN</div>}
                title="Finance"
                description="Powerful accounting platform for growing businesses."
                path="/finance"
              />
              <ModuleCard
                icon={<div className="w-10 h-10 flex items-center justify-center bg-rose-100 text-rose-600 rounded-lg">PUR</div>}
                title="Purchase"
                description="Streamline procurement and vendor management."
                path="/purchase"
              />
              <ModuleCard
                icon={<div className="w-10 h-10 flex items-center justify-center bg-teal-100 text-teal-600 rounded-lg">REP</div>}
                title="Reports"
                description="Advanced analytics and intelligent reporting systems."
                path="/reports"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}