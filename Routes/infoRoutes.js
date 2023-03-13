const express = require("express");
const { Router } = express;
const routerInfo= new Router();
const  {getInfo} = require("../Services/infoServices")

routerInfo.get("/info", getInfo);



module.exports = {routerInfo};