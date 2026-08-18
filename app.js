/**
 * PocketPilot — Core Application Logic
 * Clean, modular, and persistent personal finance tracker.
 */

// --- 1. STATE MANAGEMENT ---
let state = {
  expenses: [],
  income: [],
  userName: "Uttam",
  currentView: "dashboard"
};

// Initial Seed Data (Matches the UI screenshot exactly on first load)
const DEFAULT_SEED_DATA = {
  expenses: [
    {
      id: "exp-1",
      amount: 320.00,
      category: "food",
      type: "need",
      datetime: "2026-08-18T13:20:00", // Today at 1:20 PM
      note: "Lunch at cafe"
    },
    {
      id: "exp-2",
      amount: 180.00,
      category: "transport",
      type: "need",
      datetime: "2026-08-18T09:10:00", // Today at 9:10 AM
      note: "Metro card recharge"
    },
    {
      id: "exp-3",
      amount: 1250.00,
      category: "shopping",
      type: "want",
      datetime: "2026-08-17T18:42:00", // Yesterday at 6:42 PM
      note: "New t-shirt"
    },
    {
      id: "exp-4",
      amount: 499.00,
      category: "entertainment",
      type: "want",
      datetime: "2026-08-16T20:30:00", // Aug 16 at 8:30 PM
      note: "Movie ticket"
    },
    {
      id: "exp-5",
      amount: 5000.00,
      category: "shopping",
      type: "want",
      datetime: "2026-08-12T14:15:00",
      note: "Wireless headphones"
    },
    {
      id: "exp-6",
      amount: 4256.58,
      category: "utilities",
      type: "need",
      datetime: "2026-08-05T11:30:00",
      note: "Electricity & Wi-Fi bill"
    },
    {
      id: "exp-7",
      amount: 1000.00,
      category: "groceries",
      type: "need",
      datetime: "2026-08-02T10:00:00",
      note: "Weekly veggies & fruits"
    }
  ],
  income: [
    {
      id: "inc-1",
      amount: 15000.00,
      note: "Monthly Pocket Money",
      datetime: "2026-08-01T09:00:00"
    },
    {
      id: "inc-2",
      amount: 2005.58,
      note: "Freelance design gig",
      datetime: "2026-08-15T16:00:00"
    }
  ]
};

// Seed/Load data from localStorage
function initStorage() {
  const localExpenses = localStorage.getItem("pocket_expenses");
  const localIncome = localStorage.getItem("pocket_income");
  const localUser = localStorage.getItem("pocket_username");

  if (localExpenses && localIncome) {
    state.expenses = JSON.parse(localExpenses);
    state.income = JSON.parse(localIncome);
  } else {
    // Write defaults to storage
    localStorage.setItem("pocket_expenses", JSON.stringify(DEFAULT_SEED_DATA.expenses));
    localStorage.setItem("pocket_income", JSON.stringify(DEFAULT_SEED_DATA.income));
    state.expenses = DEFAULT_SEED_DATA.expenses;
    state.income = DEFAULT_SEED_DATA.income;
  }

  if (localUser) {
    state.userName = localUser;
  } else {
    localStorage.setItem("pocket_username", state.userName);
  }
}

function saveState() {
  localStorage.setItem("pocket_expenses", JSON.stringify(state.expenses));
  localStorage.setItem("pocket_income", JSON.stringify(state.income));
}

// --- 2. DATE & TEXT FORMATTING HELPERS ---
const CURRENCY_FORMATTER = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  minimumFractionDigits: 2
});

function formatCurrency(amount) {
  return CURRENCY_FORMATTER.format(amount);
}

// Convert category key to display text
function getCategoryLabel(category) {
  const labels = {
    food: "Food & dining",
    transport: "Transport",
    shopping: "Shopping",
    entertainment: "Entertainment",
    utilities: "Utilities",
    groceries: "Groceries",
    others: "Others"
  };
  return labels[category] || category;
}

