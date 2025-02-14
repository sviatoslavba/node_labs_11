const express = require("express");
const app = express();

app.set("view engine", "ejs");
app.use(express.static("public"));

const teamMembers = [
  { id: 1, name: "Антюк Юлія", bio: "Короткий текст...", hobbies: "Перелік....", info: "Ще щось треба написати...", img_url: "https://i.pinimg.com/736x/24/58/ed/2458ed5c912423af578888f2bab53031.jpg" },
  { id: 2, name: "Башлик Святослав", bio: "Короткий текст...", hobbies: "Перелік....", info: "Ще щось треба написати...", img_url: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQKK1zSX_YjOvNSHlqwuy84X_WMWRSHNigzpA&s" },
  { id: 3, name: "Гарковенко Денис", bio: "Короткий текст...", hobbies: "Перелік....", info: "Ще щось треба написати...", img_url: "https://www.dailypaws.com/thmb/j88hOaoRRVrnKfy7kYAlae4Ggyc=/1500x0/filters:no_upscale():max_bytes(150000):strip_icc()/white-cat-orange-sofa-1217549100-1-2000-8973257d1437414f8ec5f570d1c124a3.jpg" },
  { id: 4, name: "Лодатко Олександр", bio: "Короткий текст...", hobbies: "Перелік....", info: "Ще щось треба написати...", img_url: "https://miro.medium.com/v2/resize:fit:1080/0*A7MUqyCLvZDcHkfM.jpg" },
  { id: 5, name: "Нечипоренко Олександр", bio: "Короткий текст...", hobbies: "Перелік....", info: "Ще щось треба написати...", img_url: "https://rukminim2.flixcart.com/image/850/1000/kph8h3k0/poster/r/y/r/large-adorable-cat-poster-cute-kittens-poster-cat-poster-funny-original-imag3p7vhbhmwb5p.jpeg?q=90&crop=false" }
];

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/public/index.html");
});

app.get("/member/:id", (req, res) => {
  const member = teamMembers.find(m => m.id == req.params.id);
  if (member) {
    res.render("member", { member });
  } else {
    res.status(404).send("ERROR NOT FOUND");
  }
});

app.listen(3000, () => {
  console.log("Сервер запущено на http://localhost:3000");
});
