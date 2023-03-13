const winston = require("winston")


function buildInfoLogger() {
    return winston.createLogger({
        transports: [new winston.transports.Console( { level: 'debug' })]
    })
}

function buildWarnLogger() {
    return winston.createLogger({
        transports: [
            new winston.transports.Console( { level: 'debug' }),
            new winston.transports.File( { filename: 'warn.log', level: 'warn' })
        ]
    })
}

function buildErrorLogger() {
    return winston.createLogger({
        transports: [
            new winston.transports.Console( { level: 'debug' }),
            new winston.transports.File( { filename: 'error.log', level: 'error' })
        ]
    })
}



let infoLogger = buildInfoLogger()
let warnLogger = buildWarnLogger()
let errorLogger = buildErrorLogger()

function showReqDataInfo(req){
    infoLogger.info("Hiciste un "+req.method+" a la ruta: '" +req.originalUrl+"'");
  }
  function showReqDataWarn(req){
    warnLogger.warn("intentaste hacer un "+req.method+" a la ruta: '" +req.originalUrl+"' pero esta no existe :c");
  }

module.exports = {infoLogger, warnLogger, errorLogger, showReqDataInfo, showReqDataWarn};