import { useEffect } from "react";
import { useLocation } from "wouter";
import CompanyRegistration from "@/components/company/CompanyRegistration";
import { useCompany } from "@/hooks/use-company";
import { Loader2 } from "lucide-react";

export default function CompanyRegistrationPage() {
  const [, setLocation] = useLocation();
  const companyStatus = useCompany();

  // If user already has a company, redirect to dashboard
  useEffect(() => {
    if (!companyStatus.isLoading && companyStatus.hasCompany) {
      setLocation("/dashboard");
    }
  }, [companyStatus.isLoading, companyStatus.hasCompany, setLocation]);
  
  // We don't need to refresh here as the protected route already checks the status

  // Show loading state while checking company status
  if (companyStatus.isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return <CompanyRegistration />;
}