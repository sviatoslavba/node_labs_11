// Встановлення необхідних пакетів
const express = require("express");
const path = require("path");

const app = express();
const PORT = 3000;

// Налаштування EJS як шаблонізатора
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Маршрут для відображення динамічної сторінки
app.get("/", (req, res) => {
  const data = {
    title: "Головна сторінка",
    message: "Ласкаво просимо на наш сайт!",
    items: ["Елемент 1", "Елемент 2", "Елемент 3"],
  };
  res.render("index", data);
});

// Запуск сервера
app.listen(PORT, () => {
  console.log(`Сервер працює на http://localhost:${PORT}`);
});
