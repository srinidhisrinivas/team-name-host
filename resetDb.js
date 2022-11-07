require('dotenv').config()
const mongo = require('mongoose')
// import * as config from 'json/config.json';
const config = require('./json/config.json')
const { TeamName } = require('./TeamNameModel')
const { Experiment } = require('./ExperimentModel')



// Delete existing team name first
let resetDb = () => {
    return TeamName.updateMany({
            experimentName: config.experimentName
        },
        {
            $set : {
                used: false
            }
        })
        .then(res => {
            return Experiment.update({
                experimentName: config.experimentName
            },
                {
                    $set: {
                        "conditionAssignments.$[]" : 0
                    }
                })
        })

}

if (require.main === module) {
    mongo.connect(process.env.DB_CONNECTION_STRING, { useNewUrlParser: true, useUnifiedTopology: true }, err => {
        if (err) {
            console.log(err);
        } else {
            console.log('\x1b[42m\x1b[30m%s\x1b[0m', `Connected to the database`);
        }
    });
    resetDb()
        .then(res => {
            console.log("Reset DB complete for experiment " + config.experimentName + "!")
            mongo.connection.close();
        })
}

module.exports.resetDb = resetDb;