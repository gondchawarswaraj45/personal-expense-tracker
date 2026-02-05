# Personal Expense Tracker

A modern, responsive **Personal Expense Tracker** web application built using **HTML, CSS, JavaScript, and Bootstrap**.  
The application allows users to record, edit, filter, and manage daily expenses with data stored locally in the browser using **JSON and localStorage**.

---

## 🔹 Features

- Add new expenses with amount, category, date, and description
- Edit existing expense entries
- Delete individual expenses
- Filter expenses by category and date
- Automatic total expense calculation
- Persistent data storage using browser localStorage (JSON-based)
- Modern UI with Bootstrap components
- Custom modal popup for form validation (no browser alerts)
- Responsive design for desktop and mobile devices

---

## 🔹 Technologies Used

- **HTML5** – Structure of the application  
- **CSS3** – Styling and layout  
- **JavaScript (ES6)** – Application logic and interactivity  
- **Bootstrap 5** – Responsive UI components  
- **JSON** – Data representation  
- **Browser localStorage** – Client-side data persistence  

---


## 🔹 Project Structure

```text
personal-expense-tracker/
├── index.html
├── css/
│   └── style.css
├── js/
│   └── script.js
├── assets/
│   └── expenses1.jpg
├── data/
│   └── sample-expenses.json
└── README.md


---

## 🔹 How It Works

- Expense entries are stored as **JSON objects** inside the browser’s **localStorage**
- On page load, stored data is retrieved using `JSON.parse()`
- Any add, edit, or delete operation updates localStorage using `JSON.stringify()`
- No backend or database is used, as this project focuses on frontend development

---

## 🔹 How to Run the Project

1. Clone the repository:
   ```bash
   git clone https://github.com/YOUR_USERNAME/personal-expense-tracker.git

👤 Author

Swaraj Gondchawar
Built as a Web Development project using HTML, CSS, JavaScript, and Bootstrap.

