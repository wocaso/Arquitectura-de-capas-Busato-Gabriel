const express = require("express");
const { Router } = express;
const routerLogout= new Router();
const {getLogout} = require("../Services/logoutServices")
routerLogout.get("/logout", getLogout);

module.exports = {routerLogout};
