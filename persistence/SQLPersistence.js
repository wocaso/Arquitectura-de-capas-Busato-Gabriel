const { options } = require("../ecommerce/options/mysqlconn.js");
const { ClienteSQLproductos } = require("../ecommerce/client");
async function conectarProductos() {
  const con = new ClienteSQLproductos(options);
  return con;
}

module.exports = {conectarProductos};