// Relative time formatting matching screenshot style: "Today · 1:20 PM"
function formatTransactionDate(dateStr) {
  const date = new Date(dateStr);
  const now = new Date();
  
  // Format Time
  let hours = date.getHours();
  const minutes = date.getMinutes().toString().padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12; // Hour '0' should be '12'
  const timeStr = `${hours}:${minutes} ${ampm}`;

  // Date Check
  const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const todayOnly = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterdayOnly = new Date(todayOnly);
  yesterdayOnly.setDate(yesterdayOnly.getDate() - 1);

  if (dateOnly.getTime() === todayOnly.getTime()) {
    return `Today &bull; ${timeStr}`;
  } else if (dateOnly.getTime() === yesterdayOnly.getTime()) {
    return `Yesterday &bull; ${timeStr}`;
  } else {
    // Format: "Aug 16 · 8:30 PM"
    const options = { month: 'short', day: 'numeric' };
    const dateFormatted = date.toLocaleDateString('en-US', options);
    return `${dateFormatted} &bull; ${timeStr}`;
  }
}

// Return datetime-local input formatted string: YYYY-MM-DDTHH:MM
function getLocalISODateTime() {
  const tzoffset = (new Date()).getTimezoneOffset() * 60000; // Offset in milliseconds
  const localISOTime = (new Date(Date.now() - tzoffset)).toISOString().slice(0, 16);
  return localISOTime;
}

// --- 3. DOM CACHING ---
const DOM = {
  // Navigation
  navDashboard: document.getElementById("nav-dashboard-btn"),
  navHistory: document.getElementById("nav-history-btn"),
  navAnalytics: document.getElementById("nav-analytics-btn"),
  viewAllHistory: document.getElementById("view-all-history-link"),
  viewDashboard: document.getElementById("view-dashboard"),
  viewHistory: document.getElementById("view-history"),
  viewAnalytics: document.getElementById("view-analytics"),
  scrollContainer: document.getElementById("main-content-scroll"),
  
  // Dashboard fields
  totalSpent: document.getElementById("total-spent-display"),
  currentBalance: document.getElementById("current-balance-display"),
  recentExpenses: document.getElementById("recent-expenses-list"),
  
  // History Fields
  searchField: document.getElementById("search-transactions-input"),
  filterTagsContainer: document.getElementById("history-filter-tags"),
  fullHistoryList: document.getElementById("full-history-list"),
  
  // Analytics Fields
  statIncome: document.getElementById("stat-total-income"),
  statSpent: document.getElementById("stat-total-spent"),
  statSavings: document.getElementById("stat-net-savings"),
  statSavingsPct: document.getElementById("stat-savings-percentage"),
  needsRatioBar: document.getElementById("needs-ratio-bar"),
  wantsRatioBar: document.getElementById("wants-ratio-bar"),
  needsRatioLabel: document.getElementById("needs-ratio-label"),
  wantsRatioLabel: document.getElementById("wants-ratio-label"),
  categoryBars: document.getElementById("analytics-category-bars"),
  insightBox: document.getElementById("smart-insight-box"),
  
  // Modals
  expenseModal: document.getElementById("expense-modal-overlay"),
  incomeModal: document.getElementById("income-modal-overlay"),
  
  // Triggers
  btnOpenExpense: document.getElementById("open-add-expense-btn"),
  btnCloseExpense: document.getElementById("close-expense-modal"),
  btnOpenIncome: document.getElementById("open-add-income-btn"),
  btnCloseIncome: document.getElementById("close-income-modal"),
  btnCancelIncome: document.getElementById("btn-cancel-income"),
  profileTrigger: document.getElementById("profile-trigger"),
  
  // Forms
  expenseForm: document.getElementById("expense-form"),
  expenseId: document.getElementById("edit-expense-id"),
  expenseAmount: document.getElementById("expense-amount"),
  expenseCategory: document.getElementById("expense-category"),
  expenseType: document.getElementById("expense-type"),
  expenseDatetime: document.getElementById("expense-datetime"),
  expenseNote: document.getElementById("expense-note"),
  expenseActions: document.getElementById("expense-actions-container"),
  expenseTitle: document.getElementById("expense-modal-title"),
  
  btnTypeNeed: document.getElementById("btn-type-need"),
  btnTypeWant: document.getElementById("btn-type-want"),
  
  incomeForm: document.getElementById("income-form"),
  incomeAmount: document.getElementById("income-amount"),
  incomeDatetime: document.getElementById("income-datetime"),
  incomeNote: document.getElementById("income-note")
};

