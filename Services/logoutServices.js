function getLogout(req, res){
    req.logout((err) => {
      res.redirect("/login");
    });
  }

  module.exports = {getLogout};