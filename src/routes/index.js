const express = require("express");
const router = express.Router();
const requestsRef = require("../db/init").requestsRef;
const GetPlaceCoordinates = require("../helpers/geoCoder").GetPlaceCoordinates;

router.get("/ping", (req, res) => {
    console.log("ping went through");
    return res.send("Live!");
})

router.get("/getRider", (req, res) => {
    let parentReqId =  unescape(req.query.requestId);
    let childReqId = unescape(req.query.childRequestId);
    return requestsRef.child(parentReqId).child(childReqId).once("value", 
    function(snapshot, prevChildKey) {
        let returnObject = snapshot.val();
        let originAddress = returnObject.userPlaceAddress;
        let destinationAddress = returnObject.destinationPlaceAddress;
        let riderType = returnObject.ride;
        let userLocation = returnObject.userLocation;
        const rejected = {
            "rejected" : false,
            "riderId" : null
        }
        GetPlaceCoordinates(res, originAddress, destinationAddress, 
            parentReqId, childReqId, rejected, riderType, userLocation);
    });
});

module.exports = router;