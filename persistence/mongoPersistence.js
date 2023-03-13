  //-------------------------------------------------------------------------------------------------------//
  //MongoDB y faker//
  //-------------------------------------------------------------------------------------------------------//
  //importo los modelos
  const { mensajes, usuarios } = require("../models/modelsMongoose");
  //importo los containers
  const {
    MongooseContainer,
    MongooseContainerUsuarios,
  } = require("../containers/mongooseContainer.js");
  //Creo las instancias para usar las bases de datos
  const mongooseDB = new MongooseContainer(
    process.env.MONGOURLmensajes,
    mensajes
  );
  const mongooseDBusers = new MongooseContainerUsuarios(
    process.env.MONGOURLusuarios,
    usuarios
  );
  const { fiveProducts } = require("../utils/productosFaker");

  module.exports = {mongooseDB, mongooseDBusers, fiveProducts}