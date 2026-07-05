/**
 * Xpense – Smart Expense Tracker Logic
 */

// ================================
// CONFIG & STATE
// ================================

const firstTimeLoad = !localStorage.getItem("expenses");
let expenses = JSON.parse(localStorage.getItem("expenses")) || [];
let budgetLimit = Number(localStorage.getItem("budgetLimit")) || 40000;
let savingsGoals = JSON.parse(localStorage.getItem("savingsGoals")) || [];
let currentTheme = localStorage.getItem("theme") || "light";
let editId = null;
let deleteId = null;
let myChart = null;
let trendChart = null;
let activeAnalyticsTab = "doughnut";

if (firstTimeLoad) {
    const today = new Date();
    const getPastDateStr = (daysAgo) => {
        const date = new Date();
        date.setDate(today.getDate() - daysAgo);
        return date.toISOString().split("T")[0];
    };
    expenses = [
        { id: 1, amount: 2450, category: 'Food & Dining', date: getPastDateStr(1), description: 'Dinner with friends at Bistro', status: 'paid' },
        { id: 2, amount: 15000, category: 'Bills & Utilities', date: getPastDateStr(3), description: 'House Rent', status: 'paid' },
        { id: 3, amount: 800, category: 'Transport', date: getPastDateStr(4), description: 'Uber ride to office', status: 'paid' },
        { id: 4, amount: 4500, category: 'Shopping', date: getPastDateStr(5), description: 'Zara Winter Jacket', status: 'paid' },
        { id: 5, amount: 2300, category: 'Entertainment', date: getPastDateStr(7), description: 'Movie tickets & popcorn', status: 'paid' },
        { id: 6, amount: 1200, category: 'Health', date: getPastDateStr(10), description: 'Monthly Medicines', status: 'paid' },
        { id: 7, amount: 3500, category: 'Travel', date: getPastDateStr(12), description: 'Flight ticket booking deposit', status: 'paid' },
        { id: 8, amount: 350, category: 'Food & Dining', date: getPastDateStr(13), description: 'Starbucks Coffee & Muffin', status: 'paid' },
        { id: 9, amount: 1800, category: 'Bills & Utilities', date: getPastDateStr(15), description: 'Internet broadband bill', status: 'paid' },
        { id: 10, amount: 600, category: 'Transport', date: getPastDateStr(16), description: 'Auto rickshaw commute', status: 'paid' },
        { id: 11, amount: 3200, category: 'Shopping', date: getPastDateStr(20), description: 'Groceries at Supermarket', status: 'paid' },
        { id: 12, amount: 950, category: 'Entertainment', date: getPastDateStr(22), description: 'Spotify Premium 1 year', status: 'paid' },
        { id: 13, amount: 450, category: 'Other', date: getPastDateStr(25), description: 'Laundry service charges', status: 'paid' },
        { id: 14, amount: 2200, category: 'Bills & Utilities', date: getPastDateStr(2), description: 'Electricity Bill', status: 'pending' },
        { id: 15, amount: 1400, category: 'Health', date: getPastDateStr(28), description: 'Dental cleaning visit', status: 'paid' },
    ];
    savingsGoals = [
        { id: 101, name: 'MacBook Pro Fund', target: 120000, date: getPastDateStr(-90), current: 45000 },
        { id: 102, name: 'Euro Trip 2027', target: 250000, date: getPastDateStr(-300), current: 15000 }
    ];
    localStorage.setItem("expenses", JSON.stringify(expenses));
    localStorage.setItem("budgetLimit", budgetLimit);
    localStorage.setItem("savingsGoals", JSON.stringify(savingsGoals));
}

const CATEGORY_COLORS = {
    'Food & Dining': '#10b981',
    'Transport': '#3b82f6',
    'Shopping': '#8b5cf6',
    'Entertainment': '#f43f5e',
    'Bills & Utilities': '#f59e0b',
    'Health': '#06b6d4',
    'Travel': '#6366f1',
    'Other': '#64748b'
};

// ================================
// THEME MANAGEMENT
// ================================

function initTheme() {
    document.documentElement.setAttribute("data-theme", currentTheme);
    updateThemeIcon();
}

function toggleTheme() {
    currentTheme = currentTheme === "light" ? "dark" : "light";
    document.documentElement.setAttribute("data-theme", currentTheme);
    localStorage.setItem("theme", currentTheme);
    updateThemeIcon();
    if (myChart) updateChartTheme();
}

function updateThemeIcon() {
    const sunIcon = document.getElementById("theme-icon-sun");
    const moonIcon = document.getElementById("theme-icon-moon");
    if (currentTheme === "dark") {
        sunIcon.classList.add("d-none");
        moonIcon.classList.remove("d-none");
    } else {
        sunIcon.classList.remove("d-none");
        moonIcon.classList.add("d-none");
    }
}

// ================================
// CHART LOGIC
// ================================

