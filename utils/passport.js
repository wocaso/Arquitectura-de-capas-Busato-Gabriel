function requireAuthentication(req, res, next) {
    if (req.isAuthenticated()) {
      next();
    } else {
      res.redirect("/login");
    }
  }

  module.exports = {requireAuthentication};