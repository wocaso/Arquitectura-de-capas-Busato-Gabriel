const mongoose = require("mongoose");
// function getDate() {
//   let fullDate = new Date();
//   let date =
//     fullDate.getDate() +
//     "/" +
//     (fullDate.getMonth() + 1) +
//     "/" +
//     fullDate.getFullYear() +
//     " " +
//     fullDate.getHours() +
//     ":" +
//     (fullDate.getMinutes() >= 10 ?
//       fullDate.getMinutes() :
//       "0" + fullDate.getMinutes());
//   return date;
// }

class MongooseContainer{
    constructor(collection, model) {
        this.collection = collection;
        this.model = model;
      }


      async #connectDB() {
        return mongoose.connect(this.collection, {
          useNewUrlParser: true,
          useUnifiedTopology: true,
        });
      }
    
      async #disconnectDB() {
        await mongoose.disconnect();
      }


    async getAll(){
        try{
            await this.#connectDB()
            const allMensajes = await this.model.find();
            return allMensajes; 
        }catch(error){
            console.log(error)
        }finally {
          await this.#disconnectDB();
        }
        
    }

    async addNew(mensaje){
        
        try{
          await this.#connectDB()
            let insertedMensaje = await this.model.updateMany({id: "coderChat"},{
              $push: {messages:mensaje}
          })
            return insertedMensaje;
        }catch(error){
            console.log(error)
        }finally {
            await this.#disconnectDB();
          }
    }


}
//============================================================================================================================================================//

//============================================================================================================================================================//
module.exports = {MongooseContainer}