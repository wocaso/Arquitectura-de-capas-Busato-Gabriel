const {schema } = require("normalizr");

const author = new schema.Entity("author",{},{idAttribute: 'email'});

const msj = new schema.Entity("message", {
  author: author,
});

const msjsSchema = new schema.Entity("messages", {
  messages: [msj],
})
module.exports = {msjsSchema};