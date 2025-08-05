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
  Activity,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useFinanceOverview } from "@/hooks/use-finance-comprehensive";
import { useFinanceRealtime } from "@/hooks/use-finance-realtime";
import { formatCurrency } from "@/lib/utils";

export default function FinanceOverview() {
  const { data: financeData, isLoading } = useFinanceOverview();
  const { isConnected, updates } = useFinanceRealtime();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse">
                  <div className="h-4 bg-muted rounded w-1/2 mb-2"></div>
                  <div className="h-8 bg-muted rounded w-3/4 mb-4"></div>
                  <div className="h-4 bg-muted rounded w-1/3"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Real-time connection status */}
      {isConnected && (
        <div className="flex items-center gap-2 text-sm text-green-600">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          Real-time updates active • {updates.length} recent updates
        </div>
      )}

      {/* Finance metrics overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Total Revenue</p>
                <h2 className="text-3xl font-bold">{formatCurrency(financeData?.totalRevenue || 0)}</h2>
              </div>
              <div className="bg-green-500/10 p-2 rounded-full">
                <Banknote className="h-5 w-5 text-green-500" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <TrendingUp className="mr-1 h-4 w-4 text-green-600" />
              <span className="text-green-600">+12% from last month</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Total Expenses</p>
                <h2 className="text-3xl font-bold">{formatCurrency(financeData?.totalExpenses || 0)}</h2>
              </div>
              <div className="bg-red-500/10 p-2 rounded-full">
                <CreditCard className="h-5 w-5 text-red-500" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <TrendingDown className="mr-1 h-4 w-4 text-green-600" />
              <span className="text-green-600">-8% from last month</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Net Profit</p>
                <h2 className="text-3xl font-bold">{formatCurrency(financeData?.netProfit || 0)}</h2>
              </div>
              <div className="bg-blue-500/10 p-2 rounded-full">
                <LineChart className="h-5 w-5 text-blue-500" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <TrendingUp className="mr-1 h-4 w-4 text-blue-600" />
              <span className="text-blue-600">+18% from last month</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Cash Flow</p>
                <h2 className="text-3xl font-bold">{formatCurrency(financeData?.cashFlow || 0)}</h2>
              </div>
              <div className="bg-purple-500/10 p-2 rounded-full">
                <BarChart3 className="h-5 w-5 text-purple-500" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <ArrowUpRight className="mr-1 h-4 w-4 text-purple-600" />
              <span className="text-purple-600">+5% from last month</span>
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
              {financeData?.recentTransactions?.length ? (
                financeData.recentTransactions.map((transaction, index) => (
                  <div key={index} className="flex justify-between items-center p-3 rounded-md hover:bg-accent">
                    <div className="flex items-center gap-4">
                      <div className={transaction.type === "income" ? "text-green-500" : "text-red-500"}>
                        {transaction.type === "income" ? <TrendingUp className="h-10 w-10" /> : <TrendingDown className="h-10 w-10" />}
                      </div>
                      <div>
                        <p className="font-medium">{transaction.description}</p>
                        <p className="text-sm text-muted-foreground">{new Date(transaction.date).toLocaleDateString()}</p>
                        <p className="text-xs text-muted-foreground">{transaction.account}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-medium ${transaction.type === "income" ? "text-green-600" : "text-red-600"}`}>
                        {transaction.type === "income" ? "+" : ""}{formatCurrency(transaction.amount)}
                      </p>
                      <Badge variant="outline" className="text-xs">{transaction.status}</Badge>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Activity className="h-16 w-16 mx-auto mb-4 opacity-50" />
                  <p>No recent transactions</p>
                  <p className="text-sm">Your latest financial activity will appear here</p>
                </div>
              )}
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
                { 
                  title: "Profit Margin", 
                  value: `${financeData?.profitMargin?.toFixed(1) || '0.0'}%`, 
                  status: (financeData?.profitMargin || 0) > 20 ? "good" : (financeData?.profitMargin || 0) > 10 ? "medium" : "poor"
                },
                { 
                  title: "Current Ratio", 
                  value: financeData?.currentRatio?.toFixed(1) || '0.0', 
                  status: (financeData?.currentRatio || 0) > 2 ? "good" : (financeData?.currentRatio || 0) > 1 ? "medium" : "poor"
                },
                { 
                  title: "Quick Ratio", 
                  value: financeData?.quickRatio?.toFixed(1) || '0.0', 
                  status: (financeData?.quickRatio || 0) > 1 ? "good" : (financeData?.quickRatio || 0) > 0.5 ? "medium" : "poor"
                },
                { 
                  title: "Accounts Receivable", 
                  value: formatCurrency(financeData?.accountsReceivable || 0), 
                  status: "medium" 
                },
                { 
                  title: "Average Collection", 
                  value: `${financeData?.averageCollectionPeriod || 0} days`, 
                  status: (financeData?.averageCollectionPeriod || 0) < 30 ? "good" : (financeData?.averageCollectionPeriod || 0) < 60 ? "medium" : "poor"
                },
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