const firebase = require("firebase");
firebase.initializeApp({
	databaseURL: "https://erranda-app.firebaseio.com/",
});
const db = firebase.database();

const requestsRef = db.ref("requests");
const ridersRef = db.ref("riders");
const updatesRef = db.ref("updates");
const usersRef = db.ref("users");
const pickupRef = db.ref("pickup");
const adminPickupRef = db.ref("adminpickup");

module.exports = {
    requestsRef,
    ridersRef,
    updatesRef,
    usersRef,
    pickupRef,
    adminPickupRef
}