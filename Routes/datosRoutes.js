const express = require("express");
const { Router } = express;
const routerDatos= new Router();
const passport = require("passport");
const {getDatos} = require("../Services/datosServices")

const {requireAuthentication} = require("../utils/passport")


routerDatos.get("/datos", requireAuthentication,getDatos );

module.exports = {routerDatos};