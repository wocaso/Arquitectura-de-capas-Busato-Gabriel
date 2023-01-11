const {faker} = require("@faker-js/faker");
faker.locale = "es"

function generarProducto(){
    return {
        tittle: faker.commerce.product(),
        price: faker.commerce.price(1, 300,0),
        thumbnail: faker.image.food( 200,200 ,true),
    }
}

function fiveProducts(){
    let productos = []
for(let i = 0; i<5; i++){
    let nuevoProducto = generarProducto();
    productos.push(nuevoProducto);
}
    return productos;
}



module.exports = {fiveProducts};

