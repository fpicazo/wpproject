const mongoose = require('mongoose');

const sesionesSchema = new mongoose.Schema({
    active_session: {
        required: true,
        type: String 
    },
    number: {
        required: false,
        type: String
    }
})

module.exports = mongoose.model('sesionesSchema', sesionesSchema)