function initChart() {
    if (myChart) return;
    const chartEl = document.getElementById('expenseChart');
    if (!chartEl) return;
    const ctx = chartEl.getContext('2d');
    const data = getChartData();

    myChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: Object.keys(data),
            datasets: [{
                data: Object.values(data),
                backgroundColor: Object.keys(data).map(cat => CATEGORY_COLORS[cat] || '#CBD5E1'),
                borderWidth: 0,
                hoverOffset: 15
            }]
        },
        options: {
            cutout: '70%',
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        usePointStyle: true,
                        padding: 15,
                        color: currentTheme === 'dark' ? '#94a3b8' : '#64748b',
                        font: { family: 'Outfit', size: 11 }
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            let label = context.label || '';
                            if (label) label += ': ';
                            if (context.parsed !== null) {
                                label += '₹' + context.parsed.toLocaleString();
                            }
                            return label;
                        }
                    }
                }
            }
        }
    });
}

function getChartData() {
    const data = {};
    const paidExpenses = expenses.filter(e => !e.status || e.status === 'paid');
    paidExpenses.forEach(exp => {
        data[exp.category] = (data[exp.category] || 0) + exp.amount;
    });
    return data;
}

function getTrendChartData() {
    const dailySpend = {};
    const paidExpenses = expenses.filter(e => !e.status || e.status === 'paid');
    
    // Sort chronological
    const sorted = [...paidExpenses].sort((a,b) => new Date(a.date) - new Date(b.date));
    
    sorted.forEach(exp => {
        const dateKey = exp.date; // YYYY-MM-DD
        dailySpend[dateKey] = (dailySpend[dateKey] || 0) + exp.amount;
    });
    
    return dailySpend;
}

function initTrendChart() {
    const canvas = document.getElementById('trendChart');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const trendData = getTrendChartData();
    
    if (trendChart) {
        trendChart.destroy();
        trendChart = null;
    }
    
    const dates = Object.keys(trendData);
    const amounts = Object.values(trendData);
    
    if (dates.length === 0) return;
    
    const formattedLabels = dates.map(d => formatDate(d));
    
    const gradient = ctx.createLinearGradient(0, 0, 0, 200);
    gradient.addColorStop(0, currentTheme === 'dark' ? 'rgba(129, 140, 248, 0.4)' : 'rgba(79, 70, 229, 0.4)');
    gradient.addColorStop(1, 'rgba(99, 102, 241, 0.0)');
    
    trendChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: formattedLabels,
            datasets: [{
                label: 'Spending Trend',
                data: amounts,
                borderColor: currentTheme === 'dark' ? '#818cf8' : '#4f46e5',
                borderWidth: 3,
                backgroundColor: gradient,
                fill: true,
                tension: 0.35,
                pointBackgroundColor: currentTheme === 'dark' ? '#818cf8' : '#4f46e5',
                pointHoverRadius: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return 'Spent: ₹' + context.parsed.y.toLocaleString();
                        }
                    }
                }
            },
            scales: {
                y: {
                    grid: {
                        color: currentTheme === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'
                    },
                    ticks: {
                        color: currentTheme === 'dark' ? '#94a3b8' : '#64748b',
                        font: { family: 'Outfit', size: 10 },
                        callback: function(value) { return '₹' + value.toLocaleString(); }
                    }
                },
                x: {
                    grid: { display: false },
                    ticks: {
                        color: currentTheme === 'dark' ? '#94a3b8' : '#64748b',
                        font: { family: 'Outfit', size: 10 }
                    }
                }
            }
        }
    });
}

function renderCategoryBreakdown() {
    const listContainer = document.getElementById("categoryProgressList");
    if (!listContainer) return;
    listContainer.innerHTML = "";
    
    const data = getChartData();
    const paidExpenses = expenses.filter(e => !e.status || e.status === 'paid');
    const total = paidExpenses.reduce((sum, e) => sum + e.amount, 0);
    
    if (total === 0) {
        listContainer.innerHTML = `<p class="text-muted small">No expenses to breakdown.</p>`;
        return;
    }
    
    const sortedCats = Object.keys(data).sort((a, b) => data[b] - data[a]);
    
    sortedCats.forEach(cat => {
        const amt = data[cat];
        const pct = (amt / total) * 100;
        const color = CATEGORY_COLORS[cat] || '#64748b';
        
        listContainer.innerHTML += `
            <div class="category-progress-item animate-fade-in">
                <div class="category-progress-info">
                    <span class="fw-semibold small">${cat}</span>
                    <span class="text-muted small">₹${amt.toLocaleString()} (${pct.toFixed(0)}%)</span>
                </div>
                <div class="progress" style="height: 6px; background: rgba(0,0,0,0.05); border-radius: 3px;">
                    <div class="progress-bar" role="progressbar" style="width: ${pct}%; background-color: ${color};" aria-valuenow="${pct}" aria-valuemin="0" aria-valuemax="100"></div>
                </div>
            </div>
        `;
    });
}

