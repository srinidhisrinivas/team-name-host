require('dotenv').config()

const mongo = require('mongoose')
const express = require('express')
const app = express();
const config = require('./json/config.json')
app.set('view engine', 'ejs')
const port = process.env.PORT || 3000
const { TeamName } = require('./TeamNameModel')
const { Experiment } = require('./ExperimentModel')

mongo.connect(process.env.DB_CONNECTION_STRING, { useNewUrlParser: true, useUnifiedTopology: true }, err => {
    if (err) {
        console.log(err);
    } else {
        console.log('\x1b[42m\x1b[30m%s\x1b[0m', `Connected to the database`);
    }
});

app.get('/', function(req, res){
    Experiment.findOne({ experimentName: config.experimentName })
        .then(dbRes => {
            let lastCond = dbRes.lastSelectedCond;
            let order = dbRes.conditionOrder;
            let nextCond = dbRes.conditionOrder[(order.indexOf(lastCond) + 1) % order.length]

            return TeamName.findOne({
                experimentName: config.experimentName,
                conditionIdx: nextCond,
                used: false
            })
        })
        .then(dbRes => {
            let condition = dbRes.conditionIdx;
            let leaderName = dbRes.leaderName;
            let followerName = dbRes.followerName;

            let expUpdatePromise =  Experiment.findOneAndUpdate({
                experimentName: config.experimentName
            },{
                $set : {
                    lastSelectedCond: condition
                }
            })
            let teamNameUpdatePromise = TeamName.findOneAndUpdate({
                experimentName: config.experimentName,
                leaderName: leaderName
            },{
                $set : {
                    used : true
                }
            })
            res.render(
                "main",
                {
                    leaderName: leaderName,
                    followerName: followerName
                });
            return Promise.all([expUpdatePromise, teamNameUpdatePromise])
        })
        .catch(err => {
            console.log(err);
            res.render("errorpage")
        })
})

console.log("Listening to humans")
app.listen(port)