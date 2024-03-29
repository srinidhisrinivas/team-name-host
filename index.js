require('dotenv').config()

const bodyParser = require('body-parser')
const mongo = require('mongoose')
const express = require('express')
const router = express.Router();
const app = express();
const config = require('./json/config.json')
app.set('view engine', 'ejs')
app.use(express.static('./static'));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
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
            let nextCond = ((typeof condition === "number") && order.indexOf(condition) !== -1) ? condition : conditionAssignments.indexOf(Math.min(...conditionAssignments));
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
                    return {
                        leaderName: leaderName,
                        followerName: followerName,
                        condition: condition
                    }
                })
        })
}

let validateLanguage = (lang) => {
    if(typeof lang !== "string") lang = "";
    let availableLanguages = ["en", "de"];
    let defaultLanguage = "en"
    if(!availableLanguages.includes(lang.toLowerCase())){
        return defaultLanguage;
    } else {
        return lang.toLowerCase();
    }
}

router.get('/main/:condition/:followerName/:language', function(req, res){
    let language = validateLanguage(req.params.language);
    if(isNaN(req.params.condition)){
        console.log("redirecting");
        res.redirect('/' + language)
        return;
    }
    res.render(
        "main-full-" + language,
        {
            leaderName: req.params.followerName + '-Leader',
            followerName: req.params.followerName,
            condition: req.params.condition
        });
})

router.get('/template/:condition/:followerName/:language',function(req,res){
    //code to perform particular action.
    let language = validateLanguage(req.params.language);

    //To access POST variable use req.body()methods.
    if(isNaN(req.params.condition)){
        console.log("redirecting");
        res.redirect('/' + language)
        return;
    }
    let data = req.params;
    res.render(
        "template-" + language,
        {
            condition: data.condition,
            followerName: data.followerName
        });
});

router.get('/final-f/:condition/:followerName/:language',function(req,res){
    //code to perform particular action.
    let language = validateLanguage(req.params.language);
    //To access POST variable use req.body()methods.
    if(isNaN(req.params.condition)){
        console.log("redirecting");
        res.redirect('/' + language)
        return;
    }
    let data = req.params;
    res.render(
        "final-f-page-" + language,
        {
            condition: data.condition,
            followerName: data.followerName,
            leaderName: data.followerName + '-Leader'
        });
});

router.get('/final/:condition/:followerName/:language',function(req,res){
    //code to perform particular action.
    let language = validateLanguage(req.params.language);
    //To access POST variable use req.body()methods.
    if(isNaN(req.params.condition)){
        console.log("redirecting");
        res.redirect('/' + language)
        return;
    }
    let data = req.params;
    res.render(
        "final-page-" + language,
        {
            condition: data.condition,
            followerName: data.followerName,
            leaderName: data.followerName + '-Leader'
        });
});

router.get('/:language', function(req, res){
    let language = validateLanguage(req.params.language);
    getTeamName()
        .then(data => {
            res.redirect('/main/' + data.condition + "/" + data.followerName + "/" + language)
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

router.get('/cond/:condIdx/:language', function(req, res){
    let cond;
    let language = validateLanguage(req.params.language);
    if(!isNaN(req.params.condIdx)){
        cond = parseInt(req.params.condIdx)
    } else {
        console.log("redirecting");
        res.redirect('/' + language)
        return;
    }
    getTeamName(cond)
        .then(data => {
            res.redirect('/main/' + data.condition + "/" + data.followerName + "/" + language)
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

router.get('/', function(req, res){
    let language = validateLanguage(undefined);
    res.redirect('/' + language);
    return;
})

router.get("*", function(req, res){
    res.redirect('/')
})

app.use('/', router);

console.log("Listening to humans")
app.listen(port)