// --- 4. VIEW ENGINE & TABS ---
function switchView(viewName) {
  state.currentView = viewName;
  
  // Update nav buttons active states
  DOM.navDashboard.classList.toggle("active", viewName === "dashboard");
  DOM.navHistory.classList.toggle("active", viewName === "history");
  DOM.navAnalytics.classList.toggle("active", viewName === "analytics");
  
  // Toggle view containers
  DOM.viewDashboard.classList.toggle("active", viewName === "dashboard");
  DOM.viewHistory.classList.toggle("active", viewName === "history");
  DOM.viewAnalytics.classList.toggle("active", viewName === "analytics");
  
  // Reset scroll position on change
  DOM.scrollContainer.scrollTop = 0;

  // Render components based on view
  if (viewName === "dashboard") {
    renderDashboard();
  } else if (viewName === "history") {
    renderHistory();
  } else if (viewName === "analytics") {
    renderAnalytics();
  }
}

// --- 5. RENDER FUNCTIONS ---

// Compute total values
function calculateTotals() {
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  // Spent in the current month (for dashboard overview)
  const monthlySpent = state.expenses
    .filter(e => {
      const d = new Date(e.datetime);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    })
    .reduce((sum, e) => sum + e.amount, 0);

  // Total balance computation
  const totalIncome = state.income.reduce((sum, i) => sum + i.amount, 0);
  const totalExpenses = state.expenses.reduce((sum, e) => sum + e.amount, 0);
  const currentBalance = totalIncome - totalExpenses;

  return { monthlySpent, currentBalance, totalIncome, totalExpenses };
}

// Render Dashboard View
function renderDashboard() {
  const totals = calculateTotals();
  DOM.totalSpent.textContent = formatCurrency(totals.monthlySpent);
  DOM.currentBalance.textContent = formatCurrency(totals.currentBalance);
  
  // Render recent 4 expenses
  DOM.recentExpenses.innerHTML = "";
  
  // Sort expenses by date descending
  const sortedExpenses = [...state.expenses].sort((a, b) => new Date(b.datetime) - new Date(a.datetime));
  const recentItems = sortedExpenses.slice(0, 4);

  if (recentItems.length === 0) {
    DOM.recentExpenses.innerHTML = `
      <div style="text-align: center; padding: 20px; color: var(--text-muted); font-size: 14px;">
        No expenses recorded yet. Tap + to add one!
      </div>
    `;
    return;
  }

  recentItems.forEach(item => {
    const el = document.createElement("div");
    el.className = "expense-item";
    el.addEventListener("click", () => openEditExpenseModal(item));
    
    // First initial of category
    const initial = item.category.charAt(0);
    
    el.innerHTML = `
      <div class="expense-item-left">
        <div class="category-avatar ${item.category}">${initial}</div>
        <div class="expense-item-info">
          <span class="expense-item-category">${getCategoryLabel(item.category)}</span>
          <span class="expense-item-meta">
            <span class="expense-item-date">${formatTransactionDate(item.datetime)}</span>
            <span class="meta-divider">&bull;</span>
            <span class="expense-item-note">${item.note || 'No note'}</span>
          </span>
        </div>
      </div>
      <div style="display: flex; flex-direction: column; align-items: flex-end;">
        <span class="expense-item-amount expense">&minus; ${formatCurrency(item.amount)}</span>
        <span class="expense-item-badge badge-${item.type}">${item.type}</span>
      </div>
    `;
    DOM.recentExpenses.appendChild(el);
  });
}

