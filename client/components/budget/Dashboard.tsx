import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { TransactionData } from "./TransactionDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChevronLeft, ChevronRight, Search, Wallet, Smartphone, Landmark, CreditCard, Banknote, Plus, Sparkles } from "lucide-react";
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
        await refreshBudget();
      } else {
        if (isCurrentView && snapshot) queryClient.setQueryData(['budget', month, year, user?.id], snapshot);
      }
    } catch (error) {
      console.error('Error adding transaction:', error);
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

  const getWalletColor = (type: string) => {
    switch (type) {
      case 'mfs': return 'from-pink-500/20 to-pink-500/5 border-pink-500/30';
      case 'bank': return 'from-blue-500/20 to-blue-500/5 border-blue-500/30';
      case 'credit_card': return 'from-purple-500/20 to-purple-500/5 border-purple-500/30';
      case 'cash': return 'from-green-500/20 to-green-500/5 border-green-500/30';
      default: return 'from-gray-500/20 to-gray-500/5 border-gray-500/30';
    }
  };

  return (
    <div className="min-h-screen bg-black text-white p-4 md:p-6 lg:p-8 relative overflow-hidden">
      {/* Background decorations - hidden on mobile for performance */}
      <div className="hidden md:block absolute top-0 right-0 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl pointer-events-none" />
      <div className="hidden md:block absolute bottom-0 left-0 w-[400px] h-[400px] bg-primary/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Header Row */}
      <div className="relative z-10 flex flex-col gap-4 mb-6 md:mb-8">
        {/* Title + Date Nav Row */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold font-serif text-white">Dashboard</h1>
            <p className="text-gray-500 text-xs md:text-sm mt-0.5 md:mt-1 hidden sm:block">Track your finances at a glance</p>
          </div>
          <div className="flex items-center bg-zinc-900/80 backdrop-blur-sm rounded-xl md:rounded-2xl border border-white/10 p-1 md:p-1.5 shadow-lg">
            <Button
              variant="ghost"
              size="icon"
              onClick={handlePrevMonth}
              className="h-8 w-8 md:h-9 md:w-9 hover:bg-primary hover:text-black transition-all rounded-lg md:rounded-xl"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="min-w-[100px] md:min-w-[140px] text-center font-semibold text-xs md:text-sm lg:text-base px-1 md:px-2">
              {month} {year}
            </span>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleNextMonth}
              className="h-8 w-8 md:h-9 md:w-9 hover:bg-primary hover:text-black transition-all rounded-lg md:rounded-xl"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Search + Actions Row */}
        <div className="flex flex-col sm:flex-row items-stretch gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 md:left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
            <Input
              placeholder="Search..."
              className="pl-9 md:pl-11 bg-zinc-900/80 backdrop-blur-sm border-white/10 rounded-xl md:rounded-2xl h-10 md:h-11 text-sm focus-visible:ring-primary focus-visible:border-primary w-full"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-2 md:gap-3">
            <Button
              onClick={() => setIsDialogOpen(true)}
              className="bg-primary text-black hover:bg-primary/90 rounded-xl md:rounded-2xl px-4 md:px-6 h-10 md:h-11 font-bold flex-1 sm:flex-none whitespace-nowrap gap-1.5 md:gap-2 shadow-lg shadow-primary/20 text-sm"
            >
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Add Transaction</span>
              <span className="sm:hidden">Add</span>
            </Button>
            <div className="hidden sm:block">
              <UserProfile />
            </div>
          </div>
        </div>
      </div>

      {/* Metric Cards Row */}
      <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
        <MetricCard
          title="Monthly Leftover"
          value={`${currency}${balance.toLocaleString()}`}
          trend={`${trends.balance > 0 ? '+' : ''}${trends.balance}%`}
          trendUp={trends.balance >= 0}
          data={graphs.balance}
          className="bg-gradient-to-br from-primary/20 to-primary/5 border-primary/30"
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
        <div className="relative z-10 mb-6 md:mb-8">
          <div className="flex items-center justify-between gap-3 mb-3 md:mb-4">
            <div className="flex items-center gap-2 md:gap-3">
              <div className="p-1.5 md:p-2 rounded-lg md:rounded-xl bg-primary/20">
                <Wallet className="w-4 h-4 md:w-5 md:h-5 text-primary" />
              </div>
              <h2 className="text-base md:text-xl font-bold font-serif text-white">My Accounts</h2>
            </div>
            <div className="px-2 md:px-4 py-1 md:py-1.5 rounded-full bg-gradient-to-r from-primary/20 to-primary/5 border border-primary/30">
              <span className="text-xs md:text-sm text-primary font-bold flex items-center gap-1 md:gap-1.5">
                <Sparkles className="h-3 w-3 md:h-3.5 md:w-3.5" />
                <span className="hidden sm:inline">Net Worth:</span> ${wallets.reduce((acc, w) => acc + w.balance, 0).toLocaleString()}
              </span>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 md:gap-4">
            {wallets.map(w => {
              const Icon = getWalletIcon(w.type);
              const colorClass = getWalletColor(w.type);
              return (
                <div
                  key={w.id}
                  className={`bg-gradient-to-br ${colorClass} rounded-xl md:rounded-2xl p-3 md:p-4 flex flex-col justify-between hover:scale-[1.02] transition-transform border backdrop-blur-sm`}
                >
                  <div className="flex items-center gap-1.5 md:gap-2 mb-2 md:mb-3">
                    <div className="p-1 md:p-1.5 rounded-md md:rounded-lg bg-white/10">
                      <Icon className="w-3 h-3 md:w-4 md:h-4 text-white" />
                    </div>
                    <span className="text-[10px] md:text-xs font-medium text-white/70 truncate">{w.name}</span>
                  </div>
                  <div className="text-base md:text-xl font-bold text-white">${w.balance.toLocaleString()}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Lower Section */}
      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6 lg:gap-8">
        {/* Left Column (Goals + Budget) takes up 1/3 */}
        <div className="lg:col-span-1 space-y-4 md:space-y-6 order-2 lg:order-1">
          <GoalsSection />
          <BudgetStatus currency={currency} budget={budget} refreshBudget={refreshBudget} />
        </div>

        <div className="lg:col-span-2 relative order-1 lg:order-2">
          <TransactionsList transactions={filteredTransactions} wallets={wallets} currency={currency} />

          {/* Gradient overlay at bottom for smooth scroll fade effect if needed */}
          <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-black to-transparent pointer-events-none"></div>
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
