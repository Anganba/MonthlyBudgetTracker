import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
// import { useLocation } from "wouter"; // Removed wouter
import { BudgetMonth, Transaction } from "@shared/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Plus } from "lucide-react";
import { MetricCard } from "./MetricCard";
import { GoalsSection } from "./GoalsSection";
import { BudgetStatus } from "./BudgetStatus";
import { TransactionsList } from "./TransactionsList";
import { TransactionDialog, TransactionData } from "./TransactionDialog";
import { useBudget } from "@/hooks/use-budget";
import { useAuth } from "@/lib/auth";
import { LogOut } from "lucide-react";
import { UserProfile } from "./UserProfile";

export function Dashboard() {
  const { budget, isLoading, stats, trends, graphs, refreshBudget } = useBudget();
  const { logout } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Month/Year for fetching
  const monthNames = ["January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  const month = monthNames[currentDate.getMonth()];
  const year = currentDate.getFullYear();
  const currency = "$"; // Hardcoded for design match, could be dynamic

  const queryClient = useQueryClient();

  const handleTransactionSubmit = async (data: TransactionData) => {
    try {
      const response = await fetch(`/api/budget/transaction?month=${month}&year=${year}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      const result = await response.json();
      if (result.success) {
        await refreshBudget();
        queryClient.invalidateQueries({ queryKey: ['goals'] });
      }
    } catch (error) { console.error('Error adding transaction:', error); }
  };

  const [searchTerm, setSearchTerm] = useState("");

  // Calculate Stats
  const transactions = budget?.transactions || [];
  const { income, expenses, savings, balance } = stats;

  const filteredTransactions = transactions.filter(t =>
    t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background text-foreground p-8">
      {/* Top Header Row */}
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold font-serif">Dashboard</h1>

        <div className="flex items-center gap-4 w-full max-w-xl justify-end">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search"
              className="pl-10 bg-card border-0 rounded-full h-10 text-sm focus-visible:ring-primary"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <Button
            onClick={() => setIsDialogOpen(true)}
            className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-full px-6 font-bold"
          >
            Add transaction
          </Button>

          <UserProfile />
        </div>
      </div>

      {/* Metric Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
        <MetricCard
          title="Total Balance"
          value={`${currency}${balance.toLocaleString()}`}
          trend={`${trends.balance > 0 ? '+' : ''}${trends.balance}%`}
          trendUp={trends.balance >= 0}
          data={graphs.balance}
          className="border-l-4 border-l-primary" // Highlight
        />
        <MetricCard
          title="Income"
          value={`${currency}${income.toLocaleString()}`}
          trend={`${trends.income > 0 ? '+' : ''}${trends.income}%`}
          trendUp={trends.income >= 0}
          data={graphs.income}
        />
        <MetricCard
          title="Expenses"
          value={`${currency}${expenses.toLocaleString()}`}
          trend={`${trends.expenses > 0 ? '+' : ''}${trends.expenses}%`}
          trendUp={trends.expenses >= 0}
          data={graphs.expenses}
        />
        <MetricCard
          title="Total Savings"
          value={`${currency}${savings.toLocaleString()}`}
          trend={`${trends.savings > 0 ? '+' : ''}${trends.savings}%`}
          trendUp={trends.savings >= 0}
          data={graphs.savings}
        />
      </div>

      {/* Lower Section */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Left Column (Goals + Budget) takes up 1/3 */}
        <div className="xl:col-span-1 space-y-6">
          <GoalsSection />
          <BudgetStatus currency={currency} budget={budget} refreshBudget={refreshBudget} />
        </div>

        <div className="xl:col-span-2 relative">
          <TransactionsList transactions={filteredTransactions} currency={currency} />

          {/* Gradient overlay at bottom for smooth scroll fade effect if needed */}
          <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-background to-transparent pointer-events-none"></div>
        </div>
      </div>

      <TransactionDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onSubmit={handleTransactionSubmit}
        mode="add"
      />
    </div>
  );
}
