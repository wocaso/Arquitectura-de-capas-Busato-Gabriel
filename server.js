//-------------------------------------------------------------------------------------------------------//
//Config server express y socket.io//
//-------------------------------------------------------------------------------------------------------//
const express = require("express");
const handlebars = require("express-handlebars");
const { Server: HttpServer } = require("http");
const { Server: IOServer } = require("socket.io");
//-------------------------------------------------------------------------------------------------------//
//Dotenv y yargs//
//-------------------------------------------------------------------------------------------------------//
const dotenv = require("dotenv");
dotenv.config();

//minimist
const parseArgs = require("minimist");
const args = parseArgs(process.argv.slice(2));
const MODE = args.m || "FORK";
const PORT = args.p || 8080;

//yargs
// const parseArgs = require("yargs/yargs");
// const yargs = parseArgs(process.argv.slice(2));
// const { PORT, MODE } = yargs
//   .alias({
//     p: "PORT",
//     m: "MODE",
//   })
//   .default({
//     PORT: 8080,
//     MODE: "FORK",
//   }).argv;

console.log({ PORT, MODE });
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
    console.log(`worker ${worker.process.pid} termino`);
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
  //importo los modelos
  const { mensajes, usuarios } = require("./models/modelsMongoose.js");
  //importo los containers
  const {
    MongooseContainer,
    MongooseContainerUsuarios,
  } = require("./containers/mongooseContainer.js");
  //Creo las instancias para usar las bases de datos
  const mongooseDB = new MongooseContainer(
    process.env.MONGOURLmensajes,
    mensajes
  );
  const mongooseDBusers = new MongooseContainerUsuarios(
    process.env.MONGOURLusuarios,
    usuarios
  );
  const { fiveProducts } = require("./utils/productosFaker");
  //-------------------------------------------------------------------------------------------------------//
  //Normalizr//
  //-------------------------------------------------------------------------------------------------------//

  const { normalize, schema } = require("normalizr");

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
  app.use(express.urlencoded({ extended: true }));
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
  function requireAuthentication(req, res, next) {
    if (req.isAuthenticated()) {
      next();
    } else {
      res.redirect("/login");
    }
  }

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
    console.log("servidor escuchando en el puerto " + PORT);
  });

  //----------------------------//
  //    Rutas Registro
  //----------------------------//
  app.get("/register", (req, res) => {
    res.render("register");
  });

  app.post(
    "/register",
    passport.authenticate("register", {
      failureRedirect: "/failregister",
      successRedirect: "/datos",
    })
  );

  app.get("/failregister", (req, res) => {
    res.render("register-error");
  });
  //----------------------------//
  //    Rutas Login
  //----------------------------//
  app.get("/login", (req, res) => {
    if (req.isAuthenticated()) {
      res.redirect("/datos");
    }
    res.render("login");
  });

  app.post(
    "/login",
    passport.authenticate("login", {
      failureRedirect: "/faillogin",
      successRedirect: "/datos",
    })
  );

  app.get("/faillogin", (req, res) => {
    res.render("login-error");
  });
  //----------------------------//
  //    Rutas datos
  //----------------------------//

  app.get("/datos", requireAuthentication, (req, res) => {
    res.render("datos", { user: req.session.passport.user });
  });
  //----------------------------//
  //    Rutas Logout
  //----------------------------//

  app.get("/logout", (req, res) => {
    req.logout((err) => {
      res.redirect("/login");
    });
  });

  app.get("/api/productos-test", (req, res) => {
    res.render("productosTest");
  });
  //----------------------------//
  //    Ruta info
  //----------------------------//
  console.log();
  app.get("/info", (req, res) => {
    res.render("info", {
      SO: process.platform,
      ArgEntr: JSON.stringify(yargs.argv),
      NodeVersion: process.version,
      ReservedMemory: process.memoryUsage().rss,
      pathEjecucion: process.cwd(),
      processID: process.pid,
      proyectFolder: process.cwd().split("\\").pop(),
      numProcesadores: numCpus,
    });
  });

  //----------------------------//
  //    Ruta numeros random
  //----------------------------//
  routerNumeros.get("/", (req, res) => {
    const numFork = fork("./utils/count.js");
    let cantidad = 10000000;
    if (req.query.cant != null) {
      cantidad = req.query.cant;
    }
    numFork.send(cantidad);
    numFork.on("message", (msg) => {
      res.send(msg);
    });
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

  io.on("connection", (socket) => {
    console.log("un cliente se ha conectado");
    mongooseDB.getAll().then((res) => {
      let dataString = JSON.stringify(res);
      let dataParse = JSON.parse(dataString);
      const msjsNorm = normalize(dataParse[0], msjsSchema);
      socket.emit("messages", msjsNorm);
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

  const author = new schema.Entity("author", {}, { idAttribute: "email" });

  const msj = new schema.Entity("message", {
    author: author,
  });

  const msjsSchema = new schema.Entity("messages", {
    messages: [msj],
  });
}
