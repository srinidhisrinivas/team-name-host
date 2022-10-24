const { Schema, model } = require('mongoose');

let schemaObject = {
    experimentName: String,
    leaderName: String,
    followerName: String,
    conditionIdx: Number,
    used: Boolean
}

exports.TeamNameSchema = new Schema(schemaObject);

exports.TeamName = model('TeamName', exports.TeamNameSchema, 'experiment3_teamnames');