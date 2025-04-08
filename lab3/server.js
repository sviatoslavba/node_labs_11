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
    secret: 'super-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true,
        maxAge: 1000 * 60 * 60 * 24,
        sameSite: "strict",
        secure: false
    }
}));


app.use(morgan('dev'));
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));



const petitions = JSON.parse(fs.readFileSync(path.join(__dirname, 'petitions.json'), 'utf8'));

app.use((req, res, next) => {
    changePetStatus(petitions);
    next();
});

const usersPath = path.join(__dirname, "data/users.json");
const getUsers = () => JSON.parse(fs.readFileSync(usersPath, "utf8"));

const saveUsers = (users)=>{
    return fs.promises.writeFile(usersPath, JSON.stringify(users, null, 2))
        .then(()=>console.log("saved users"))
        .catch((err)=>console.error("Error saving users",err));
};


function getLastUserId() {
    const users = getUsers();
    if (users.length === 0) return 0; // Якщо немає користувачів, почнемо з 1
    const lastUser = users[users.length - 1];
    return lastUser.id; // Повертаємо останнє id
}

const changePetStatus =  function(petitions){
    const now = Date.now();
    const random = Math.floor(Math.random() * 3);
    const statuses  = ['rejected','accepted','on-review','expired',"In_Progress"];


    petitions.forEach(petition => {
        if(petition.status === "In_Progress"){
            if(petition.petition_current >= 25000){
                petition.status = statuses[random];
            }
            else if(petition.expiry_date < now ){
                petition.status = statuses[3];
            }
            else{
                petition.status = "In_Progress"
            }
        }
    });
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


    const newUser = {
        id: getLastUserId() + 1,
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
        req.session.user = { id: user.id, username: user.username, password:user.password };
        res.redirect("/");
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


app.get(["/","/api/petitions"], (req, res) => {
    const activePetitions = petitions.filter(petition =>petition.status ==="In_Progress");
    res.render('index', {petitions:activePetitions});

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

const statusMap = {
    "rejected": "Відхилено",
    "accepted": "Прийнято",
    "on-review": "На розгляді",
    "expired": "Термін вийшов"
};

app.get("/api/completed-petitions",(req, res)=>{
    const labels = ["На розгляді","Прийнято","Відхилено","Термін вийшов"]
    const completedPetitions = petitions.filter(petition=>petition.status !== "In_Progress")
    res.render("completed-petitions",{
        petitions:completedPetitions,
        statusMap
    });
});

app.get("/api/my-petitions",(req,res)=>{
    if (!req.session.user) {
        return res.redirect("/login");
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
        expiry_date:formatted_expiry_date,
        status:"In_Progress"

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

app.get("/api/petition-deletion", (req, res) => {
    const petitionID = req.query.id;
    res.render("delete-form",{petitionID});

})

app.delete("/api/delete",(req,res)=>{
    console.log("От клиента пришёл пароль:", req.body.password);

    if(!req.session.user){
        return res.status(401).send({
            message:"Авторизуйтеся для видалення петиції"
        })
    }
    const {password, petitionID} = req.body
    console.log(password);
    const user = req.session.user;

    if(user.password !== password){
        return res.status(403).json({
            status:'fail',
            message:"Невірний пароль"
        })
    }

    const index = petitions.findIndex(p => p.id === petitionID * 1);
    if (index === -1) {
        return res.status(404).json({ message: "Петиція не знайдена" });
    }

    petitions.splice(index,1);
    fs.writeFileSync("petitions.json", JSON.stringify(petitions, null, 2));
    return res.status(200).json({ message: "Петиція видалена" });
});

app.listen(PORT,()=>console.log(`Server started on ${PORT}`));