// History Filters and Search state
let historyFilter = "all";

function renderHistory() {
  const searchVal = DOM.searchField.value.toLowerCase().trim();
  DOM.fullHistoryList.innerHTML = "";

  // Combine both income and expenses for complete history view
  let items = [];
  
  state.expenses.forEach(e => {
    items.push({ ...e, isExpense: true });
  });
  state.income.forEach(i => {
    items.push({ ...i, isExpense: false, category: "income", type: "income" });
  });

  // Sort items descending by date/time
  items.sort((a, b) => new Date(b.datetime) - new Date(a.datetime));

  // Apply quick filter tag
  if (historyFilter === "need") {
    items = items.filter(i => i.isExpense && i.type === "need");
  } else if (historyFilter === "want") {
    items = items.filter(i => i.isExpense && i.type === "want");
  } else if (historyFilter === "income") {
    items = items.filter(i => !i.isExpense);
  } else if (historyFilter !== "all") {
    // Filter by specific category string (e.g. food, shopping)
    items = items.filter(i => i.category === historyFilter);
  }

  // Apply search note or category match
  if (searchVal) {
    items = items.filter(i => {
      const noteMatch = (i.note || "").toLowerCase().includes(searchVal);
      const catMatch = getCategoryLabel(i.category).toLowerCase().includes(searchVal);
      return noteMatch || catMatch;
    });
  }

  if (items.length === 0) {
    DOM.fullHistoryList.innerHTML = `
      <div style="text-align: center; padding: 40px 20px; color: var(--text-muted);">
        <p style="font-size: 15px; font-weight: 500;">No transactions found</p>
        <p style="font-size: 13px; margin-top: 4px; opacity: 0.8;">Try clearing your search or filters.</p>
      </div>
    `;
    return;
  }

  items.forEach(item => {
    const el = document.createElement("div");
    el.className = "expense-item";
    
    // Wire up edit modal triggers depending on type
    if (item.isExpense) {
      el.addEventListener("click", () => openEditExpenseModal(item));
    } else {
      el.addEventListener("click", () => {
        // Income simple delete alert/action
        if(confirm(`Do you want to delete this income transaction: "${item.note}" of ${formatCurrency(item.amount)}?`)) {
          deleteIncome(item.id);
        }
      });
    }

    const initial = item.isExpense ? item.category.charAt(0) : "I";
    const amountClass = item.isExpense ? "expense" : "income";
    const amountPrefix = item.isExpense ? "&minus; " : "&plus; ";

    el.innerHTML = `
      <div class="expense-item-left">
        <div class="category-avatar ${item.category}">${initial}</div>
        <div class="expense-item-info">
          <span class="expense-item-category">${item.isExpense ? getCategoryLabel(item.category) : "Income / Money In"}</span>
          <span class="expense-item-meta">
            <span class="expense-item-date">${formatTransactionDate(item.datetime)}</span>
            <span class="meta-divider">&bull;</span>
            <span class="expense-item-note">${item.note || 'No note'}</span>
          </span>
        </div>
      </div>
      <div style="display: flex; flex-direction: column; align-items: flex-end;">
        <span class="expense-item-amount ${amountClass}">${amountPrefix}${formatCurrency(item.amount)}</span>
        <span class="expense-item-badge badge-${item.type}">${item.type}</span>
      </div>
    `;
    DOM.fullHistoryList.appendChild(el);
  });
}

