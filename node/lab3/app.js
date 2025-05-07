const express = require('express');

const path = require("path");
const session = require("express-session");
const morgan = require("morgan");
const bodyParser = require("body-parser");

const petitionController = require("./controllers/petitionControllers");
const userController = require("./controllers/userControllers");

const petitionRouter = require('./routes/petitionRoutes');
const userRouter = require("./routes/userRoutes");

const app = express();

app.use(express.json());



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

app.use((req, res, next) => {
    petitionController.changePetStatus();
    next();
});

app.use('/', petitionRouter);
app.use('/', userRouter);

module.exports = app;