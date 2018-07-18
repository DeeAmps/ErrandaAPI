const NodeGeocoder = require('node-geocoder');
const envConfig = require("./env.config");
const GoogleLocations = require('google-locations');
const locations = new GoogleLocations(envConfig.API_KEY);
const options = {
  provider: 'google',
  httpAdapter: 'https', 
  apiKey: envConfig.API_KEY, 
  formatter: null         
};
const geocoder = NodeGeocoder(options);

const googleMapsClient = require('@google/maps').createClient({
    key: envConfig.API_KEY
});



module.exports = { googleMapsClient, geocoder, locations };