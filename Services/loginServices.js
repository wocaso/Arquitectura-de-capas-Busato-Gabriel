function getLogin(req, res){
    if (req.isAuthenticated()) {
      res.redirect("/datos");
    } else {
      res.render("login");
    }
  };

  function failLogin(req, res){
    res.render("login-error");
  };
  module.exports = {getLogin, failLogin};