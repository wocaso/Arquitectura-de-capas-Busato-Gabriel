//-------------------------------------------------------------------------------------------------------//
//Config server express y socket.io//
//-------------------------------------------------------------------------------------------------------//
const express = require("express");
const handlebars = require("express-handlebars");
const { Server: HttpServer } = require("http");
const { Server: IOServer } = require("socket.io");
//-------------------------------------------------------------------------------------------------------//
//  Compression//
//-------------------------------------------------------------------------------------------------------//
const compression = require("compression");
//-------------------------------------------------------------------------------------------------------//
//  winston logger//
//-------------------------------------------------------------------------------------------------------//
const {
  infoLogger,
  showReqDataInfo,
  showReqDataWarn,
} = require("./utils/logger.js");
//-------------------------------------------------------------------------------------------------------//
//Dotenv y yargs//
//-------------------------------------------------------------------------------------------------------//
const dotenv = require("dotenv");
dotenv.config();
// yargs
const parseArgs = require("yargs/yargs");
const yargs = parseArgs(process.argv.slice(2));
const { PORT, MODE } = yargs
  .alias({
    p: "PORT",
    m: "MODE",
  })
  .default({
    PORT: process.env.PORT || 8080,
    MODE: "FORK",
  }).argv;

console.log({
  PORT,
  MODE,
});
//-------------------------------------------------------------------------------------------------------//
//Cluster y fork//
//-------------------------------------------------------------------------------------------------------//
const cluster = require("cluster");
const os = require("os");
let numCpus = os.cpus().length;

if (MODE == "CLUSTER" && cluster.isMaster) {
  console.log(numCpus);
  for (let i = 0; i < numCpus; i++) {
    cluster.fork();
  }
  cluster.on("exit", (worker) => {
    cluster.fork();
  });

  //dato importante: este "else" llega hasta el final del archivo.
} else {
  const app = express();
  const httpServer = HttpServer(app);
  const io = new IOServer(httpServer);
  app.use(express.static("./public"));
  //-------------------------------------------------------------------------------------------------------//
  //Router y fork//
  //-------------------------------------------------------------------------------------------------------//
  const { fork } = require("child_process");
  const { Router } = express;
  const routerNumeros = new Router();
  app.use("/api/randoms", routerNumeros);
  //-------------------------------------------------------------------------------------------------------//
  //Bcrypt//
  //-------------------------------------------------------------------------------------------------------//
  const bcrypt = require("bcrypt");
  const saltRounds = 10;
  //-------------------------------------------------------------------------------------------------------//
  //MongoDB y faker//
  //-------------------------------------------------------------------------------------------------------//
  const {
    mongooseDB,
    mongooseDBusers,
    fiveProducts,
  } = require("./persistence/mongoPersistence");
  //-------------------------------------------------------------------------------------------------------//
  //Normalizr//
  //-------------------------------------------------------------------------------------------------------//
  const { normalize } = require("normalizr");
  const { msjsSchema } = require("./utils/normalizr");

  //-------------------------------------------------------------------------------------------------------//
  //SQL usado en la parte de productos basica.//
  //-------------------------------------------------------------------------------------------------------//
  const { options } = require("./ecommerce/options/mysqlconn.js");
  const { ClienteSQLproductos } = require("./ecommerce/client");
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
  app.use(
    express.urlencoded({
      extended: true,
    })
  );
  app.use(express.json());

  //-------------------------------------------------------------------------------------------------------//
  //Passport//
  //-------------------------------------------------------------------------------------------------------//
  //-------------//
  //Register//
  //-------------//

  const passport = require("passport");
  const { Strategy: LocalStrategy } = require("passport-local");
  passport.use(
    "register",
    new LocalStrategy(
      {
        passReqToCallback: true,
      },
      (req, username, password, done) => {
        mongooseDBusers.getByUser(username).then((res) => {
          if (res[0]) {
            return done(null);
          }
          bcrypt.hash(password, saltRounds).then(function (hash) {
            const newUser = {
              username,
              password,
            };
            newUser.password = hash;
            mongooseDBusers.addNew(newUser).then((res) => {
              done(null, res);
            });
          });
        });
      }
    )
  );
  //-------------//
  //Login//
  //-------------//
  passport.use(
    "login",
    new LocalStrategy((username, password, done) => {
      mongooseDBusers.getByUser(username).then((res) => {
        if (!res[0]) {
          return done(null, false);
        }
        bcrypt.compare(password, res[0].password).then(function (result) {
          if (!result) {
            return done(null, false);
          }
          return done(null, res[0]);
        });
      });
    })
  );
  //-------------//
  //reqAuth//
  //-------------//
  const { requireAuthentication } = require("./utils/passport");

  //-------------------------------------------------------------------------------------------------------//
  //MongoAtlas-Session//
  //-------------------------------------------------------------------------------------------------------//
  const session = require("express-session");
  const MongoStore = require("connect-mongo");
  const advancedOptions = {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  };
  app.use(
    session({
      store: MongoStore.create({
        mongoUrl: process.env.URLMongoAtlas,
        mongoOptions: advancedOptions,
      }),
      secret: process.env.SessionSecret,
      resave: false,
      saveUninitialized: false,
      cookie: {
        maxAge: 600000,
      },
    })
  );

  app.use(passport.initialize());
  app.use(passport.session());
  app.use(compression());

  passport.serializeUser((user, done) => {
    done(null, user.username);
  });

  passport.deserializeUser((username, done) => {
    mongooseDBusers.getByUser(username).then((res) => {
      done(null, res);
    });
  });
  //-------------------------------------------------------------------------------------------------------//
  //Inicializacion del server y gets.//
  //-------------------------------------------------------------------------------------------------------//

  httpServer.listen(PORT, () => {
    infoLogger.info("servidor escuchando en el puerto " + PORT);
  });
  //----------------------------//
  //    Rutas Registro
  //----------------------------//
  const { routerRegister } = require("./Routes/registerRoutes");
  app.use(routerRegister);
  //----------------------------//
  //    Rutas Login
  //----------------------------//
  const { routerLogin } = require("./Routes/loginRoutes");
  app.use(routerLogin);
  // //----------------------------//
  //    Rutas datos
  //----------------------------//
  const { routerDatos } = require("./Routes/datosRoutes");
  app.use(routerDatos);
  //----------------------------//
  //    Rutas Logout
  //----------------------------//
const {routerLogout} = require("./Routes/logoutRoutes")
app.use(routerLogout);
  //----------------------------//
  //    Ruta info
  //----------------------------//
const {routerInfo} = require("./Routes/infoRoutes")
app.use(routerInfo);
  //----------------------------//
  //    Ruta general
  //----------------------------//
  app.get("*", (req, res) => {
    res.redirect("/datos");
    showReqDataWarn(req);
  });
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

  //-------------------------------------------------------------------------------------------------------//

  io.on("connection", (socket) => {
    console.log("un cliente se ha conectado");
    mongooseDB.getAll().then((res) => {
      let dataString = JSON.stringify(res);
      let dataParse = JSON.parse(dataString);
      const msjsNorm = normalize(dataParse[0], msjsSchema);
      socket.emit("messages", msjsNorm);
      // socket.emit("messages", res[0].messages);
    });
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
      mongooseDB.addNew(data).then(() => {
        mongooseDB.getAll().then((res) => {
          let dataString = JSON.stringify(res);
          let dataParse = JSON.parse(dataString);
          const msjsNorm = normalize(dataParse[0], msjsSchema);
          socket.emit("messages", msjsNorm);
        });
      });
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
}
