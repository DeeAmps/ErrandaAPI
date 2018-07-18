const express = require("express");
const bodyParser = require("body-parser");
const requestsRef = require("./db/init").requestsRef;
const pickupRef = require("./db/init").pickupRef;
const cors = require("cors");
const geoCoder = require("./helpers/geoCoder");
const notification = require("./helpers/sendNotification");
//const auth = require("./middleware/auth");
const https = require("https");

require('dotenv').config();

const indexRoute = require("./routes/index");

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true}));
//app.use(auth);


let port = process.env.PORT || 8087;

app.use("/api", indexRoute);

const loopRequests = (data, userPhone) => {
    for(let key in data){
    if (!data.hasOwnProperty(key)) continue;
    let obj = data[key];
    for (let prop in obj) {
        if(!obj.hasOwnProperty(prop)) continue;
        if(obj.delivered == true && obj.deliveryNotification == false){
        state = "delivery";
        notification.notified(userPhone, state, key)
        notification.setRiderPickUpNotification(state, userPhone,key);
        return;
        }
        if(obj.status == true && obj.statusNotification == false){
            state = "status";
            notification.notified(userPhone, state, key);
            notification.setRiderPickUpNotification(state, userPhone, key)
            return;
        }
        if(obj.journeyStarted == true && obj.journeyStartedNotification == false){
            state = "journey_started";
            notification.notified(userPhone, state, key)
            notification.setRiderPickUpNotification(state, userPhone, key)
            return;
        }
        }
    }
}

requestsRef.on('child_changed', (snapshot) => {
    const data = snapshot.val();
    return loopRequests(data, snapshot.ref.key);
});

pickupRef.on('child_changed', function(snapshot) {
    console.log("AM HERE!");
    const childReq = snapshot.exportVal();
    const riderId = snapshot.ref.key;
    if(childReq.rejected){
        const rejected = {
            "rejected" : true,
            "riderId" : riderId
        }
        let parentReqId = childReq.userId;
        let childReqId = childReq.requestId;
        pickupRef.child(riderId).remove(); //Remove Rider from  Pick Up Collection
        return requestsRef.child(parentReqId).child(childReqId).once("value", 
            function(snapshot, prevChildKey) {
            let returnObject = snapshot.val();
            let originAddress = returnObject.originPlaceAddress;
            let destinationAddress = returnObject.destinationPlaceAddress;
            let rideType = returnObject.ride;
            geoCoder.GetPlaceCoordinates(res, originAddress, destinationAddress, 
            parentReqId, childReqId, rejected, rideType);
        });
    }
});

setInterval(() => {
    https.get("https://fast-stream-86257.herokuapp.com/api/ping");
}, 300000); // every 5 minutes (300000)


app.listen(port, () => {
    console.log(`API running on localhost:${port}/api/`);
})