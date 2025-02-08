const express = require("express");
const app = express();

app.get("/", (req, res) => {
  res.send("Express працює!");
});

app.listen(3000, () => {
  console.log("Сервер запущено на http://localhost:3000");
});
