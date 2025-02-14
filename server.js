const express = require('express');
const app = express();

// Устанавливаем EJS как шаблонизатор
app.set('view engine', 'ejs');

// Данные студента (можно заменить на JSON или БД)
const student = {
  name: 'Іван Петренко',
  age: 20,
  university: 'Київський національний університет',
  course: 2
};

// Роут для отображения страницы студента
app.get('/student', (req, res) => {
  res.render('student', { student });
});

app.get('/', (req, res) => {
  res.get("Sometgin");
})

// Запуск сервера
app.listen(3000, () => console.log('Сервер запущен на http://localhost:3000'));
