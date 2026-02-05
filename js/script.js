// ================================
// GLOBAL DATA (JSON + localStorage)
// ================================

let expenses = JSON.parse(localStorage.getItem("expenses")) || [];
let editId = null;

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
         const modal = new bootstrap.Modal(
           document.getElementById("validationModal")
        );
        modal.show();
        return;
    }


    const expense = {
        id: Date.now(),
        amount: Number(amount),
        category: category,
        date: date,
        description: description
    };

    expenses.push(expense);
    saveAndRender();
    clearForm();
}

// ================================
// RENDER EXPENSES (DEFAULT VIEW)
// ================================

function renderExpenses() {
    const tableBody = document.getElementById("expenseTable");
    tableBody.innerHTML = "";

    let total = 0;

    expenses.forEach(exp => {
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
// DELETE EXPENSE
// ================================

function deleteExpense(id) {
    expenses = expenses.filter(exp => exp.id !== id);
    saveAndRender();
}

// ================================
// EDIT EXPENSE
// ================================

function startEdit(id) {
    const exp = expenses.find(e => e.id === id);

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
    const date = document.getElementById("filterDate").value;

    let filtered = expenses;

    if (category) {
        filtered = filtered.filter(exp => exp.category === category);
    }

    if (date) {
        filtered = filtered.filter(exp => exp.date === date);
    }

    renderFilteredExpenses(filtered);
}

function renderFilteredExpenses(list) {
    const tableBody = document.getElementById("expenseTable");
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

function clearFilters() {
    document.getElementById("filterCategory").value = "";
    document.getElementById("filterDate").value = "";
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
}

// ================================
// INITIAL LOAD
// ================================

document.addEventListener("DOMContentLoaded", renderExpenses);
