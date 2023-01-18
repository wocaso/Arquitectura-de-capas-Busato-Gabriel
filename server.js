//-------------------------------------------------------------------------------------------------------//
//Config server express y socket.io//
//-------------------------------------------------------------------------------------------------------//
const express = require("express");
const handlebars = require("express-handlebars");
const { Server: HttpServer } = require("http");
const { Server: IOServer } = require("socket.io");
const app = express();
const httpServer = HttpServer(app);
const io = new IOServer(httpServer);
app.use(express.static("./public"));
//-------------------------------------------------------------------------------------------------------//
//MongoDB y faker//
//-------------------------------------------------------------------------------------------------------//
const  {mensajes}  = require("./models/modelsMongoose.js");
const {MongooseContainer} = require("./containers/mongooseContainer.js")
const URLmensajes = "mongodb://127.0.0.1:27017/mensajes"
const mongooseDB = new MongooseContainer(URLmensajes, mensajes);
const {fiveProducts} = require("./utils/productosFaker")
//-------------------------------------------------------------------------------------------------------//
//Normalizr//
//-------------------------------------------------------------------------------------------------------//

const {normalize, schema, denormalize} = require("normalizr")

//-------------------------------------------------------------------------------------------------------//
//SQL usado en la parte de productos basica.//
//-------------------------------------------------------------------------------------------------------//
const {options} = require("./ecommerce/options/mysqlconn.js");
const { ClienteSQLproductos} = require("./ecommerce/client");
async function conectarProductos() {
  const con = new ClienteSQLproductos(options);
  return con;
}
//-------------------------------------------------------------------------------------------------------//
//Handlebars//
//-------------------------------------------------------------------------------------------------------//
app.engine("handlebars", handlebars.engine());
app.set("views", "./public/views");
app.set("view engine", "handlebars");
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
//-------------------------------------------------------------------------------------------------------//
//MongoAtlas//
//-------------------------------------------------------------------------------------------------------//
const session = require("express-session")
const URLMongoAtlas = "mongodb+srv://admin:admin@cluster0.cmoai1f.mongodb.net/usuarios?retryWrites=true&w=majority"
const MongoStore = require("connect-mongo");
const advancedOptions = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}
app.use(session({
  store: MongoStore.create({
    mongoUrl: URLMongoAtlas,
    mongoOptions: advancedOptions
  }),
  secret: "HolaHola",
  resave: false,
  saveUninitialized: false,
  cookie:{
    maxAge: 60000
  }
}))
//-------------------------------------------------------------------------------------------------------//
//Inicializacion del server y gets.//
//-------------------------------------------------------------------------------------------------------//
const PORT = 8080;

httpServer.listen(PORT, () => {
  console.log("servidor escuchando en el puerto " + PORT);
});

app.get("/", async (req, res) => {
    if(req.query.user != null){
      req.session.user = req.query.user;
    }
    if(req.session.user){
      res.render("datos",{user: req.session.user});

    }else{
      res.render('login');
    }
});

app.get("/api/productos-test", (req, res) => {
  res.render("productosTest");
});

app.get("/logout", (req, res) => {
  const nombre = req.session.user;
req.session.destroy( err => {
  if (err){
    res.json({error: "Error al desloguearse", descripcion: err})
  } else {
    res.render("logout",{user: nombre})
  }
})
})

//-------------------------------------------------------------------------------------------------------//
// Usado para inicializar unos productos por defecto en SQL.//
//-------------------------------------------------------------------------------------------------------//
// const productos = [
//   {
//     tittle: "Microndas",
//     price: 5000,
//     thumbnail:
//       "https://cdn1.iconfinder.com/data/icons/home-tools-1/136/microwave-512.png",
//     id: 1,
//   },
//   {
//     tittle: "Horno",
//     price: 6500,
//     thumbnail:
//       "https://cdn1.iconfinder.com/data/icons/home-tools-1/136/stove-512.png",
//     id: 2,
//   },
//   {
//     tittle: "Aspiradora",
//     price: 3000,
//     thumbnail:"https://cdn0.iconfinder.com/data/icons/home-improvements-set-2-1/66/70-256.png",
//     id: 3,
//   },
//   {
//     tittle: "Licuadora",
//     price: 2000,
//     thumbnail:
//       "https://cdn1.iconfinder.com/data/icons/kitchen-and-food-2/44/blender-512.png",
//     id: 4,
//   }
// ];
// conectarProductos().then(res=>{
//   sql = res;
//   sql.crearTabla()
//     .then(() => {
//         console.log("Tabla productos creada")
//       return sql.insertarProductos(productos);
//     }).finally(() => {
//         sql.close();
//       });
// })
//-------------------------------------------------------------------------------------------------------//

