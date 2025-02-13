const express = require("express");
const app = express();

app.get("/", (req, res) => {
  res.send("Hello KPI!");
});
app.get("/test", (req, res) => {
  res.send("Hello 52!");
})

app.listen(3000, () => {
  console.log("Сервер запущено на http://localhost:3000");
});
