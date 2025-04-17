const fs = require('fs');
const path = require("path");

const usersPath = path.join(__dirname, "data/users.json");

const getUsers = () => JSON.parse(fs.readFileSync(usersPath, "utf8"));

function getLastUserId() {
    const users = getUsers();
    if (users.length === 0) return 0; // Якщо немає користувачів, почнемо з 1
    const lastUser = users[users.length - 1];
    return lastUser.id; // Повертаємо останнє id
}

const saveUsers = (users)=>{
    return fs.promises.writeFile(usersPath, JSON.stringify(users, null, 2))
        .then(()=>console.log("saved users"))
        .catch((err)=>console.error("Error saving users",err));
};

exports.getRegister = (req,res)=>{
    res.render("register");
}

exports.userRegistration = (req,res)=>{
    const { username, password } = req.body;
    let users = getUsers();

    if (users.find(user => user.username === username)) {
        return res.json({ success: false, message: "Користувач вже існує!" });
    }


    const newUser = {
        id: getLastUserId() + 1,
        username,
        password
    };
    users.push(newUser);
    saveUsers(users).then(res=>console.log(res));
    res.json({ success: true, message: "Реєстрація успішна!" });
}

exports.userLogin=(req,res)=>{
    const { username, password } = req.body;
    let users = getUsers();
    const user = users.find(u => u.username === username && u.password === password);

    if (user) {
        req.session.user = { id: user.id, username: user.username, password:user.password };
        res.redirect("/");
    } else {
        res.send("❌ Невірний логін або пароль. <a href='/login'>Спробувати ще раз</a>");
    }
}

exports.getloginPage= (req,res)=>{
    res.render("login");
}

exports.checkAuth = (req,res)=>{
    if (req.session.user) {
        res.json({ isAuthenticated: true, username: req.session.user.username });
    } else {
        res.json({ isAuthenticated: false });
    }
}

exports.getLogOut = (req,res)=>{
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).send("Помилка при виході");
        }
        res.redirect("/login");
    });
}

exports.saveUsers = saveUsers;
