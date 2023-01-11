const mongoose = require("mongoose") ;

const mensajesCollection = "mensajes"

const authorSchema = new mongoose.Schema({
        email: String,
        nombre: String,
        apellido: String,
        edad: String,
        alias: String,
        avatar: String,
        _id: false,

    })

const MensajeSchema = new mongoose.Schema(
    {author: authorSchema,
    text: String,
    id: Number,
    _id: false,})

const MensajesSchema = new mongoose.Schema(
        {id: String,
        messages:[MensajeSchema],
        _id: false,})

const mensajes = mongoose.model(mensajesCollection, MensajesSchema)

module.exports = {mensajes};


