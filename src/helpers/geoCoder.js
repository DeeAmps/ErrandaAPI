const mapConfig = require("../config/mapConfig");
const distance = require('google-distance');
const ridersRef = require("../db/init").ridersRef;
const pickupRef = require("../db/init").pickupRef;
const adminPickupRef = require("../db/init").adminPickupRef;
const locations = require("../config/mapConfig").locations;
const Promise = require('promise');

const GetPlaceCoordinates = (res, address, destAddress, parentRedId, childReqId, 
    rejectedStaus, rideType, userLocation) => 
{
    //console.log(userLocation.lat, userLocation.lng);
    GetClosestRider(userLocation.lat, userLocation.lng, res, parentRedId, childReqId,  address, destAddress, rejectedStaus, rideType);
    // locations.details({placeid : address}, (err, response) => {
    //     mapConfig.geocoder.reverse({lat: `${response.result.geometry.location.lat}`, lon:`${response.result.geometry.location.lng}`})
    //     .then((results) => {
    //         let filtered = results.filter(item => item.formattedAddress == response.result.formatted_address);
    //         if(filtered[0] == undefined){
    //             return res.json([{success: false, message : "Address Mismatch. Kindly Contact Support!"}]); 
    //          }
    //         if(filtered[0] != undefined){
    //             GetClosestRider(filtered[0].latitude, 
    //                 filtered[0].longitude, res, parentRedId, childReqId, response.result.address_components[2].short_name,
    //                  destAddress, rejectedStaus, rideType);
    //         }
    //         else{
    //             GetClosestRider(results[0][0].latitude, 
    //                 results[0][0].longitude, res, parentRedId, childReqId, 
    //                 response.result.address_components[2].short_name, destAddress, rejectedStaus, rideType);
    //         }
    //     })
    //     .catch((err) => {
    //         console.log(err);
    //     });
    // })
    
} 

const GetClosestRider = (latitude, longitude, res, parentRedId, childReqId, 
    originAddr, destAddr, rejectedStaus, rideType) => {
    ridersRef.once("value", function(snapshot) {
        let results = snapshot.val()
        let arrResults = Object.values(results);
        let riderLocationsPromises = [];
        for (let ele in arrResults) {
            if (arrResults.hasOwnProperty(ele)) {
                let rider = arrResults[ele];
                if(rejectedStaus.rejected == true && rejectedStaus.riderId == rider.id){
                    continue;
                }
                else if(rider.isActive == true && rider.isAvailable == true && 
                    rider.type == rideType){
                    let promise = getRiderDistance(latitude, longitude, rider)
                    riderLocationsPromises.push(promise);
                }
                else{
                    continue;
                }
            }
        }
        if(riderLocationsPromises.length == 0){
            returnToAdmin(parentRedId, childReqId, originAddr, destAddr, `Riders unavailable for Ride Type ${rideType}!`)
            return res.json([{success: false, message : `Riders unavailable for Ride Type ${rideType}!`}]); 
        }
        else{
            Promise.all(riderLocationsPromises)
            .then(reslts => {
                const leastDist = reslts.reduce(function(prev, current) {
                    return (prev.distance < current.distance) ? prev : current
                });
                if(leastDist.distance <= 1200){
                    return SetPickup(parentRedId, childReqId, 
                        leastDist.rider, originAddr, destAddr, res);
                }
                else{
                    returnToAdmin(parentRedId, childReqId, originAddr, destAddr, "No rider available within 20minutes range!")
                    return res.json([{success: false, message : "No rider available within 20minutes range!"}]); 
                } 
            })
        }
    })
}

returnToAdmin = async (parentRedId, childReqId , originAddr, destAddr, message) => {
    let adminpickup = {};
    adminpickup.requestId = childReqId;
    adminpickup.userId = parentRedId;
    adminpickup.message = message;
    adminpickup.requestLocation = {
        destination: destAddr,
        origin: originAddr
    };
    await adminPickupRef.push({
        requestId: adminpickup.requestId,
        userId: adminpickup.userId,
        requestLocation: adminpickup.requestLocation,
        message : adminpickup.message
    }, (err) => {
            return;
        });
}

getRiderDistance = (latitude, longitude, rider) => {
    return new Promise((resolve, reject)  => {
        distance.get({
        origin: [`${latitude}, ${longitude}`],
        destination: [`${rider.location.latitude}, ${rider.location.longitude}`],
        mode: 'driving',
        units: 'metric'
        }, (err, data) => {
        resolve(riderInfo = {
            rider: rider,
            distance : data.durationValue
        }, false)   
    });   
    })
}


const SetPickup = (parentRedId, childReqId, rider, originAddr, destAddr, res) => {
    let pickup = {};
    pickup.requestId = childReqId;
    pickup.rejected = false;
    pickup.userId = parentRedId
    pickup.requestLocation = {
        destination: destAddr,
        origin: originAddr
    };
    pickup.riderLocation = {
        lat: rider.location.latitude,
        lng: rider.location.longitude
    };
    pickupRef.child(rider.id).set({
        requestId: pickup.requestId,
        userId: pickup.userId,
        rejected: pickup.rejected,
        requestLocation: pickup.requestLocation,
        riderLocation: pickup.riderLocation
    }, (err) => {
            if(err) {
                return res.json({Error: err})
            }
            else{
                return res.json([{Success: true, Message: "Rider Allocated"}]);
            }
        });
}

module.exports = { GetPlaceCoordinates };