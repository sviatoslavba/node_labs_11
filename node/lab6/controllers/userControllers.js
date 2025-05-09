const { Author, sequelize } = require('../models');
const { Op } = require('sequelize');

exports.getRegister = (req, res) => {
  res.render("register");
};

exports.userRegistration = async (req, res) => {
  const { username, password, confirmPassword } = req.body;
  
  // Додатковий вивід для дебагінгу
  console.log('Received data:', { username, password, confirmPassword });

  if (password !== confirmPassword) {
    console.log('Password mismatch:', password, '!=', confirmPassword);
    return res.status(400).json({ 
      success: false, 
      message: "Паролі не співпадають!" 
    });
  }

  const t = await sequelize.transaction();

  try {
    const existingUser = await Author.findOne({
      where: { username },
      transaction: t
    });
    
    if (existingUser) {
      await t.rollback();
      return res.status(400).json({ 
        success: false, 
        message: "Користувач вже існує!" 
      });
    }

    const newUser = await Author.create({
      username,
      password
    }, { transaction: t });

    await t.commit();
    
    return res.status(201).json({ 
      success: true, 
      message: "Реєстрація успішна!",
      user: {
        id: newUser.id,
        username: newUser.username
      }
    });
  } catch (err) {
    await t.rollback();
    console.error('Registration error:', err);
    return res.status(500).json({ 
      success: false, 
      message: "Помилка сервера: " + err.message 
    });
  }
};

exports.getloginPage = (req, res) => {
  res.render("login");
};

exports.userLogin = async (req, res) => {
  const { username, password } = req.body;
  
  try {
    const user = await Author.findOne({
      where: { 
        [Op.and]: [
          { username },
          { password }
        ]
      }
    });
    
    if (user) {
      req.session.user = { 
        id: user.id, 
        username: user.username, 
        password: user.password 
      };
      
      // Перевіряємо, чи це AJAX-запит
      if (req.xhr || req.headers.accept.indexOf('json') > -1) {
        return res.json({ 
          success: true, 
          redirectUrl: "/api/my-petitions" 
        });
      }
      
      return res.redirect("/api/my-petitions");
    } else {
      if (req.xhr || req.headers.accept.indexOf('json') > -1) {
        return res.status(401).json({ 
          success: false, 
          message: "Невірний логін або пароль" 
        });
      }
      
      return res.send(
        "❌ Невірний логін або пароль. <a href='/login'>Спробувати ще раз</a>"
      );
    }
  } catch (err) {
    console.error(err);
    
    if (req.xhr || req.headers.accept.indexOf('json') > -1) {
      return res.status(500).json({ 
        success: false, 
        message: "Помилка сервера" 
      });
    }
    
    res.status(500).send("Помилка сервера");
  }
};

exports.checkAuth = async (req, res) => {
  try {
    if (req.session.user) {
      const user = await Author.findByPk(req.session.user.id);
      
      if (user) {
        return res.json({ 
          isAuthenticated: true, 
          username: user.username 
        });
      }
    }
    
    res.json({ isAuthenticated: false });
  } catch (err) {
    console.error("Помилка при перевірці авторизації:", err);
    res.status(500).json({ isAuthenticated: false });
  }
};

exports.getLogOut = (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error("Помилка при виході:", err);
      
      if (req.xhr || req.headers.accept.indexOf('json') > -1) {
        return res.status(500).json({ 
          success: false, 
          message: "Помилка при виході" 
        });
      }
      
      return res.status(500).send("Помилка при виході");
    }
    
    if (req.xhr || req.headers.accept.indexOf('json') > -1) {
      return res.json({ 
        success: true, 
        redirectUrl: "/login" 
      });
    }
    
    res.redirect("/login");
  });
};