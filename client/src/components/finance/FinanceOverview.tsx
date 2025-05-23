import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  BarChart3,
  Banknote,
  CreditCard,
  LineChart,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function FinanceOverview() {
  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      {/* Finance metrics overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Total Revenue</p>
                <h2 className="text-3xl font-bold">{formatCurrency(685000)}</h2>
              </div>
              <div className="bg-green-500/10 p-2 rounded-full">
                <Banknote className="h-5 w-5 text-green-500" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm text-green-600">
              <TrendingUp className="mr-1 h-4 w-4" />
              <span>12% from last month</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Total Expenses</p>
                <h2 className="text-3xl font-bold">{formatCurrency(423500)}</h2>
              </div>
              <div className="bg-red-500/10 p-2 rounded-full">
                <CreditCard className="h-5 w-5 text-red-500" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm text-red-600">
              <TrendingDown className="mr-1 h-4 w-4" />
              <span>8% from last month</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Net Profit</p>
                <h2 className="text-3xl font-bold">{formatCurrency(261500)}</h2>
              </div>
              <div className="bg-blue-500/10 p-2 rounded-full">
                <LineChart className="h-5 w-5 text-blue-500" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm text-blue-600">
              <TrendingUp className="mr-1 h-4 w-4" />
              <span>18% from last month</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Cash Flow</p>
                <h2 className="text-3xl font-bold">{formatCurrency(142300)}</h2>
              </div>
              <div className="bg-purple-500/10 p-2 rounded-full">
                <BarChart3 className="h-5 w-5 text-purple-500" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm text-purple-600">
              <ArrowUpRight className="mr-1 h-4 w-4" />
              <span>5% from last month</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent activity and financial insights */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent transactions */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Recent Transactions</CardTitle>
            <CardDescription>Latest financial activity across your accounts</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                {
                  description: "Invoice #INV-2023-005",
                  amount: 12850,
                  type: "income",
                  date: "Today",
                  status: "Completed",
                },
                {
                  description: "Office Supplies",
                  amount: -1350,
                  type: "expense",
                  date: "Yesterday",
                  status: "Completed",
                },
                {
                  description: "Payroll - May 2023",
                  amount: -45600,
                  type: "expense",
                  date: "May 15, 2023",
                  status: "Completed",
                },
                {
                  description: "Invoice #INV-2023-004",
                  amount: 18500,
                  type: "income",
                  date: "May 12, 2023",
                  status: "Completed",
                },
                {
                  description: "Equipment Purchase",
                  amount: -12400,
                  type: "expense",
                  date: "May 10, 2023",
                  status: "Completed",
                },
              ].map((transaction, index) => (
                <div key={index} className="flex justify-between items-center p-3 rounded-md hover:bg-accent">
                  <div className="flex items-center gap-4">
                    <div className={transaction.type === "income" ? "text-green-500" : "text-red-500"}>
                      {transaction.type === "income" ? <TrendingUp className="h-10 w-10" /> : <TrendingDown className="h-10 w-10" />}
                    </div>
                    <div>
                      <p className="font-medium">{transaction.description}</p>
                      <p className="text-sm text-muted-foreground">{transaction.date}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-medium ${transaction.type === "income" ? "text-green-600" : "text-red-600"}`}>
                      {transaction.type === "income" ? "+" : "-"}{formatCurrency(Math.abs(transaction.amount))}
                    </p>
                    <Badge variant="outline" className="text-xs">{transaction.status}</Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Financial health */}
        <Card>
          <CardHeader>
            <CardTitle>Financial Health</CardTitle>
            <CardDescription>Key indicators of your business health</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { title: "Profit Margin", value: "38.2%", status: "good" },
                { title: "Current Ratio", value: "2.4", status: "good" },
                { title: "Debt to Equity", value: "0.8", status: "medium" },
                { title: "Accounts Receivable", value: formatCurrency(126500), status: "medium" },
                { title: "Average Collection", value: "32 days", status: "medium" },
              ].map((metric, index) => (
                <div key={index} className="flex justify-between items-center">
                  <p className="text-sm font-medium">{metric.title}</p>
                  <div className="flex items-center">
                    <span 
                      className={`font-semibold ${
                        metric.status === "good" ? "text-green-600" : 
                        metric.status === "medium" ? "text-amber-600" : "text-red-600"
                      }`}
                    >
                      {metric.value}
                    </span>
                    <div 
                      className={`ml-2 w-2 h-2 rounded-full ${
                        metric.status === "good" ? "bg-green-500" : 
                        metric.status === "medium" ? "bg-amber-500" : "bg-red-500"
                      }`}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}