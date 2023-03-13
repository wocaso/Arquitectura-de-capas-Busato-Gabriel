const express = require("express");
const { Router } = express;
const routerLogin = new Router();
const passport = require("passport");

const {getLogin, failLogin} = require("../Services/loginServices")

routerLogin.get("/login", getLogin)
routerLogin.get("/faillogin", failLogin)

routerLogin.post(
    "/login",
    passport.authenticate("login", {
      failureRedirect: "/faillogin",
      successRedirect: "/datos",
    })
  );

module.exports = {routerLogin}

