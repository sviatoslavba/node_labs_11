const express = require('express');
const userControllers = require('./../controllers/userControllers');

const router = express.Router();

router.route("/register")
    .get(userControllers.getRegister)
    .post(userControllers.userRegistration)

router.route("/login")
    .get(userControllers.getloginPage)
    .post(userControllers.userLogin)

router.route("/check-auth")
    .get(userControllers.checkAuth)

router.route("/logout")
    .get(userControllers.getLogOut)

module.exports = router