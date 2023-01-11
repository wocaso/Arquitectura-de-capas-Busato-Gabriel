const knex = require('knex');

class ClienteSQLproductos {

    constructor(options) {
        this.knex = knex(options)
    }

    crearTabla() {
        return this.knex.schema.dropTableIfExists('productos')
            .finally(() => {
                return this.knex.schema.createTable("productos", table =>{
                    table.increments("id").primary();
                    table.string("tittle", 50).notNullable();
                    table.float("price")
                    table.string("thumbnail", 80).notNullable();
                })
            })
    }

    insertarProductos(productos) {
        return this.knex('productos').insert(productos)
    }

    listarProductos() {
        return this.knex('productos').select('*')
    }

    close() {
        this.knex.destroy()
    }
}

module.exports = {ClienteSQLproductos}