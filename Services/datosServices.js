function getDatos(req, res){
    res.render("datos", {
      user: req.session.passport.user,
    });
  }

  module.exports = {getDatos};