const express = require('express');
const router = express.Router()
const Model = require('../models/model_numbers');
const Model_sesiones = require('../models/model_sesiones');

// Methodes numbers
router.post('/numbers', async (req, res) => {
    const data = new Model({ 
        company: req.body.company,
        number: req.body.number
    })

    try {
        const dataToSave = await data.save();
        res.status(200).json(dataToSave)
    }
    catch (error) {
        res.status(400).json({message: error.message})
    }
})

router.get('/numbers', async (req, res) => {
    try{
        const data = await Model.find();
        res.json(data)
    }
    catch(error){
        res.status(500).json({message: error.message})
    }
})

// Methodes sesiones
router.post('/sesion', async (req, res) => {
    const data = new Model_sesiones({
        active_session: req.body.active_session,
        number: req.body.number
    })

    try {
        const dataToSave = await data.save();
        res.status(200).json(dataToSave)
    }
    catch (error) {
        res.status(400).json({message: error.message})
    }
})

router.get('/sesion', async (req, res) => {
    const numero_buscar = req.body.number
    try{
        const data = await Model_sesiones.find({ "number": numero_buscar });
        res.json(data)
    }
    catch(error){
        res.status(500).json({message: error.message})
    }
})

module.exports = router;