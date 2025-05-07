const db = require('../db');

exports.getRegister = (req, res) => {
    res.render("register");
}

exports.userRegistration = async (req, res) => {
    const { username, password } = req.body;
    
    try {
        // Check if user exists
        const [existingUsers] = await db.query(
            'SELECT * FROM authors WHERE username = ?', 
            [username]
        );
        
        if (existingUsers.length > 0) {
            return res.json({ success: false, message: "Користувач вже існує!" });
        }

        // Create new user
        const [result] = await db.query(
            'INSERT INTO authors (username, password) VALUES (?, ?)',
            [username, password]
        );
        
        res.json({ success: true, message: "Реєстрація успішна!" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Помилка сервера" });
    }
}

exports.userLogin = async (req, res) => {
    const { username, password } = req.body;
    
    try {
        const [users] = await db.query(
            'SELECT * FROM authors WHERE username = ? AND password = ?',
            [username, password]
        );
        
        if (users.length > 0) {
            const user = users[0];
            req.session.user = { 
                id: user.id, 
                username: user.username, 
                password: user.password 
            };
            res.redirect("/");
        } else {
            res.send("❌ Невірний логін або пароль. <a href='/login'>Спробувати ще раз</a>");
        }
    } catch (err) {
        console.error(err);
        res.status(500).send("Помилка сервера");
    }
}

exports.getloginPage = (req, res) => {
    res.render("login");
}

exports.checkAuth = (req, res) => {
    if (req.session.user) {
        res.json({ isAuthenticated: true, username: req.session.user.username });
    } else {
        res.json({ isAuthenticated: false });
    }
}

exports.getLogOut = (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).send("Помилка при виході");
        }
        res.redirect("/login");
    });
}