// Render Analytics View
function renderAnalytics() {
  const totals = calculateTotals();
  
  // Total summary blocks
  DOM.statIncome.textContent = formatCurrency(totals.totalIncome);
  DOM.statSpent.textContent = formatCurrency(totals.totalExpenses);
  
  const netSavings = totals.totalIncome - totals.totalExpenses;
  DOM.statSavings.textContent = formatCurrency(netSavings);
  
  const savingsPct = totals.totalIncome > 0 ? Math.round((netSavings / totals.totalIncome) * 100) : 0;
  
  if (totals.totalIncome === 0) {
    DOM.statSavingsPct.textContent = "Add income to compute your savings rate";
  } else if (netSavings >= 0) {
    DOM.statSavingsPct.textContent = `${savingsPct}% of income saved`;
  } else {
    DOM.statSavingsPct.textContent = `Negative savings: spent ${Math.abs(savingsPct)}% more than earned`;
  }

  // Needs vs Wants split calculation
  const totalExpenses = totals.totalExpenses;
  const needsTotal = state.expenses.filter(e => e.type === "need").reduce((sum, e) => sum + e.amount, 0);
  const wantsTotal = state.expenses.filter(e => e.type === "want").reduce((sum, e) => sum + e.amount, 0);
  
  const needsPct = totalExpenses > 0 ? Math.round((needsTotal / totalExpenses) * 100) : 50;
  const wantsPct = totalExpenses > 0 ? Math.round((wantsTotal / totalExpenses) * 100) : 50;

  DOM.needsRatioBar.style.width = `${needsPct}%`;
  DOM.wantsRatioBar.style.width = `${wantsPct}%`;
  DOM.needsRatioLabel.textContent = `Needs: ${needsPct}%`;
  DOM.wantsRatioLabel.textContent = `Wants: ${wantsPct}%`;

  // Render category totals list
  DOM.categoryBars.innerHTML = "";
  
  // Group spending by category
  const categoriesMap = {};
  state.expenses.forEach(e => {
    categoriesMap[e.category] = (categoriesMap[e.category] || 0) + e.amount;
  });

  const sortedCategories = Object.keys(categoriesMap).map(cat => ({
    name: cat,
    amount: categoriesMap[cat],
    percentage: totalExpenses > 0 ? Math.round((categoriesMap[cat] / totalExpenses) * 100) : 0
  })).sort((a, b) => b.amount - a.amount);

  if (sortedCategories.length === 0) {
    DOM.categoryBars.innerHTML = `
      <div style="text-align: center; padding: 10px 0; color: var(--text-muted); font-size: 13px;">
        No data available. Add expenses to see category metrics.
      </div>
    `;
  } else {
    sortedCategories.forEach(cat => {
      const el = document.createElement("div");
      el.className = "category-bar-row";
      el.innerHTML = `
        <div class="category-bar-info">
          <span class="category-bar-name">${getCategoryLabel(cat.name)} <span class="category-bar-percent">${cat.percentage}%</span></span>
          <span class="category-bar-amount">${formatCurrency(cat.amount)}</span>
        </div>
        <div class="category-progress-track">
          <div class="category-progress-fill" style="width: ${cat.percentage}%;"></div>
        </div>
      `;
      DOM.categoryBars.appendChild(el);
    });
  }

  // Adjust insight box text dynamically
  let insightText = "";
  if (totalExpenses === 0) {
    insightText = "✨ Start tracking expenses to get custom pocket insights on where your money goes!";
  } else if (netSavings < 0) {
    insightText = "🚨 Warning! Your spending exceeds your income this month. Review your 'Wants' and see if you can scale back to balance your budget.";
  } else if (wantsPct > 55) {
    insightText = "⚠️ You are spending over half of your budget on Wants. Try prioritizing Needs or boosting your savings buffer next month.";
  } else if (savingsPct >= 30) {
    insightText = "🎯 Awesome! You have saved more than 30% of your income. You are building wealth quickly. Keep it up!";
  } else {
    insightText = "💡 Balanced budget! Try to save a little extra next week by reviewing smaller miscellaneous items.";
  }
  DOM.insightBox.textContent = insightText;
}

// --- 6. MODALS TRANSITIONS ---

function openModal(modalEl) {
  modalEl.style.display = "block";
  // Force reflow
  modalEl.offsetHeight;
  modalEl.classList.add("active");
}

