var express = require("express");
var bodyParser = require("body-parser");
var databox_directory = require("./utils/databox_directory.js");
var PythonShell = require('python-shell');


var SENSOR_TYPE_IDs = [];
var SENSOR_IDs = {};
var VENDOR_ID = null;
var DRIVER_ID = null;
var DATASTORE_ID = null;

var app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

//TODO app.use(Macaroon checker);

app.get("/status", function(req, res) {
    res.send("active");
});

app.post("/api/actuate", function(req, res) {

  var message = req.body.data;

  var options = {
    mode: 'text',
    //pythonPath: '/usr/bin/python',
    pythonOptions: ['-u'],
    args: [message]
  };
  PythonShell.run('./src/BasicPrint.py', options, function (err, results) {
    if (err) {
      res.send("Error::" + err.toString());
      console.log(err);
      return;
    }
    console.log('results: %j', results);
    res.send("done");
  });
});

databox_directory.register_driver('databox','databox-driver-pipsta', 'A Databox driver for the pipsta printer')
   .then((ids) => {

    VENDOR_ID = ids['vendor_id'];
    DRIVER_ID = ids['driver_id'];    
    console.log("VENDOR_ID", VENDOR_ID);
    console.log("DRIVER_ID", DRIVER_ID);

    proms = [
      databox_directory.register_actuator_type('printer'),
    ]
    return Promise.all(proms);
  })
  .then ((actuatorTypeIds) => {
    console.log('actuatorTypeIds::', actuatorTypeIds);
    ACTUATOR_TYPE_IDs = actuatorTypeIds;
    return databox_directory.get_datastore_id('databox-store-blob');
  })
  .then((dataStoreId) => {
    DATASTORE_ID = dataStoreId;
    proms = [                            
      databox_directory.register_actuator(DRIVER_ID, ACTUATOR_TYPE_IDs[0].id, DATASTORE_ID, VENDOR_ID, 'printer', 'Pipsta printer actuator', ''),
    ]
    return Promise.all(proms);
  })
  .then(() => {
    app.listen(8080);
  })
  .catch((err) => {
    console.log(err)
  });

module.exports = app;
