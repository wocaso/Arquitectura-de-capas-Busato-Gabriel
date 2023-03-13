const parseArgs = require("yargs/yargs");
const yargs = parseArgs(process.argv.slice(2));
const os = require("os");
let numCpus = os.cpus().length;
function getInfo(req, res){
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
  }

  module.exports = {getInfo}