function closeModal(modalEl) {
  modalEl.classList.remove("active");
  setTimeout(() => {
    modalEl.style.display = "none";
  }, 300); // Wait for CSS transition animation to finish
}

// Open Add Expense modal
function openAddExpenseModal() {
  DOM.expenseForm.reset();
  DOM.expenseId.value = "";
  DOM.expenseTitle.textContent = "Add Expense";
  
  // Set default datetime to local current
  DOM.expenseDatetime.value = getLocalISODateTime();
  
  // Set Type buttons state (Default to Need)
  DOM.expenseType.value = "need";
  DOM.btnTypeNeed.classList.add("active");
  DOM.btnTypeWant.classList.remove("active");

  // Re-build buttons (only save button)
  DOM.expenseActions.innerHTML = `
    <button type="submit" class="btn btn-primary">Save Expense</button>
  `;

  openModal(DOM.expenseModal);
}

// Open Edit Expense Modal
function openEditExpenseModal(expense) {
  DOM.expenseId.value = expense.id;
  DOM.expenseTitle.textContent = "Edit Expense";
  DOM.expenseAmount.value = expense.amount;
  DOM.expenseCategory.value = expense.category;
  DOM.expenseNote.value = expense.note || "";
  
  // Datetime conversion (handles formatting of ISO datetime string to fit input type datetime-local)
  const dt = new Date(expense.datetime);
  const offset = dt.getTimezoneOffset() * 60000;
  DOM.expenseDatetime.value = new Date(dt.getTime() - offset).toISOString().slice(0,16);

  // Type selection values
  DOM.expenseType.value = expense.type;
  if (expense.type === "need") {
    DOM.btnTypeNeed.classList.add("active");
    DOM.btnTypeWant.classList.remove("active");
  } else {
    DOM.btnTypeNeed.classList.remove("active");
    DOM.btnTypeWant.classList.add("active");
  }

  // Populate buttons with Save and Delete options
  DOM.expenseActions.innerHTML = `
    <button type="button" class="btn btn-danger" id="btn-delete-expense">Delete</button>
    <button type="submit" class="btn btn-primary">Save Changes</button>
  `;

  // Attach delete click listener
  document.getElementById("btn-delete-expense").addEventListener("click", () => {
    deleteExpense(expense.id);
  });

  openModal(DOM.expenseModal);
}

// Open Add Income Modal
function openAddIncomeModal() {
  DOM.incomeForm.reset();
  DOM.incomeDatetime.value = getLocalISODateTime();
  openModal(DOM.incomeModal);
}

// --- 7. FORM SUBMISSIONS / ACTIONS ---

// Create or update expense
DOM.expenseForm.addEventListener("submit", (e) => {
  e.preventDefault();
  
  const id = DOM.expenseId.value;
  const amount = parseFloat(DOM.expenseAmount.value);
  const category = DOM.expenseCategory.value;
  const note = DOM.expenseNote.value.trim();
  const datetime = DOM.expenseDatetime.value;
  const type = DOM.expenseType.value;

  if (isNaN(amount) || amount <= 0) return;

  if (id) {
    // Update existing expense item
    const index = state.expenses.findIndex(exp => exp.id === id);
    if (index !== -1) {
      state.expenses[index] = { ...state.expenses[index], amount, category, note, datetime, type };
    }
  } else {
    // Create new expense item
    const newExpense = {
      id: "exp-" + Date.now(),
      amount,
      category,
      note,
      datetime,
      type
    };
    state.expenses.push(newExpense);
  }

  saveState();
  closeModal(DOM.expenseModal);
  
  // Refresh standard active view
  switchView(state.currentView);
});

// Delete expense item
function deleteExpense(id) {
  state.expenses = state.expenses.filter(exp => exp.id !== id);
  saveState();
  closeModal(DOM.expenseModal);
  switchView(state.currentView);
}

