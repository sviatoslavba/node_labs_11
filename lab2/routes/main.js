const express = require("express");
const router = express.Router();
const path = require("path");

router.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../static/about.html"));
});

router.get("/student", (req, res) => {
  const student = {
    name: "Іван Петренко",
    group: "ІП-23",
    email: "ivan.petrenko@example.com",
    photo: "../images/student.png",
  };
  res.render("index", { student });
});

module.exports = router;
