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
Experiment.deleteOne({
    experimentName: config.experimentName
})
.then(res => {
    return TeamName.deleteMany({
        experimentName: config.experimentName
    })
})
.then(res => {
    // Add experiment
    let conditionOrder = [...new Set(Object.values(config.conditionMapping))]
    let conditionAssignments = new Array(conditionOrder.length).fill(0);
    conditionOrder.sort()
    return Experiment.create({
        experimentName: config.experimentName,
        conditionOrder: conditionOrder,
        conditionAssignments: conditionAssignments,
        lastSelectedCond: -1
    }).then(res => {
        console.log(res);
        // Add all team names for that experiment
        let promiseArray = []
        for(const [name, cond] of Object.entries(config.conditionMapping)){
            promiseArray.push(
                TeamName.create({
                    experimentName: config.experimentName,
                    leaderName: name + "-Leader",
                    followerName: name,
                    conditionIdx: cond,
                    used: false
                })
            );
        }
        return Promise.all(promiseArray)
    })
})
.then(res => {
    console.log("Write to DB complete for experiment " + config.experimentName + "!")
    mongo.connection.close();
})