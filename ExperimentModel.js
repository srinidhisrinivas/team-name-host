const { Schema, model } = require('mongoose');

let schemaObject = {
    experimentName: String,
    conditionOrder: [Number],
    lastSelectedCond: Number
}

exports.ExperimentSchema = new Schema(schemaObject);

exports.Experiment = model('Experiment', exports.ExperimentSchema, 'experiment3_experimentteamnames');
