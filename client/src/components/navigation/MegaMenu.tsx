import { useState, useRef, useEffect } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { Link } from "wouter";

interface SubModule {
  id: string;
  name: string;
  description: string;
  icon: string;
  path: string;
}

interface Module {
  id: string;
  name: string;
  path: string;
  subModules: SubModule[];
}

interface MegaMenuProps {
  modules: Module[];
}

const ModuleIcon = ({ name }: { name: string }) => {
  const colorMap: Record<string, string> = {
    CRM: "bg-blue-100 text-blue-600",
    Sales: "bg-indigo-100 text-indigo-600",
    Inventory: "bg-green-100 text-green-600",
    Finance: "bg-amber-100 text-amber-600",
    Purchase: "bg-rose-100 text-rose-600",
    HRMS: "bg-purple-100 text-purple-600",
    Reports: "bg-teal-100 text-teal-600",
    Payments: "bg-sky-100 text-sky-600",
  };

  const getInitials = (name: string) => {
    return name.substring(0, 3).toUpperCase();
  };

  const colorClass = colorMap[name] || "bg-gray-100 text-gray-600";

  return (
    <div className={`w-9 h-9 flex items-center justify-center rounded-md ${colorClass}`}>
      <span className="text-xs font-medium">{getInitials(name)}</span>
    </div>
  );
};

export default function MegaMenu({ modules }: MegaMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeModule, setActiveModule] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const toggleMenu = () => {
    setIsOpen(!isOpen);
    if (!isOpen && modules.length > 0) {
      setActiveModule(modules[0].id);
    }
  };

  const handleModuleMouseEnter = (moduleId: string) => {
    setActiveModule(moduleId);
  };

  const currentModule = modules.find(m => m.id === activeModule);

  return (
    <div className="relative" ref={menuRef}>
      <button
        className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 hover:text-primary"
        onClick={toggleMenu}
      >
        Products <ChevronDown className="ml-1 h-4 w-4" />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 w-screen bg-white shadow-lg z-50 border-t border-gray-200">
          <div className="flex border-b border-gray-200 bg-white py-2">
            <div className="container mx-auto px-4 flex space-x-8">
              <div className="text-sm font-medium py-1 border-b-2 border-primary text-primary">
                Apps
              </div>
              <div className="text-sm font-medium py-1 text-gray-500 hover:text-gray-800">
                Suites
              </div>
              <div className="text-sm font-medium py-1 text-gray-500 hover:text-gray-800">
                CogniFlow One
              </div>
              <div className="text-sm font-medium py-1 text-gray-500 hover:text-gray-800">
                Marketplace
              </div>
              <div className="flex-1"></div>
              <div className="text-sm font-medium py-1 text-primary flex items-center">
                EXPLORE ALL PRODUCTS <ChevronRight className="ml-1 h-4 w-4" />
              </div>
              <button 
                className="text-gray-400 hover:text-gray-600"
                onClick={() => setIsOpen(false)}
              >
                &times;
              </button>
            </div>
          </div>
          
          <div className="container mx-auto px-4">
            <div className="flex">
              {/* Left sidebar with module list */}
              <div className="w-56 py-3 border-r border-gray-200">
                <div className="relative mb-3">
                  <input
                    type="text"
                    placeholder="I'm looking for..."
                    className="w-full py-2 px-3 border border-gray-300 rounded-md text-sm"
                  />
                </div>
                
                <div className="text-xs font-medium text-gray-500 py-2">
                  Recent Launches
                </div>
                
                {modules.map((module) => (
                  <div
                    key={module.id}
                    className={`py-2 cursor-pointer text-sm ${
                      activeModule === module.id ? "text-primary font-medium" : "text-gray-700 hover:text-primary"
                    }`}
                    onMouseEnter={() => handleModuleMouseEnter(module.id)}
                  >
                    {module.name}
                  </div>
                ))}
                
                <div className="mt-4">
                  <Link 
                    href="/modules" 
                    className="inline-flex items-center bg-blue-100 text-primary text-xs font-medium py-1 px-3 rounded-sm hover:bg-blue-200"
                    onClick={() => setIsOpen(false)}
                  >
                    EXPLORE ALL PRODUCTS <ChevronRight className="ml-1 h-3 w-3" />
                  </Link>
                </div>
              </div>

              {/* Right side with submodules */}
              <div className="flex-1 p-6">
                {currentModule && (
                  <>
                    <h3 className="text-xl font-semibold mb-6">{currentModule.name}</h3>
                    <div className="grid grid-cols-3 gap-6">
                      {currentModule.subModules.map((subModule) => (
                        <Link 
                          key={subModule.id} 
                          href={subModule.path}
                          onClick={() => setIsOpen(false)}
                        >
                          <div className="flex items-start hover:bg-gray-50 rounded-md transition-all group">
                            <ModuleIcon name={subModule.icon} />
                            <div className="ml-3">
                              <h4 className="font-medium text-sm">{subModule.name}</h4>
                              <p className="text-xs text-gray-600 mt-1 leading-snug">{subModule.description}</p>
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}