function updateChart() {
    const doughnutCol = document.getElementById("doughnutCol");
    const breakdownCol = document.getElementById("breakdownCol");
    const trendCol = document.getElementById("trendCol");
    const noDataMsg = document.getElementById("noDataMessage");
    
    if (expenses.length === 0) {
        if (noDataMsg) noDataMsg.classList.remove('d-none');
        if (doughnutCol) doughnutCol.classList.add('d-none');
        if (breakdownCol) breakdownCol.classList.add('d-none');
        if (trendCol) trendCol.classList.add('d-none');
        return;
    }

    if (noDataMsg) noDataMsg.classList.add('d-none');
    
    if (activeAnalyticsTab === 'doughnut') {
        if (doughnutCol) doughnutCol.classList.remove('d-none');
        if (breakdownCol) breakdownCol.classList.remove('d-none');
        if (trendCol) trendCol.classList.add('d-none');
        
        if (!myChart) {
            initChart();
        } else {
            const data = getChartData();
            myChart.data.labels = Object.keys(data);
            myChart.data.datasets[0].data = Object.values(data);
            myChart.data.datasets[0].backgroundColor = Object.keys(data).map(cat => CATEGORY_COLORS[cat] || '#CBD5E1');
            myChart.update();
        }
        renderCategoryBreakdown();
    } else {
        if (doughnutCol) doughnutCol.classList.add('d-none');
        if (breakdownCol) breakdownCol.classList.add('d-none');
        if (trendCol) trendCol.classList.remove('d-none');
        
        initTrendChart();
    }
}

function toggleAnalyticsView(type) {
    activeAnalyticsTab = type;
    
    const btnDoughnut = document.getElementById("btn-chart-doughnut");
    const btnTrend = document.getElementById("btn-chart-trend");
    
    if (type === 'doughnut') {
        if (btnDoughnut) btnDoughnut.classList.add("active");
        if (btnTrend) btnTrend.classList.remove("active");
    } else {
        if (btnDoughnut) btnDoughnut.classList.remove("active");
        if (btnTrend) btnTrend.classList.add("active");
    }
    
    updateChart();
}

function updateChartTheme() {
    if (myChart) {
        myChart.options.plugins.legend.labels.color = currentTheme === 'dark' ? '#94a3b8' : '#64748b';
        myChart.update();
    }
    if (activeAnalyticsTab === 'trend') {
        initTrendChart();
    }
}

// ================================
// DASHBOARD STATS
// ================================

function updateDashboardStats() {
    const paidExpenses = expenses.filter(e => !e.status || e.status === 'paid');
    const total = paidExpenses.reduce((sum, exp) => sum + exp.amount, 0);
    const monthlyIncome = 50000;
    const balance = monthlyIncome - total;

    document.getElementById("homeTotalAmount").innerText = total.toLocaleString();
    document.getElementById("balanceAmount").innerText = balance.toLocaleString();
    document.getElementById("incomeAmount").innerText = monthlyIncome.toLocaleString();
    
    updateBillReminders();
    updateBudgetUI();
}

function updateBillReminders() {
    const pendingBills = expenses.filter(e => e.status === 'pending');
    const reminderSection = document.getElementById("billReminderSection");
    const reminderText = document.getElementById("billReminderText");

    if (pendingBills.length > 0) {
        reminderSection.classList.remove("d-none");
        const totalPending = pendingBills.reduce((sum, b) => sum + b.amount, 0);
        reminderText.innerText = `You have ${pendingBills.length} pending bill(s) totaling ₹${totalPending.toLocaleString()}.`;
    } else {
        reminderSection.classList.add("d-none");
    }
}

function toggleBillDateLabel() {
    const isBill = document.getElementById("isBill").checked;
    const billLabel = document.getElementById("billLabel");
    const dateLabel = document.querySelector('label[for="date"]') || document.querySelector('#date').previousElementSibling;
    
    if (isBill) {
        billLabel.innerText = "Pending Bill";
        if (dateLabel) dateLabel.innerText = "Due Date";
    } else {
        billLabel.innerText = "Mark as Pending Bill";
        if (dateLabel) dateLabel.innerText = "Date";
    }
}

// ================================
// ADD / EDIT HANDLERS
// ================================

function handleSubmit() {
    if (editId === null) {
        addExpense();
    } else {
        updateExpense();
    }
}

function addExpense() {
    const amount = document.getElementById("amount").value;
    const category = document.getElementById("category").value;
    const date = document.getElementById("date").value;
    const description = document.getElementById("description").value;

    if (!amount || !category || !date) {
        new bootstrap.Modal(document.getElementById("validationModal")).show();
        return;
    }

    const expense = {
        id: Date.now(),
        amount: Number(amount),
        category,
        date,
        description,
        status: document.getElementById("isBill").checked ? 'pending' : 'paid'
    };

    expenses.push(expense);
    saveAndRender();
    clearForm();
    showToast("Expense added successfully!", "success");
}

