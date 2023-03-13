const express = require("express");
const { Router } = express;
const routerRegister= new Router();
const passport = require("passport");

const {getRegister, getFailRegister}= require("../Services/registerServices")
routerRegister.get("/register",getRegister );
routerRegister.get("/failregister", getFailRegister );
routerRegister.post(
    "/register",
    passport.authenticate("register", {
      failureRedirect: "/failregister",
      successRedirect: "/datos",
    })
  );


module.exports = {routerRegister}