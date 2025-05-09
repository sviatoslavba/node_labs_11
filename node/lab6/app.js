const express = require('express');

const path = require("path");
const session = require("express-session");
const morgan = require("morgan");
const bodyParser = require("body-parser");
const db = require('./db');

const petitionController = require("./controllers/petitionControllers");
const userController = require("./controllers/userControllers");

const petitionRouter = require('./routes/petitionRoutes');
const userRouter = require("./routes/userRoutes");

const app = express();

app.use(express.json());

async function testConnection() {
    try {
        const [rows] = await db.query('SELECT 1 + 1 AS solution');
        console.log('Database connection successful! Result:', rows[0].solution);
    } catch (err) {
        console.error('Database connection failed:', err);
    }
}


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

app.use(async (req, res, next) => {
    try {
        await petitionController.changePetStatus();
        next();
    } catch (err) {
        console.error("Error updating petition statuses:", err);
        next(err);
    }
});

app.use('/', petitionRouter);
app.use('/', userRouter);

module.exports = app;