// Add Income money item
DOM.incomeForm.addEventListener("submit", (e) => {
  e.preventDefault();
  
  const amount = parseFloat(DOM.incomeAmount.value);
  const note = DOM.incomeNote.value.trim();
  const datetime = DOM.incomeDatetime.value;

  if (isNaN(amount) || amount <= 0) return;

  const newIncome = {
    id: "inc-" + Date.now(),
    amount,
    note,
    datetime
  };

  state.income.push(newIncome);
  saveState();
  closeModal(DOM.incomeModal);
  switchView(state.currentView);
});

// Delete Income item
function deleteIncome(id) {
  state.income = state.income.filter(inc => inc.id !== id);
  saveState();
  switchView(state.currentView);
}

// --- 8. EVENT LISTENERS SETUP ---

function setupListeners() {
  // Tabs Navigation clicks
  DOM.navDashboard.addEventListener("click", () => switchView("dashboard"));
  DOM.navHistory.addEventListener("click", () => switchView("history"));
  DOM.navAnalytics.addEventListener("click", () => switchView("analytics"));
  DOM.viewAllHistory.addEventListener("click", () => switchView("history"));

  // Open/Close Add modals triggers
  DOM.btnOpenExpense.addEventListener("click", openAddExpenseModal);
  DOM.btnCloseExpense.addEventListener("click", () => closeModal(DOM.expenseModal));
  
  DOM.btnOpenIncome.addEventListener("click", openAddIncomeModal);
  DOM.btnCloseIncome.addEventListener("click", () => closeModal(DOM.incomeModal));
  DOM.btnCancelIncome.addEventListener("click", () => closeModal(DOM.incomeModal));

  // Close modals on clicking overlay background
  DOM.expenseModal.addEventListener("click", (e) => {
    if (e.target === DOM.expenseModal) closeModal(DOM.expenseModal);
  });
  DOM.incomeModal.addEventListener("click", (e) => {
    if (e.target === DOM.incomeModal) closeModal(DOM.incomeModal);
  });

  // Need / Want Pill selectors toggler
  DOM.btnTypeNeed.addEventListener("click", () => {
    DOM.expenseType.value = "need";
    DOM.btnTypeNeed.classList.add("active");
    DOM.btnTypeWant.classList.remove("active");
  });
  DOM.btnTypeWant.addEventListener("click", () => {
    DOM.expenseType.value = "want";
    DOM.btnTypeNeed.classList.remove("active");
    DOM.btnTypeWant.classList.add("active");
  });

  // Live search filtering on history page
  DOM.searchField.addEventListener("input", renderHistory);

  // Quick filter tags clicking listeners
  DOM.filterTagsContainer.addEventListener("click", (e) => {
    const btn = e.target.closest(".filter-tag");
    if (!btn) return;

    // Toggle active state
    DOM.filterTagsContainer.querySelectorAll(".filter-tag").forEach(tag => tag.classList.remove("active"));
    btn.classList.add("active");

    historyFilter = btn.dataset.filter;
    renderHistory();
  });

  // Profile Greeting rename Easter egg click
  DOM.profileTrigger.addEventListener("click", () => {
    const newName = prompt("Rename your pocket account profile name:", state.userName);
    if (newName && newName.trim()) {
      state.userName = newName.trim();
      localStorage.setItem("pocket_username", state.userName);
      document.getElementById("username-display").textContent = state.userName;
    }
  });
}

// --- 9. APP INITIALIZATION ---
function initApp() {
  initStorage();
  setupListeners();
  
  // Set User Name header display
  document.getElementById("username-display").textContent = state.userName;
  
  // Set dynamic Greeting based on time of day
  const hour = new Date().getHours();
  let greeting = "Good morning";
  if (hour >= 12 && hour < 17) greeting = "Good afternoon";
  else if (hour >= 17) greeting = "Good evening";
  document.getElementById("greeting-time").textContent = greeting;

  // Run initial render of dashboard
  switchView("dashboard");
}

document.addEventListener("DOMContentLoaded", initApp);
// Fallback if DOM already loaded
if (document.readyState === "interactive" || document.readyState === "complete") {
  initApp();
}
