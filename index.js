require('dotenv').config()

const mongo = require('mongoose')
const express = require('express')
const app = express();
const config = require('./json/config.json')
app.set('view engine', 'ejs')
app.use(express.static('.'));
const port = process.env.PORT || 3000
const { TeamName } = require('./TeamNameModel')
const { Experiment } = require('./ExperimentModel')
const { resetDb } = require('./resetDb')

mongo.connect(process.env.DB_CONNECTION_STRING, { useNewUrlParser: true, useUnifiedTopology: true }, err => {
    if (err) {
        console.log(err);
    } else {
        console.log('\x1b[42m\x1b[30m%s\x1b[0m', `Connected to the database`);
    }
});

let getTeamName = async (condition) => {
    return Experiment.findOne({ experimentName: config.experimentName })
        .then(dbRes => {
            let order = dbRes.conditionOrder;
            let conditionAssignments = dbRes.conditionAssignments;
            let lastCond = dbRes.lastSelectedCond;
            // Get next condition based on last condition
            // let nextCond = (condition && order.indexOf(condition) !== -1) ? condition : dbRes.conditionOrder[(order.indexOf(lastCond) + 1) % order.length]

            // Get next condition based on condition with the least number of
            let nextCond = (condition && order.indexOf(condition) !== -1) ? condition : conditionAssignments.indexOf(Math.min(...conditionAssignments));
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

            let addObject = {}

            // Increment number of team names assigned for current condition
            let addConditionString = `conditionAssignments.${condition}`
            addObject[addConditionString] = 1

            let expUpdatePromise =  Experiment.findOneAndUpdate({
                experimentName: config.experimentName
            },{
                $set : {
                    lastSelectedCond: condition
                },
                $inc: addObject
            },
                {new: true})
            let teamNameUpdatePromise = TeamName.findOneAndUpdate({
                experimentName: config.experimentName,
                leaderName: leaderName
            },{
                $set : {
                    used : true
                }
            },
                {new: true})

            return Promise.all([expUpdatePromise, teamNameUpdatePromise])
                .then(retArr => {
                    console.log(retArr[0])
                    return {
                        leaderName: leaderName,
                        followerName: followerName
                    }
                })
        })
}

app.get('/', function(req, res){
    getTeamName()
        .then(data => {
            res.render(
                "main-full",
                {
                    leaderName: data.leaderName,
                    followerName: data.followerName
                });
        })
        .catch(err => {
            console.log(err);
            resetDb()
                .then(dbRes => {
                    res.redirect(req.originalUrl);
                })
                .catch(err => {
                    res.render("errorpage");
                 })

        })
})

app.get('/cond/:condIdx', function(req, res){
    let cond;
    if(!isNaN(req.params.condIdx)){
        cond = parseInt(req.params.condIdx)
    } else {
        console.log("redirecting");
        res.redirect('/')
        return;
    }
    getTeamName(cond)
        .then(data => {
            res.render(
                "main-full",
                {
                    leaderName: data.leaderName,
                    followerName: data.followerName
                });
        })
        .catch(err => {
            resetDb()
                .then(dbRes => {
                    res.redirect(req.originalUrl);
                })
                .catch(err => {
                    res.render("errorpage");
                })

        })
})

console.log("Listening to humans")
app.listen(port)