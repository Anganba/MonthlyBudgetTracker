import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
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
  const [showAllCategories, setShowAllCategories] = useState(false);
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

  const { toast } = useToast();

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
        // If transaction was added for a different month, navigate to that month
        if (!isCurrentView) {
          // Invalidate cache for the target month to ensure fresh data
          await queryClient.invalidateQueries({ queryKey: ['budget', tMonth, tYear, user?.id] });
          const newDate = new Date(tYear, monthNames.indexOf(tMonth), 1);
          setCurrentDate(newDate);
          toast({
            title: "Transaction Added",
            description: `Navigated to ${tMonth} ${tYear} where the transaction was recorded.`,
          });
        } else {
          await refreshBudget();
        }
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
      {/* Animated background decorations - hidden on mobile for performance */}
      <div className="hidden md:block absolute top-0 right-0 w-[600px] h-[600px] bg-gradient-to-br from-cyan-500/10 via-primary/10 to-transparent rounded-full blur-3xl pointer-events-none animate-pulse" style={{ animationDuration: '4s' }} />
      <div className="hidden md:block absolute bottom-1/3 left-0 w-[500px] h-[500px] bg-gradient-to-tr from-violet-500/10 via-purple-500/5 to-transparent rounded-full blur-3xl pointer-events-none animate-pulse" style={{ animationDuration: '5s' }} />
      <div className="hidden md:block absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-gradient-to-tl from-rose-500/10 via-orange-500/5 to-transparent rounded-full blur-3xl pointer-events-none animate-pulse" style={{ animationDuration: '6s' }} />
      <div className="hidden md:block absolute top-1/4 left-1/3 w-[350px] h-[350px] bg-gradient-to-br from-emerald-500/10 to-transparent rounded-full blur-3xl pointer-events-none animate-pulse" style={{ animationDuration: '7s' }} />

      {/* Top Header Row - Consolidated and balanced */}
      <div className="relative z-10 flex flex-col gap-4 mb-6 md:mb-8">
        {/* Main Header Row */}
        <div className="flex items-center justify-between gap-4">
          {/* Left: Title */}
          <div className="flex-shrink-0">
            <h1 className="text-xl md:text-2xl lg:text-3xl font-bold font-serif text-white">Dashboard</h1>
            <p className="text-gray-500 text-[10px] md:text-xs mt-0.5 hidden sm:block">Track your finances at a glance</p>
          </div>

          {/* Center: Search + Quick Greeting */}
          <div className="flex-1 flex items-center justify-center gap-3 max-w-xl">
            <div className="relative w-full max-w-[200px] md:max-w-[280px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-500" />
              <Input
                placeholder="Search..."
                className="pl-8 md:pl-9 bg-zinc-900/80 backdrop-blur-sm border-white/10 rounded-xl h-9 md:h-10 text-xs md:text-sm focus-visible:ring-primary focus-visible:border-primary w-full"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="hidden lg:flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-zinc-800/80 to-zinc-900/50 border border-white/5">
              <span className="text-xs text-gray-400">Welcome back,</span>
              <span className="text-sm font-semibold text-white">{user?.username || 'User'}</span>
              <span className="text-lg">👋</span>
            </div>
          </div>

          {/* Right: Date Nav + Actions */}
          <div className="flex items-center gap-2 md:gap-3 flex-shrink-0">
            {/* Date Navigator - Compact */}
            <div className="flex items-center bg-zinc-900/80 backdrop-blur-sm rounded-xl border border-white/10 p-0.5 md:p-1 shadow-lg">
              <Button
                variant="ghost"
                size="icon"
                onClick={handlePrevMonth}
                className="h-7 w-7 md:h-8 md:w-8 hover:bg-primary hover:text-black transition-all rounded-lg"
              >
                <ChevronLeft className="h-3.5 w-3.5 md:h-4 md:w-4" />
              </Button>
              <span className="min-w-[80px] md:min-w-[110px] text-center font-semibold text-[10px] md:text-xs lg:text-sm px-1">
                {month.slice(0, 3)} {year}
              </span>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleNextMonth}
                className="h-7 w-7 md:h-8 md:w-8 hover:bg-primary hover:text-black transition-all rounded-lg"
              >
                <ChevronRight className="h-3.5 w-3.5 md:h-4 md:w-4" />
              </Button>
            </div>

            {/* Add Transaction Button */}
            <Button
              onClick={() => setIsDialogOpen(true)}
              className="bg-primary text-black hover:bg-primary/90 rounded-xl px-3 md:px-4 h-8 md:h-9 font-bold whitespace-nowrap gap-1.5 shadow-lg shadow-primary/20 text-xs md:text-sm"
            >
              <Plus className="h-3.5 w-3.5 md:h-4 md:w-4" />
              <span className="hidden sm:inline">Add Transaction</span>
              <span className="sm:hidden">Add</span>
            </Button>

            {/* User Profile */}
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
          className="bg-gradient-to-br from-primary/25 via-emerald-500/15 to-primary/5 border-primary/40 shadow-lg shadow-primary/10 hover:shadow-primary/20 transition-shadow"
          accentColor="primary"
        />
        <MetricCard
          title="Income"
          value={`${currency}${income.toLocaleString()}`}
          trend={`${trends.income > 0 ? '+' : ''}${trends.income}%`}
          trendUp={trends.income >= 0}
          data={graphs.income}
          className="bg-gradient-to-br from-cyan-500/25 via-blue-500/15 to-cyan-500/5 border-cyan-500/40 shadow-lg shadow-cyan-500/10 hover:shadow-cyan-500/20 transition-shadow"
          accentColor="cyan"
        />
        <MetricCard
          title="Expenses"
          value={`${currency}${expenses.toLocaleString()}`}
          trend={`${trends.expenses > 0 ? '+' : ''}${trends.expenses}%`}
          trendUp={trends.expenses >= 0}
          data={graphs.expenses}
          className="bg-gradient-to-br from-rose-500/25 via-orange-500/15 to-rose-500/5 border-rose-500/40 shadow-lg shadow-rose-500/10 hover:shadow-rose-500/20 transition-shadow"
          accentColor="rose"
        />
        <MetricCard
          title="Total Savings"
          value={`${currency}${savings.toLocaleString()}`}
          trend={`${trends.savings > 0 ? '+' : ''}${trends.savings}%`}
          trendUp={trends.savings >= 0}
          data={graphs.savings}
          className="bg-gradient-to-br from-violet-500/25 via-purple-500/15 to-violet-500/5 border-violet-500/40 shadow-lg shadow-violet-500/10 hover:shadow-violet-500/20 transition-shadow"
          accentColor="violet"
        />
      </div>

      {/* Wallets Row */}
      {wallets.length > 0 && (
        <div className="relative z-10 mb-3 md:mb-4">
          <div className="flex items-center justify-between gap-3 mb-3 md:mb-4">
            <div className="flex items-center gap-2 md:gap-3">
              <div className="p-1.5 md:p-2 rounded-lg md:rounded-xl bg-primary/20">
                <Wallet className="w-4 h-4 md:w-5 md:h-5 text-primary" />
              </div>
              <h2 className="text-base md:text-xl font-bold font-serif text-white">My Accounts</h2>
            </div>
            <a href="/wallets" className="px-2 md:px-4 py-1 md:py-1.5 rounded-full bg-gradient-to-r from-primary/20 to-primary/5 border border-primary/30 hover:border-primary/50 transition-colors cursor-pointer">
              <span className="text-xs md:text-sm text-primary font-bold flex items-center gap-1 md:gap-1.5">
                <Sparkles className="h-3 w-3 md:h-3.5 md:w-3.5" />
                <span className="hidden sm:inline">Net Worth:</span> ${wallets.reduce((acc, w) => acc + w.balance, 0).toLocaleString()}
              </span>
            </a>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 md:gap-3">
            {wallets.map(w => {
              const Icon = getWalletIcon(w.type);
              const colorClass = getWalletColor(w.type);
              const isLowBalance = w.balance < 100;
              return (
                <a
                  key={w.id}
                  href="/wallets"
                  className={`group bg-gradient-to-br ${colorClass} rounded-xl md:rounded-2xl p-2.5 md:p-4 flex flex-col justify-between hover:scale-[1.03] hover:shadow-lg transition-all border backdrop-blur-sm cursor-pointer`}
                >
                  <div className="flex items-center gap-1.5 md:gap-2 mb-2 md:mb-3">
                    <div className="p-1 md:p-1.5 rounded-md md:rounded-lg bg-white/10 group-hover:bg-white/20 transition-colors">
                      <Icon className="w-3 h-3 md:w-4 md:h-4 text-white" />
                    </div>
                    <span className="text-[10px] md:text-xs font-medium text-white/70 truncate group-hover:text-white/90 transition-colors">{w.name}</span>
                    {isLowBalance && (
                      <span className="ml-auto text-[8px] text-yellow-400">Low</span>
                    )}
                  </div>
                  <div className="text-sm md:text-xl font-bold text-white">${w.balance.toLocaleString()}</div>
                </a>
              );
            })}
          </div>
        </div>
      )}

      {/* Lower Section - Both columns stretch to equal height */}
      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-3 gap-3 md:gap-3 lg:gap-4 lg:items-stretch">
        {/* Left Column (Goals + Budget) takes up 1/3 */}
        <div className="lg:col-span-1 flex flex-col gap-4 md:gap-6 order-2 lg:order-1">
          <GoalsSection />
          <div className="flex-1">
            <BudgetStatus currency={currency} budget={budget} refreshBudget={refreshBudget} showAllCategories={showAllCategories} onToggleCategories={setShowAllCategories} />
          </div>
        </div>

        {/* Right Column - Transactions matches left column height */}
        <div className="lg:col-span-2 order-1 lg:order-2 h-full">
          <TransactionsList transactions={filteredTransactions} wallets={wallets} currency={currency} showMoreItems={showAllCategories} />
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
