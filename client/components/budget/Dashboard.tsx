import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { TransactionData } from "./TransactionDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChevronLeft, ChevronRight, Search, Wallet, Smartphone, Landmark, CreditCard, Banknote, Plus } from "lucide-react";
import { MetricCard } from "./MetricCard";
import { GoalsSection } from "./GoalsSection";
import { BudgetStatus } from "./BudgetStatus";
import { TransactionsList } from "./TransactionsList";
import { TransactionDialog } from "./TransactionDialog";
import { useBudget } from "@/hooks/use-budget";
import { useWallets } from "@/hooks/use-wallets";
import { useAuth } from "@/lib/auth";
import { UserProfile } from "./UserProfile";

export function Dashboard() {
  const [currentDate, setCurrentDate] = useState(new Date());

  const monthNames = ["January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  const month = monthNames[currentDate.getMonth()];
  const year = currentDate.getFullYear();

  // Pass selected month/year to hook
  const { budget, isLoading, stats, trends, graphs, refreshBudget } = useBudget(month, year);
  const { wallets } = useWallets();

  const { logout, user } = useAuth();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const currency = "$";

  const queryClient = useQueryClient();

  const handlePrevMonth = () => {
    setCurrentDate(prev => {
      const d = new Date(prev);
      d.setMonth(d.getMonth() - 1);
      return d;
    });
  };

  const handleNextMonth = () => {
    setCurrentDate(prev => {
      const d = new Date(prev);
      d.setMonth(d.getMonth() + 1);
      return d;
    });
  };

  const handleTransactionSubmit = async (data: TransactionData) => {
    // Snapshot strictly immutable
    const snapshot = queryClient.getQueryData(['budget', month, year, user?.id]);

    // Check if the transaction belongs to the currently viewed month/year
    const tDate = new Date(data.date || new Date());
    const tMonth = monthNames[tDate.getMonth()];
    const tYear = tDate.getFullYear();
    const isCurrentView = tMonth === month && tYear === year;

    // Optimistic Update (Only if in current view)
    const tempId = Math.random().toString(36).substring(7);
    const optimisticTransaction = {
      ...data,
      id: data.id || tempId, // Use existing ID if edit, else temp
      date: data.date || new Date().toISOString()
    };

    if (isCurrentView) {
      // Update Budget Cache (Transactions List & Metrics)
      queryClient.setQueryData(['budget', month, year, user?.id], (old: any) => {
        if (!old) return old;
        // If edit, replace. If add, prepend.
        let newTransactions;
        if (data.id) {
          newTransactions = old.transactions.map((t: any) => t.id === data.id ? optimisticTransaction : t);
        } else {
          newTransactions = [optimisticTransaction, ...(old.transactions || [])];
        }
        return { ...old, transactions: newTransactions };
      });
    }

    try {
      const response = await fetch(`/api/budget/transaction?month=${month}&year=${year}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      const result = await response.json();

      if (result.success) {
        // If it was an optimistic update, we might want to swap ID, but since we are invalidating everything anyway, 
        // it's safer and easier to just let the refetch handle it. 
        // However, to prevent "flicker" of removing the opt-item before the fetch returns, we could swap.
        // But broad invalidation is fast enough usually.

        // Refresh everything else in background
        await refreshBudget();
      } else {
        // Revert on server error
        if (isCurrentView && snapshot) queryClient.setQueryData(['budget', month, year, user?.id], snapshot);
      }
    } catch (error) {
      console.error('Error adding transaction:', error);
      // Revert on network error
      if (isCurrentView && snapshot) queryClient.setQueryData(['budget', month, year, user?.id], snapshot);
    }
  };

  const [searchTerm, setSearchTerm] = useState("");

  // Calculate Stats
  const transactions = budget?.transactions || [];
  const { income, expenses, savings, balance } = stats;

  const filteredTransactions = transactions.filter(t =>
    t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getWalletIcon = (type: string) => {
    switch (type) {
      case 'mfs': return Smartphone;
      case 'bank': return Landmark;
      case 'credit_card': return CreditCard;
      case 'cash': return Banknote;
      default: return Wallet;
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground p-8">
      {/* Top Header Row */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div className="flex items-center justify-between md:justify-start gap-4 w-full md:w-auto">
          <h1 className="text-3xl font-bold font-serif">Dashboard</h1>
          <div className="flex items-center bg-card rounded-lg border border-white/10 p-1">
            <Button variant="ghost" size="icon" onClick={handlePrevMonth} className="h-8 w-8 hover:bg-primary hover:text-black transition-colors rounded-md">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="min-w-[120px] md:min-w-[140px] text-center font-medium text-sm md:text-base">
              {month} {year}
            </span>
            <Button variant="ghost" size="icon" onClick={handleNextMonth} className="h-8 w-8 hover:bg-primary hover:text-black transition-colors rounded-md">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-4 w-full md:max-w-xl justify-end">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search..."
              className="pl-10 bg-card border-0 rounded-full h-10 text-sm focus-visible:ring-primary w-full"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-2">
            <Button
              onClick={() => setIsDialogOpen(true)}
              className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-full px-6 font-bold flex-1 md:flex-none whitespace-nowrap gap-2"
            >
              <Plus className="h-4 w-4" /> Add Transaction
            </Button>
            <UserProfile />
          </div>
        </div>
      </div>

      {/* Metric Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <MetricCard
          title="Monthly Leftover"
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

      {/* Wallets Row */}
      {wallets.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <h2 className="text-lg font-bold font-serif flex items-center gap-2">
              <Wallet className="w-5 h-5 text-primary" /> My Accounts
            </h2>
            <div className="px-3 py-1 rounded-full bg-primary/10 border border-primary/20">
              <span className="text-xs text-primary font-bold">
                Net Worth: ${wallets.reduce((acc, w) => acc + w.balance, 0).toLocaleString()}
              </span>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {wallets.map(w => {
              const Icon = getWalletIcon(w.type);
              return (
                <div key={w.id} className="bg-card border border-white/5 rounded-xl p-4 flex flex-col justify-between hover:bg-white/5 transition-colors">
                  <div className="flex items-center gap-2 mb-2">
                    <Icon className="w-4 h-4 text-muted-foreground" />
                    <span className="text-xs font-medium text-muted-foreground truncate">{w.name}</span>
                  </div>
                  <div className="text-lg font-bold text-white">${w.balance.toLocaleString()}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Lower Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column (Goals + Budget) takes up 1/3 */}
        <div className="lg:col-span-1 space-y-6">
          <GoalsSection />
          <BudgetStatus currency={currency} budget={budget} refreshBudget={refreshBudget} />
        </div>

        <div className="lg:col-span-2 relative">
          <TransactionsList transactions={filteredTransactions} wallets={wallets} currency={currency} />

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
