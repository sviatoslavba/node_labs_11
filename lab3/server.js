'use strict';

const express = require('express');
const path = require('path');
const session = require("express-session");
const bodyParser = require("body-parser");
const fs = require('fs');
const morgan = require('morgan');

const app = express()
const PORT = 3000;


app.set('views', path.join(__dirname, 'views'));
app.set("view engine", "ejs");

app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
    secret: "my_secret_key",
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }
}));

app.use(morgan('dev'));
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());


const petitions = JSON.parse(fs.readFileSync(path.join(__dirname, 'petitions.json'), 'utf8'));

function getUsers() {
    const data = fs.readFileSync("data/users.json", "utf8");
    return JSON.parse(data);
}


function saveUsers(users) {
    fs.writeFileSync("data/users.json", JSON.stringify(users, null, 2));
}

function getLastUserId() {
    const users = getUsers();
    if (users.length === 0) return 0; // Якщо немає користувачів, почнемо з 1
    const lastUser = users[users.length - 1];
    return lastUser.id; // Повертаємо останнє id
}

app.get("/register", (req, res) => {
    res.render("register");
})

app.post("/register", (req, res) => {
    const { username, password } = req.body;
    let users = getUsers();

    // Перевіряємо, чи вже існує такий користувач
    if (users.find(user => user.username === username)) {
        return res.json({ success: false, message: "Користувач вже існує!" });
    }

    // Створюємо нового користувача з ітераційним id
    const newUser = {
        id: getLastUserId() + 1, // Новий id буде більше на 1 від останнього
        username,
        password
    };
    users.push(newUser);
    saveUsers(users);

    res.json({ success: true, message: "Реєстрація успішна!" });
});

app.post("/login", (req, res) => {
    const { username, password } = req.body;
    let users = getUsers();
    const user = users.find(u => u.username === username && u.password === password);

    if (user) {
        req.session.user = { id: user.id, username: user.username };
        res.redirect("/"); // Перенаправлення на головну сторінку після успішної авторизації
    } else {
        res.send("❌ Невірний логін або пароль. <a href='/login'>Спробувати ще раз</a>");
    }
});

app.get("/login", (req, res) => {
    res.render("login");
});

app.get("/check-auth", (req, res) => {
    if (req.session.user) {
        res.json({ isAuthenticated: true, username: req.session.user.username });
    } else {
        res.json({ isAuthenticated: false });
    }
});

app.get("/logout", (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).send("Помилка при виході");
        }
        res.redirect("/login");
    });
});

app.get("/my-petitions.html", (req, res) => {
    if (!req.session.user) {
        return res.redirect("/login");
    }
    res.sendFile(path.join(__dirname, "public", "my-petitions.html"));
});


app.get(["/","/api/petitions"], (req, res) => {
    res.render('index', {petitions});


})

app.get("/api/petition-creation", (req, res) => {
    res.render('create-petition');
})

app.get("/api/petition-overview/:id", (req, res) => {
    const petitionId = req.params.id;
    const petition = petitions.find(petition => petition.id === petitionId*1); // Conversion to a number by * 1

    if (!petition) {
        return res.status(404).send("Петиція не знайдена"); // convert to middleware
    }

    res.render('view-petition', {
        id: petition.id,
        title: petition.title,
        text: petition.text,
        author_id: petition.author_id,
        petition_current:petition.petition_current,
        expiry_date:petition.expiry_date
    });
})

app.patch("/api/petition-overview/:id", (req, res) => {
    if (!req.session.user) {
        return res.redirect("/login");
    }

    const userId = req.session.user.id;
    const petition = petitions.find(p => p.id === req.params.id * 1);

    if (!petition) {
        return res.status(404).json({ message: "Петиція не знайдена" });
    }

    if (!Array.isArray(petition.voters)) {
        petition.voters = [];
    }

    if (petition.voters.includes(userId)) {
        return res.status(400).json({ message: "Ви вже голосували за цю петицію" });
    }
    petition.petition_current += 1;
    petition.voters.push(userId);

    fs.writeFile("petitions.json", JSON.stringify(petitions, null, 2), (err) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ message: "Помилка запису файлу" });
        }
        return res.status(200).json({
            message: "Голос зараховано",
            petition_current: petition.petition_current
        });
    });
});


app.get("/api/my-petitions",(req,res)=>{
    if(!req.session.user){
        return  res.redirect("/login");
    }

    const sessionId = req.session.user.id;
    const usersPetitions = petitions.filter(usersPetitions=>usersPetitions.author_id === sessionId);

    res.render("my-petitions",{
        usersPetitions
    })
})


app.post("/api/petition-creation",(req, res) => {
    if(!req.session.user) {
        return res.status(401).send({
            message:"Авторизуйтеся для створення петиції"
        })
    }

    const {title, text} = req.body;


    if(!title || !text) {
        return  res.redirect("/login");
    }

    const author_id = req.session.user.id;
    const newId = petitions.length+1;
    const creation_date = new Date();
    const expiry_date = new Date();

    expiry_date.setMonth(creation_date.getMonth() + 1);

    const formatted_creation_date = creation_date.toISOString().split('T')[0];
    const formatted_expiry_date = expiry_date.toISOString().split('T')[0];

    const petition = {
        id:newId,
        author_id,
        title,
        text,
        petition_current:0,
        creation_date:formatted_creation_date,
        expiry_date:formatted_expiry_date

    }
    petitions.push(petition);

    fs.writeFile("petitions.json", JSON.stringify(petitions,null,2),(err)=>{
        if(err){
            console.error(err.message);
            return res.status(500).json({
                status:'fail',
                message:err.message,
            });
        }
        console.log("Дані були записані")
        res.status(200).json({
            status:'success',
            data:{
                petition
            }
        });

    });
});



app.listen(PORT,()=>console.log(`Server started on ${PORT}`));