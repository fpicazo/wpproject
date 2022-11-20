const mongoose = require('mongoose');

const dataSchema = new mongoose.Schema({
    company: {
        required: false,
        type: String
    },
    number: {
        required: false,
        type: String
    }
})

module.exports = mongoose.model('Data', dataSchema)