io.on("connection", (socket) => {
  console.log("un cliente se ha conectado");
  mongooseDB.getAll().then((res)=>{
    let dataString =  JSON.stringify(res);
    let dataParse = JSON.parse(dataString);
    const msjsNorm = normalize(dataParse[0] , msjsSchema);
    socket.emit("messages", msjsNorm);
    // socket.emit("messages", res[0].messages);
  })
  conectarProductos().then((res) => {
    const sql = res;
    sql
      .listarProductos()
      .then((items) => {
        socket.emit("products", items);
      })
      .catch(() =>
        sql.crearTabla().then(() => {
          console.log("Tabla productos creada");
        })
      )
      .finally(() => {
        sql.close();
      });
  });

  socket.on("new-message", (data) => {
    mongooseDB.addNew(data).then(()=>{
      mongooseDB.getAll().then((res)=>{
        let dataString =  JSON.stringify(res);
        let dataParse = JSON.parse(dataString);
        const msjsNorm = normalize(dataParse[0] , msjsSchema);
        socket.emit("messages", msjsNorm);
      })
    })
  });
  socket.on("new-producto", (data) => {
    conectarProductos().then((res) => {
      const sql = res;
      sql
        .insertarProductos(data)
        .then(() =>
          sql.listarProductos().then((items) => {
            socket.emit("products", items);
          })
        )
        .finally(() => {
          sql.close();
        });
    });
  });

  socket.emit("productsFaker", fiveProducts());
});



// const mensajess = {
//   id: "coderChat",
//   messages: [
//     {
//       author: {
//         email: "Eduardo@gmail.com",
//         nombre: "Eduardo",
//         apellido: "Bustamante",
//         edad: "20",
//         alias: "Edu",
//         avatar: "Hermoso avatar.jpg",
//       },
//       text: "Holis",
//       id: 0,
//     },
//     {
//       author: {
//         email: "Eduardo@gmail.com",
//         nombre: "Eduardo",
//         apellido: "Bustamante",
//         edad: "20",
//         alias: "Edu",
//         avatar: "Hermoso avatar.jpg",
//       },
//       text: "Alguien me responde",
//       id: 1,
//     },
//     {
//       author: {
//         email: "Eduardo@gmail.com",
//         nombre: "Eduardo",
//         apellido: "Bustamante",
//         edad: "20",
//         alias: "Edu",
//         avatar: "Hermoso avatar.jpg",
//       },
//       text: "Bueno",
//       id: 2,
//     },
//     {
//       author: {
//         email: "Carla@gmail.com",
//         nombre: "Carla",
//         apellido: "Lopez",
//         edad: "30",
//         alias: "Carli",
//         avatar: "Feo avatar.jpg",
//       },
//       text: "ei hola",
//       id: 3,
//     },
//     {
//       author: {
//         email: "Carla@gmail.com",
//         nombre: "Carla",
//         apellido: "Lopez",
//         edad: "30",
//         alias: "Carli",
//         avatar: "Feo avatar.jpg",
//       },
//       text: "Hola hola hola",
//       id: 4,
//     },
//     {
//       author: {
//         email: "Carla@gmail.com",
//         nombre: "Carla",
//         apellido: "Lopez",
//         edad: "30",
//         alias: "Carli",
//         avatar: "Feo avatar.jpg",
//       },
//       text: "bueno.....",
//       id: 5,
//     },
//   ],
// };


const author = new schema.Entity("author",{},{idAttribute: 'email'});

const msj = new schema.Entity("message", {
  author: author,
});

const msjsSchema = new schema.Entity("messages", {
  messages: [msj],
});









