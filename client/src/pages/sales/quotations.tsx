import ErpNavigation from "@/components/ErpNavigation";
import QuotationsManagement from "@/components/sales/QuotationsManagement";

const QuotationsPage = () => {
  return (
    <ErpNavigation>
      <div className="flex flex-col gap-6">
        <QuotationsManagement />
      </div>
    </ErpNavigation>
  );
};

export default QuotationsPage;