// ================================
// GLOBAL DATA
// ================================

let expenses = JSON.parse(localStorage.getItem("expenses")) || [];
let editId = null;
let deleteId = null;

// ================================
// ADD / UPDATE HANDLER
// ================================

function handleSubmit() {
    if (editId === null) {
        addExpense();
    } else {
        updateExpense();
    }
}

// ================================
// ADD EXPENSE
// ================================

function addExpense() {
    const amount = document.getElementById("amount").value;
    const category = document.getElementById("category").value;
    const date = document.getElementById("date").value;
    const description = document.getElementById("description").value;

    if (!amount || !category || !date) {
        new bootstrap.Modal(
            document.getElementById("validationModal")
        ).show();
        return;
    }

    const expense = {
        id: Date.now(),
        amount: Number(amount),
        category,
        date,
        description
    };

    expenses.push(expense);
    saveAndRender();
    clearForm();
}

// ================================
// RENDER ALL EXPENSES (EXPENSE PAGE)
// ================================

function renderExpenses(list = expenses) {
    const tableBody = document.getElementById("expenseTable");
    if (!tableBody) return;

    tableBody.innerHTML = "";
    let total = 0;

    list.forEach(exp => {
        total += exp.amount;

        tableBody.innerHTML += `
            <tr>
                <td>${exp.date}</td>
                <td>${exp.category}</td>
                <td>₹${exp.amount}</td>
                <td>${exp.description || "-"}</td>
                <td>
                    <button class="btn btn-warning btn-sm me-1"
                        onclick="startEdit(${exp.id})">
                        Edit
                    </button>
                    <button class="btn btn-danger btn-sm"
                        onclick="deleteExpense(${exp.id})">
                        Delete
                    </button>
                </td>
            </tr>
        `;
    });

    document.getElementById("totalAmount").innerText = total;
}

// ================================
// RECENT EXPENSES (HOME PAGE)
// ================================

function renderRecentExpenses() {
    const table = document.getElementById("recentExpenseTable");
    if (!table) return;

    table.innerHTML = "";

    if (expenses.length === 0) {
        table.innerHTML = `
            <tr>
                <td colspan="3" class="text-center text-muted">
                    No expenses added yet
                </td>
            </tr>
        `;
        return;
    }

    const recent = [...expenses]
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 3);

    recent.forEach(exp => {
        table.innerHTML += `
            <tr>
                <td>${exp.date}</td>
                <td>${exp.category}</td>
                <td>₹${exp.amount}</td>
            </tr>
        `;
    });
}

// ================================
// DELETE EXPENSE
// ================================

function deleteExpense(id) {
    deleteId = id;
    new bootstrap.Modal(
        document.getElementById("deleteModal")
    ).show();
}

function confirmDelete() {
    if (deleteId === null) return;

    expenses = expenses.filter(exp => exp.id !== deleteId);
    deleteId = null;

    saveAndRender();
    renderRecentExpenses();

    bootstrap.Modal.getInstance(
        document.getElementById("deleteModal")
    ).hide();
}

// ================================
// EDIT EXPENSE
// ================================

function startEdit(id) {
    const exp = expenses.find(e => e.id === id);
    if (!exp) return;

    document.getElementById("amount").value = exp.amount;
    document.getElementById("category").value = exp.category;
    document.getElementById("date").value = exp.date;
    document.getElementById("description").value = exp.description;

    editId = id;
    document.getElementById("submitBtn").innerText = "Update Expense";
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
}

// ================================
// FILTERS
// ================================

function applyFilters() {
    const category = document.getElementById("filterCategory").value;
    const fromDate = document.getElementById("filterFromDate").value;
    const toDate = document.getElementById("filterToDate").value;
    const sortType = document.getElementById("filterSort").value;

    let result = [...expenses];

    if (category) {
        result = result.filter(exp => exp.category === category);
    }

    if (fromDate) {
        result = result.filter(exp => new Date(exp.date) >= new Date(fromDate));
    }

    if (toDate) {
        result = result.filter(exp => new Date(exp.date) <= new Date(toDate));
    }

    if (sortType === "dateDesc") {
        result.sort((a, b) => new Date(b.date) - new Date(a.date));
    } else if (sortType === "dateAsc") {
        result.sort((a, b) => new Date(a.date) - new Date(b.date));
    } else if (sortType === "amountAsc") {
        result.sort((a, b) => a.amount - b.amount);
    } else if (sortType === "amountDesc") {
        result.sort((a, b) => b.amount - a.amount);
    } else if (sortType === "categoryAsc") {
        result.sort((a, b) => a.category.localeCompare(b.category));
    }

    renderExpenses(result);
}

function clearFilters() {
    document.getElementById("filterCategory").value = "";
    document.getElementById("filterFromDate").value = "";
    document.getElementById("filterToDate").value = "";
    document.getElementById("filterSort").value = "";

    renderExpenses();
}

// ================================
// UTILITIES
// ================================

function clearForm() {
    document.getElementById("amount").value = "";
    document.getElementById("category").value = "";
    document.getElementById("date").value = "";
    document.getElementById("description").value = "";
}

function saveAndRender() {
    localStorage.setItem("expenses", JSON.stringify(expenses));
    renderExpenses();
    renderRecentExpenses();
}

// ================================
// NAVIGATION
// ================================

function showHome() {
    document.getElementById("home").style.display = "block";
    document.getElementById("recentExpensesCard").style.display = "block";
    document.getElementById("expenses").style.display = "none";

    renderRecentExpenses();
}


function showExpenses() {
    document.getElementById("home").style.display = "none";
    document.getElementById("recentExpensesCard").style.display = "none";
    document.getElementById("expenses").style.display = "block";

    renderExpenses();
}


// ================================
// INITIAL LOAD
// ================================

document.addEventListener("DOMContentLoaded", () => {
    showHome();
    renderExpenses();
});

document.addEventListener("DOMContentLoaded", () => {
    const today = new Date().toISOString().split("T")[0];
    document.getElementById("date").setAttribute("max", today);
});
