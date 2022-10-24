require('dotenv').config()
const mongo = require('mongoose')
// import * as config from 'json/config.json';
const config = require('./json/config.json')
const { TeamName } = require('./TeamNameModel')
const { Experiment } = require('./ExperimentModel')

mongo.connect(process.env.DB_CONNECTION_STRING, { useNewUrlParser: true, useUnifiedTopology: true }, err => {
    if (err) {
        console.log(err);
    } else {
        console.log('\x1b[42m\x1b[30m%s\x1b[0m', `Connected to the database`);
    }
});

// Delete existing team name first
TeamName.updateMany({
    experimentName: config.experimentName
},
    {
        $set : {
            used: false
        }
    })
.then(res => {
    console.log("Reset DB complete for experiment " + config.experimentName + "!")
    mongo.connection.close();
})