function startEdit(id) {
    const exp = expenses.find(e => e.id === id);
    if (!exp) return;

    showHome(); // Switch to home to edit
    
    document.getElementById("amount").value = exp.amount;
    document.getElementById("category").value = exp.category;
    document.getElementById("date").value = exp.date;
    document.getElementById("description").value = exp.description;

    editId = id;
    document.getElementById("submitBtn").innerText = "Update Expense";
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function updateExpense() {
    expenses = expenses.map(exp =>
        exp.id === editId
            ? {
                ...exp,
                amount: Number(document.getElementById("amount").value),
                category: document.getElementById("category").value,
                date: document.getElementById("date").value,
                description: document.getElementById("description").value
            }
            : exp
    );

    editId = null;
    document.getElementById("submitBtn").innerText = "Add Expense";

    saveAndRender();
    clearForm();
    showToast("Expense updated successfully!", "primary");
}

// ================================
// RENDER LOGIC
// ================================

function renderExpenses(list = expenses) {
    const tableBody = document.getElementById("expenseTable");
    if (!tableBody) return;

    tableBody.innerHTML = "";
    let total = 0;

    if (list.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="5" class="text-center py-5 text-muted">No expenses found matching your criteria.</td></tr>`;
        document.getElementById("totalAmount").innerText = "0";
        return;
    }

    list.sort((a, b) => new Date(b.date) - new Date(a.date)).forEach(exp => {
        total += (exp.status === 'pending' ? 0 : exp.amount);
        const color = CATEGORY_COLORS[exp.category] || '#64748b';
        const isPending = exp.status === 'pending';
        
        tableBody.innerHTML += `
            <tr class="animate-fade-in ${isPending ? 'table-warning' : ''}">
                <td class="small ${isPending ? 'fw-bold text-warning-emphasis' : ''}">
                    ${isPending ? '<i data-lucide="clock" size="12" class="me-1"></i>' : ''}
                    ${formatDate(exp.date)}
                </td>
                <td>
                    <span class="badge badge-category" style="background: ${color}20; color: ${color}">
                        ${exp.category}
                    </span>
                </td>
                <td class="text-muted small">
                    ${exp.description || "–"}
                    ${isPending ? '<br><span class="badge bg-warning text-dark x-small">PENDING BILL</span>' : ''}
                </td>
                <td class="text-end fw-bold">₹${exp.amount.toLocaleString()}</td>
                <td class="text-center">
                    <div class="d-flex justify-content-center gap-1">
                        ${isPending ? `
                            <button class="btn btn-sm btn-success p-1" onclick="markAsPaid(${exp.id})" title="Mark as Paid">
                                <i data-lucide="check-circle" size="16"></i>
                            </button>
                        ` : ''}
                        <button class="btn btn-sm btn-link text-primary p-1" onclick="startEdit(${exp.id})" title="Edit">
                            <i data-lucide="edit-3" size="16"></i>
                        </button>
                        <button class="btn btn-sm btn-link text-danger p-1" onclick="deleteExpense(${exp.id})" title="Delete">
                            <i data-lucide="trash-2" size="16"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    });

    document.getElementById("totalAmount").innerText = total.toLocaleString();
    lucide.createIcons(); // Re-initialize icons for new rows
}

function renderRecentExpenses() {
    const table = document.getElementById("recentExpenseTable");
    if (!table) return;

    table.innerHTML = "";
    const recent = [...expenses]
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 5);

    if (recent.length === 0) {
        table.innerHTML = `<tr><td colspan="3" class="text-center p-4 text-muted">Set a budget and track your first expense!</td></tr>`;
        return;
    }

    recent.forEach(exp => {
        const color = CATEGORY_COLORS[exp.category] || '#64748b';
        table.innerHTML += `
            <tr>
                <td class="small text-muted">${formatDate(exp.date)}</td>
                <td>
                    <div class="d-flex align-items-center gap-2">
                        <div style="width: 8px; height: 8px; border-radius: 50%; background: ${color}"></div>
                        <span class="small fw-medium">${exp.category}</span>
                    </div>
                </td>
                <td class="text-end fw-bold">₹${exp.amount.toLocaleString()}</td>
            </tr>
        `;
    });
}

// ================================
// DELETE LOGIC
// ================================

function deleteExpense(id) {
    deleteId = id;
    new bootstrap.Modal(document.getElementById("deleteModal")).show();
}

function confirmDelete() {
    if (deleteId === null) return;
    expenses = expenses.filter(exp => exp.id !== deleteId);
    deleteId = null;
    saveAndRender();
    bootstrap.Modal.getInstance(document.getElementById("deleteModal")).hide();
    showToast("Expense removed.", "danger");
}

// ================================
// FILTERS & SEARCH
// ================================

let filterStatus = 'all';

