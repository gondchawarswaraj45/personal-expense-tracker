/**
 * Xpense – Smart Expense Tracker Logic
 */

// ================================
// CONFIG & STATE
// ================================

let expenses = JSON.parse(localStorage.getItem("expenses")) || [];
let currentTheme = localStorage.getItem("theme") || "light";
let editId = null;
let deleteId = null;
let myChart = null;

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
    const ctx = document.getElementById('expenseChart').getContext('2d');
    const data = getChartData();

    if (expenses.length === 0) {
        document.getElementById('noDataMessage').classList.remove('d-none');
        document.getElementById('expenseChart').classList.add('d-none');
        return;
    }

    document.getElementById('noDataMessage').classList.add('d-none');
    document.getElementById('expenseChart').classList.remove('d-none');

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
                        padding: 20,
                        color: currentTheme === 'dark' ? '#94a3b8' : '#64748b',
                        font: { family: 'Outfit', size: 12 }
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
    expenses.forEach(exp => {
        data[exp.category] = (data[exp.category] || 0) + exp.amount;
    });
    return data;
}

function updateChart() {
    if (!myChart) {
        initChart();
        return;
    }

    const data = getChartData();
    if (expenses.length === 0) {
        document.getElementById('noDataMessage').classList.remove('d-none');
        document.getElementById('expenseChart').classList.add('d-none');
        return;
    }

    document.getElementById('noDataMessage').classList.add('d-none');
    document.getElementById('expenseChart').classList.remove('d-none');

    myChart.data.labels = Object.keys(data);
    myChart.data.datasets[0].data = Object.values(data);
    myChart.data.datasets[0].backgroundColor = Object.keys(data).map(cat => CATEGORY_COLORS[cat] || '#CBD5E1');
    myChart.update();
}

function updateChartTheme() {
    if (!myChart) return;
    myChart.options.plugins.legend.labels.color = currentTheme === 'dark' ? '#94a3b8' : '#64748b';
    myChart.update();
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
        return matchTerm && matchCat && matchFrom && matchTo;
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
    document.getElementById("nav-home").classList.add("active");
    document.getElementById("nav-expenses").classList.remove("active");
    updateChart();
    lucide.createIcons();
}

function showExpenses(filter = 'all') {
    document.getElementById("home").style.display = "none";
    document.getElementById("expenses").style.display = "block";
    document.getElementById("nav-home").classList.remove("active");
    document.getElementById("nav-expenses").classList.add("active");
    
    if (filter === 'pending') {
        document.getElementById("filterCategory").value = "";
        // Optional: you could add a 'Status' filter to UI, but for now we just show all and highlight
    }
    
    renderExpenses();
    lucide.createIcons();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ================================
// INITIALIZATION
// ================================

document.addEventListener("DOMContentLoaded", () => {
    initTheme();
    
    // Set default date to today
    document.getElementById("date").value = new Date().toISOString().split("T")[0];
    document.getElementById("date").setAttribute("max", new Date().toISOString().split("T")[0]);

    renderRecentExpenses();
    updateDashboardStats();
    initChart();
    lucide.createIcons();
});
