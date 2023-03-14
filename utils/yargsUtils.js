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

module.exports = {PORT, MODE};