function applyFilters() {
    const term = document.getElementById("searchTerm").value.toLowerCase();
    const category = document.getElementById("filterCategory").value;
    const fromDate = document.getElementById("filterFromDate").value;
    const toDate = document.getElementById("filterToDate").value;
    const sortType = document.getElementById("filterSort").value;

    let result = expenses.filter(exp => {
        const matchTerm = exp.description.toLowerCase().includes(term) || exp.category.toLowerCase().includes(term);
        const matchCat = category ? exp.category === category : true;
        const matchFrom = fromDate ? new Date(exp.date) >= new Date(fromDate) : true;
        const matchTo = toDate ? new Date(exp.date) <= new Date(toDate) : true;
        const matchStatus = filterStatus === 'pending' ? exp.status === 'pending' : true;
        return matchTerm && matchCat && matchFrom && matchTo && matchStatus;
    });

    if (sortType === "dateDesc") result.sort((a, b) => new Date(b.date) - new Date(a.date));
    else if (sortType === "dateAsc") result.sort((a, b) => new Date(a.date) - new Date(b.date));
    else if (sortType === "amountAsc") result.sort((a, b) => a.amount - b.amount);
    else if (sortType === "amountDesc") result.sort((a, b) => b.amount - a.amount);

    renderExpenses(result);
}

function clearFilters() {
    document.getElementById("searchTerm").value = "";
    document.getElementById("filterCategory").value = "";
    document.getElementById("filterFromDate").value = "";
    document.getElementById("filterToDate").value = "";
    document.getElementById("filterSort").value = "dateDesc";
    filterStatus = 'all';
    renderExpenses();
}

// ================================
// UTILITIES
// ================================

function clearForm() {
    document.getElementById("amount").value = "";
    document.getElementById("category").value = "";
    document.getElementById("date").value = new Date().toISOString().split("T")[0];
    document.getElementById("description").value = "";
}

function saveAndRender() {
    localStorage.setItem("expenses", JSON.stringify(expenses));
    renderExpenses();
    renderRecentExpenses();
    updateDashboardStats();
    updateChart();
}

function formatDate(dateStr) {
    const options = { month: 'short', day: 'numeric', year: 'numeric' };
    return new Date(dateStr).toLocaleDateString(undefined, options);
}

