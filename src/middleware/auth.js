const crypto = require("crypto");
const env = require("../config/env.config");
module.exports = auth = (req, res, next) =>{
    let authHeader  = req.get("Authorization");
    console.log("HEADER ", authHeader);
    dissertHeader(authHeader, res, next);
}

const verifyHeaders = (token, method) => {
    const message = token.split(".")[0];
    const decryptPass = token.split(".")[1];
    const timestamp = token.split(".")[2];
    const decryptTime = decrypt(timestamp, decryptPass);
    const nowTime = Date.now();
    const decryptMessage = decrypt(message, decryptPass);
    if(method != "ERRANDA" || nowTime - decryptTime < 180000 || decryptMessage != "erranda.courier.services"){
      return false;
    }
    else{
      return true;
    }
  }

const dissertHeader = (header, res, next) => {
    if(header == undefined){
        return res.status(401).json({error : "You are not authorized to this endpoint"})
    }
    const method = header.split(" ")[0];
    const token = header.split(" ")[1];
    const verify = verifyHeaders(token, method);
    if(verify){
      next();
    }
    else{
        return res.status(401).json({error : "You are not authorized to this endpoint"})
    } 
}
  
const decrypt = (text, decryptPass) => {
    var decipher = crypto.createDecipher('aes-256-cbc', decryptPass)
    var dec = decipher.update(text,'binary','utf8')
    dec += decipher.final('utf8');
    return dec;
}