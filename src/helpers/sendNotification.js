const envConfig = require("../config/env.config");
const notificationMessage = require("../config/notificationMessages");
const requestsRef = require("../db/init").requestsRef;
const usersRef = require("../db/init").usersRef;

var sendNotification = function(data) {
    var headers = {
      "Content-Type": "application/json; charset=utf-8",
      "Authorization": `Basic ${envConfig.ONESIGNAL_RESTKEY}`
    };
    
    var options = {
        host: "onesignal.com",
        port: 443,
        path: "/api/v1/notifications",
        method: "POST",
        headers: headers
      };
      
      var https = require('https');
      var req = https.request(options, function(res) {  
        res.on('data', function(data) {
          console.log("Response:");
        });
      });
      
      req.on('error', function(e) {
        console.log("ERROR:", e);
        console.log(e);
      });
      req.write(JSON.stringify(data));
      req.end();
    };

getNotificationParams = (messagetoSend, deviceId) => {
    var message = { 
        app_id: `${envConfig.ONESIGNAL_APPID}`,
        contents: {"en": `${messagetoSend}`},
        include_player_ids: [`${deviceId}`]    
    };
    sendNotification(message);
}

notified = (userPhone, mess, key) => {
    let notification;
    if(mess == "status"){
        notification = {
            statusNotification : true
        }
    }
    else if(mess == "delivery"){
        notification = {
            deliveryNotification : true
        } 
    }
    else if(mess == "journey_started"){
        notification = {
            journeyStartedNotification : true
        } 
    }
    requestsRef.child(userPhone).child(key).update(notification, (err) => {
        if (err) {
            console.log(err);
        }
    })
}


setRiderPickUpNotification = (state, userPhone, key) => {
    const userId = userPhone; //Get User phone Number (User Id)
    usersRef.child(userId).once("value", function(snap, prevChildKey) {
        deviceId = snap.val(); //Get Device Id for notification
        if(deviceId != null){
            if(state == "status"){
                getNotificationParams(notificationMessage.RIDER_PICK_UP, deviceId.userId)
                //notified(userPhone, "status", key);
                return;
            }
            else if(state == "delivery"){
                getNotificationParams(notificationMessage.RIDER_DELIVERY, deviceId.userId);
                //notified(userPhone, "delivery", key);
                return;
            }
            else if(state == "journey_started"){
                getNotificationParams(notificationMessage.RIDER_JOURNEY_STARTED, deviceId.userId);
                //notified(userPhone, "journey_started", key);
                return;
            }
        }   
    })
}
        
module.exports = { setRiderPickUpNotification, notified }