function exportExpenses() {
    if (expenses.length === 0) return;
    
    // Adding UTF-8 BOM for Excel compatibility
    const BOM = "\uFEFF";
    const headers = ["Date", "Category", "Amount", "Status", "Description"];
    
    // Sort expenses by date for CSV
    const sorted = [...expenses].sort((a, b) => new Date(b.date) - new Date(a.date));
    
    const rows = sorted.map(e => [
        `"${e.date}"`, // Wrapping in quotes to prevent Excel auto-formatting issues
        `"${e.category}"`,
        e.amount,
        `"${e.status || 'paid'}"`,
        `"${(e.description || '').replace(/"/g, '""')}"` // Escape quotes
    ]);
    
    let csvContent = BOM + headers.join(",") + "\n"
        + rows.map(r => r.join(",")).join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Xpense_Report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

function markAsPaid(id) {
    expenses = expenses.map(exp => 
        exp.id === id ? { ...exp, status: 'paid' } : exp
    );
    saveAndRender();
    showToast("Bill marked as paid!", "success");
}

function showToast(message, type = "primary") {
    const container = document.getElementById("toast-container");
    if (!container) return;

    const toast = document.createElement("div");
    toast.className = `custom-toast toast-${type}`;
    
    const icons = {
        success: 'check-circle',
        danger: 'alert-circle',
        warning: 'bell',
        primary: 'info'
    };
    
    toast.innerHTML = `
        <i data-lucide="${icons[type] || 'info'}" size="20"></i>
        <span>${message}</span>
    `;
    
    container.appendChild(toast);
    lucide.createIcons();
    
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(100%)';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// ================================
// NAVIGATION
// ================================

function showHome() {
    document.getElementById("home").style.display = "block";
    document.getElementById("expenses").style.display = "none";
    document.getElementById("goals").style.display = "none";
    
    document.getElementById("nav-home").classList.add("active");
    document.getElementById("nav-expenses").classList.remove("active");
    document.getElementById("nav-goals").classList.remove("active");
    
    updateChart();
    lucide.createIcons();
}

function showExpenses(filter = 'all') {
    document.getElementById("home").style.display = "none";
    document.getElementById("expenses").style.display = "block";
    document.getElementById("goals").style.display = "none";
    
    document.getElementById("nav-home").classList.remove("active");
    document.getElementById("nav-expenses").classList.add("active");
    document.getElementById("nav-goals").classList.remove("active");
    
    filterStatus = filter;
    
    if (filter === 'pending') {
        document.getElementById("filterCategory").value = "";
    } else {
        clearFilters();
    }
    
    applyFilters();
    lucide.createIcons();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function showGoals() {
    document.getElementById("home").style.display = "none";
    document.getElementById("expenses").style.display = "none";
    document.getElementById("goals").style.display = "block";
    
    document.getElementById("nav-home").classList.remove("active");
    document.getElementById("nav-expenses").classList.remove("active");
    document.getElementById("nav-goals").classList.add("active");
    
    updateGoalsUI();
    lucide.createIcons();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ================================
// BUDGET MANAGEMENT
// ================================

function updateBudgetUI() {
    const paidExpenses = expenses.filter(e => !e.status || e.status === 'paid');
    const spent = paidExpenses.reduce((sum, e) => sum + e.amount, 0);
    
    const limitSpan = document.getElementById("budgetLimit");
    const spentSpan = document.getElementById("budgetSpent");
    const bar = document.getElementById("budgetProgressBar");
    const feedback = document.getElementById("budgetTextFeedback");
    
    if (!limitSpan) return;
    
    limitSpan.innerText = budgetLimit.toLocaleString();
    spentSpan.innerText = spent.toLocaleString();
    
    if (budgetLimit <= 0) {
        document.querySelector(".budget-progress-card").classList.add("d-none");
        return;
    } else {
        document.querySelector(".budget-progress-card").classList.remove("d-none");
    }
    
    const percent = Math.min((spent / budgetLimit) * 100, 100);
    bar.style.width = `${percent}%`;
    bar.setAttribute("aria-valuenow", percent);
    
    bar.className = "progress-bar progress-bar-striped progress-bar-animated";
    feedback.className = "badge px-3 py-2 rounded-pill small fw-bold";
    
    if (percent < 70) {
        bar.classList.add("bg-success");
        feedback.classList.add("bg-success-subtle", "text-success", "border", "border-success", "border-opacity-25");
        feedback.innerText = "Within Budget";
    } else if (percent < 95) {
        bar.classList.add("bg-warning");
        feedback.classList.add("bg-warning-subtle", "text-warning", "border", "border-warning", "border-opacity-25");
        feedback.innerText = "Approaching Limit";
    } else {
        bar.classList.add("bg-danger");
        feedback.classList.add("bg-danger-subtle", "text-danger", "border", "border-danger", "border-opacity-25");
        feedback.innerText = "Budget Exceeded!";
    }
}

function saveSettings() {
    const budgetVal = document.getElementById("settingsBudget").value;
    budgetLimit = budgetVal ? Number(budgetVal) : 0;
    localStorage.setItem("budgetLimit", budgetLimit);
    
    saveAndRender();
    
    const modal = bootstrap.Modal.getInstance(document.getElementById("settingsModal"));
    if (modal) modal.hide();
    
    showToast("Preferences saved!", "success");
}

function confirmResetAll() {
    if (confirm("Are you sure you want to completely reset all transaction history, budgets, and savings goals? This cannot be undone.")) {
        localStorage.clear();
        expenses = [];
        budgetLimit = 30000;
        savingsGoals = [];
        
        saveAndRender();
        updateGoalsUI();
        
        const settingsBudgetInput = document.getElementById("settingsBudget");
        if (settingsBudgetInput) settingsBudgetInput.value = budgetLimit;
        
        const modal = bootstrap.Modal.getInstance(document.getElementById("settingsModal"));
        if (modal) modal.hide();
        
        showToast("All data has been reset.", "danger");
    }
}

function exportBackup() {
    const data = {
        expenses,
        budgetLimit,
        savingsGoals,
        theme: currentTheme
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Xpense_Backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showToast("Backup exported successfully!", "success");
}

function importBackup(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = JSON.parse(e.target.result);
            if (data.expenses) expenses = data.expenses;
            if (data.budgetLimit !== undefined) budgetLimit = data.budgetLimit;
            if (data.savingsGoals) savingsGoals = data.savingsGoals;
            if (data.theme) currentTheme = data.theme;
            
            localStorage.setItem("expenses", JSON.stringify(expenses));
            localStorage.setItem("budgetLimit", budgetLimit);
            localStorage.setItem("savingsGoals", JSON.stringify(savingsGoals));
            localStorage.setItem("theme", currentTheme);
            
            initTheme();
            saveAndRender();
            updateGoalsUI();
            
            const settingsBudgetInput = document.getElementById("settingsBudget");
            if (settingsBudgetInput) settingsBudgetInput.value = budgetLimit;
            
            const modal = bootstrap.Modal.getInstance(document.getElementById("settingsModal"));
            if (modal) modal.hide();
            
            showToast("Backup restored successfully!", "success");
        } catch(err) {
            showToast("Invalid backup file format.", "danger");
        }
    };
    reader.readAsText(file);
}

function seedDemoData() {
    if (confirm("This will overwrite your current transactions with realistic sample data. Proceed?")) {
        const today = new Date();
        const getPastDateStr = (daysAgo) => {
            const date = new Date();
            date.setDate(today.getDate() - daysAgo);
            return date.toISOString().split("T")[0];
        };
        
        const demoExpenses = [
            { id: 1, amount: 2450, category: 'Food & Dining', date: getPastDateStr(1), description: 'Dinner with friends at Bistro', status: 'paid' },
            { id: 2, amount: 15000, category: 'Bills & Utilities', date: getPastDateStr(3), description: 'House Rent', status: 'paid' },
            { id: 3, amount: 800, category: 'Transport', date: getPastDateStr(4), description: 'Uber ride to office', status: 'paid' },
            { id: 4, amount: 4500, category: 'Shopping', date: getPastDateStr(5), description: 'Zara Winter Jacket', status: 'paid' },
            { id: 5, amount: 2300, category: 'Entertainment', date: getPastDateStr(7), description: 'Movie tickets & popcorn', status: 'paid' },
            { id: 6, amount: 1200, category: 'Health', date: getPastDateStr(10), description: 'Monthly Medicines', status: 'paid' },
            { id: 7, amount: 3500, category: 'Travel', date: getPastDateStr(12), description: 'Flight ticket booking deposit', status: 'paid' },
            { id: 8, amount: 350, category: 'Food & Dining', date: getPastDateStr(13), description: 'Starbucks Coffee & Muffin', status: 'paid' },
            { id: 9, amount: 1800, category: 'Bills & Utilities', date: getPastDateStr(15), description: 'Internet broadband bill', status: 'paid' },
            { id: 10, amount: 600, category: 'Transport', date: getPastDateStr(16), description: 'Auto rickshaw commute', status: 'paid' },
            { id: 11, amount: 3200, category: 'Shopping', date: getPastDateStr(20), description: 'Groceries at Supermarket', status: 'paid' },
            { id: 12, amount: 950, category: 'Entertainment', date: getPastDateStr(22), description: 'Spotify Premium 1 year', status: 'paid' },
            { id: 13, amount: 450, category: 'Other', date: getPastDateStr(25), description: 'Laundry service charges', status: 'paid' },
            { id: 14, amount: 2200, category: 'Bills & Utilities', date: getPastDateStr(2), description: 'Electricity Bill', status: 'pending' },
            { id: 15, amount: 1400, category: 'Health', date: getPastDateStr(28), description: 'Dental cleaning visit', status: 'paid' },
        ];
        
        expenses = demoExpenses;
        budgetLimit = 40000;
        
        savingsGoals = [
            { id: 101, name: 'MacBook Pro Fund', target: 120000, date: getPastDateStr(-90), current: 45000 },
            { id: 102, name: 'Euro Trip 2027', target: 250000, date: getPastDateStr(-300), current: 15000 }
        ];
        
        localStorage.setItem("expenses", JSON.stringify(expenses));
        localStorage.setItem("budgetLimit", budgetLimit);
        localStorage.setItem("savingsGoals", JSON.stringify(savingsGoals));
        
        const settingsBudgetInput = document.getElementById("settingsBudget");
        if (settingsBudgetInput) settingsBudgetInput.value = budgetLimit;
        
        saveAndRender();
        updateGoalsUI();
        
        const modal = bootstrap.Modal.getInstance(document.getElementById("settingsModal"));
        if (modal) modal.hide();
        
        showToast("Sample demo data seeded!", "success");
    }
}

// ================================
// SAVINGS GOALS TRACKER
// ================================

function updateGoalsUI() {
    const grid = document.getElementById("goalsGrid");
    if (!grid) return;
    grid.innerHTML = "";
    
    if (savingsGoals.length === 0) {
        grid.innerHTML = `
            <div class="col-12 text-center py-5 text-muted animate-fade-in">
                <i data-lucide="target" class="text-muted mb-3" size="48" style="stroke-width: 1.5;"></i>
                <p class="mb-0">You don't have any active savings goals yet. Create one above!</p>
            </div>
        `;
        lucide.createIcons();
        return;
    }
    
    savingsGoals.forEach(goal => {
        const percent = Math.min((goal.current / goal.target) * 100, 100);
        const daysLeft = Math.ceil((new Date(goal.date) - new Date()) / (1000 * 60 * 60 * 24));
        const isCompleted = goal.current >= goal.target;
        
        grid.innerHTML += `
            <div class="col-md-4 animate-fade-in">
                <div class="card glass-panel goal-card border-0 h-100">
                    <div class="card-body p-4 d-flex flex-column">
                        <div class="d-flex align-items-center justify-content-between mb-3">
                            <h5 class="fw-bold mb-0 text-truncate" style="max-width: 80%;">${goal.name}</h5>
                            <button class="btn btn-sm btn-link text-danger p-0 border-0" onclick="deleteGoal(${goal.id})" title="Delete Goal">
                                <i data-lucide="trash-2" size="16"></i>
                            </button>
                        </div>
                        <div class="text-muted small mb-2">Target Amount: <strong>₹${goal.target.toLocaleString()}</strong></div>
                        <div class="text-muted small mb-3">Target Date: <strong>${formatDate(goal.date)}</strong> (${daysLeft > 0 ? daysLeft + ' days left' : 'past due'})</div>
                        
                        <!-- Progress -->
                        <div class="mt-auto pt-2">
                            <div class="d-flex justify-content-between text-muted small mb-1">
                                <span>Saved: ₹${goal.current.toLocaleString()}</span>
                                <span>${percent.toFixed(0)}%</span>
                            </div>
                            <div class="progress mb-3" style="height: 8px;">
                                <div class="progress-bar ${isCompleted ? 'bg-success' : 'bg-primary'}" role="progressbar" style="width: ${percent}%"></div>
                            </div>
                            
                            <div class="d-flex gap-2">
                                <button class="btn btn-sm btn-glass flex-grow-1 py-2 text-success fw-bold" onclick="openGoalActionModal(${goal.id}, 'deposit')" ${isCompleted ? 'disabled' : ''}>
                                    Deposit
                                </button>
                                <button class="btn btn-sm btn-glass flex-grow-1 py-2 text-danger fw-bold" onclick="openGoalActionModal(${goal.id}, 'withdraw')" ${goal.current <= 0 ? 'disabled' : ''}>
                                    Withdraw
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    });
    lucide.createIcons();
}

function handleCreateGoal() {
    const name = document.getElementById("goalName").value;
    const target = document.getElementById("goalTarget").value;
    const date = document.getElementById("goalDate").value;
    
    if (!name || !target || !date) {
        showToast("Please fill all goal fields.", "warning");
        return;
    }
    
    const goal = {
        id: Date.now(),
        name,
        target: Number(target),
        date,
        current: 0
    };
    
    savingsGoals.push(goal);
    localStorage.setItem("savingsGoals", JSON.stringify(savingsGoals));
    updateGoalsUI();
    
    document.getElementById("goalName").value = "";
    document.getElementById("goalTarget").value = "";
    document.getElementById("goalDate").value = "";
    
    const modal = bootstrap.Modal.getInstance(document.getElementById("addGoalModal"));
    if (modal) modal.hide();
    
    showToast("Savings Goal created successfully!", "success");
}

function deleteGoal(id) {
    if (confirm("Are you sure you want to delete this savings goal? Any funds allocated to it will be lost.")) {
        savingsGoals = savingsGoals.filter(g => g.id !== id);
        localStorage.setItem("savingsGoals", JSON.stringify(savingsGoals));
        updateGoalsUI();
        showToast("Savings Goal deleted.", "danger");
    }
}

function openGoalActionModal(id, type) {
    document.getElementById("actionGoalId").value = id;
    document.getElementById("actionType").value = type;
    document.getElementById("actionGoalAmount").value = "";
    
    const title = document.getElementById("goalActionModalTitle");
    const label = document.getElementById("actionAmountLabel");
    
    if (type === 'deposit') {
        title.innerText = "Deposit Savings";
        label.innerText = "Amount to Save (₹) - Will deduct from balance";
    } else {
        title.innerText = "Withdraw Savings";
        label.innerText = "Amount to Withdraw (₹) - Will return to balance";
    }
    
    new bootstrap.Modal(document.getElementById("goalActionModal")).show();
}

function handleGoalAction() {
    const id = Number(document.getElementById("actionGoalId").value);
    const type = document.getElementById("actionType").value;
    const amount = Number(document.getElementById("actionGoalAmount").value);
    
    if (!amount || amount <= 0) {
        showToast("Please enter a valid amount.", "warning");
        return;
    }
    
    const goalIndex = savingsGoals.findIndex(g => g.id === id);
    if (goalIndex === -1) return;
    
    const goal = savingsGoals[goalIndex];
    
    // Calculate current balance
    const paidExpenses = expenses.filter(e => !e.status || e.status === 'paid');
    const totalExpenses = paidExpenses.reduce((sum, exp) => sum + exp.amount, 0);
    const monthlyIncome = 50000;
    const currentBalance = monthlyIncome - totalExpenses;
    
    if (type === 'deposit') {
        if (amount > currentBalance) {
            showToast("Insufficient balance to save this amount.", "danger");
            return;
        }
        if (goal.current + amount > goal.target) {
            showToast(`Amount exceeds target remaining of ₹${(goal.target - goal.current).toLocaleString()}`, "warning");
            return;
        }
        goal.current += amount;
        
        const txn = {
            id: Date.now(),
            amount: amount,
            category: "Other",
            date: new Date().toISOString().split("T")[0],
            description: `Goal Deposit: ${goal.name}`,
            status: 'paid'
        };
        expenses.push(txn);
    } else {
        if (amount > goal.current) {
            showToast("Cannot withdraw more than what is saved.", "danger");
            return;
        }
        goal.current -= amount;
        
        const txn = {
            id: Date.now(),
            amount: -amount,
            category: "Other",
            date: new Date().toISOString().split("T")[0],
            description: `Goal Withdrawal: ${goal.name}`,
            status: 'paid'
        };
        expenses.push(txn);
    }
    
    localStorage.setItem("savingsGoals", JSON.stringify(savingsGoals));
    saveAndRender();
    updateGoalsUI();
    
    const modal = bootstrap.Modal.getInstance(document.getElementById("goalActionModal"));
    if (modal) modal.hide();
    
    showToast("Savings transfer complete!", "success");
}

// ================================
// INITIALIZATION
// ================================

document.addEventListener("DOMContentLoaded", () => {
    initTheme();
    
    document.getElementById("date").value = new Date().toISOString().split("T")[0];
    document.getElementById("date").setAttribute("max", new Date().toISOString().split("T")[0]);

    const settingsBudgetInput = document.getElementById("settingsBudget");
    if (settingsBudgetInput) {
        settingsBudgetInput.value = budgetLimit;
    }

    renderRecentExpenses();
    updateDashboardStats();
    initChart();
    renderCategoryBreakdown();
    updateGoalsUI();
    lucide.createIcons();
});
