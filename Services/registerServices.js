function getRegister(req, res){
    res.render("register");
  }

function getFailRegister(req, res){
    res.render("register-error");
  }  


  module.exports = {getRegister, getFailRegister};