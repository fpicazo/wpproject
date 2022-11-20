const express = require("express");

const WhatsappQueueProvider = require("../infra/providers/implementations/whatsapp/WhatsappQueueProvider");

const router = express.Router();
const Model = require("../models/model_numbers");
const Model_sesiones = require("../models/model_sesiones");

// Methodes numbers
router.post("/numbers", async (req, res) => {
  const data = new Model({
    company: req.body.company,
    number: req.body.number,
  });

  try {
    const numberSaved = await data.save();
    res.status(200).json({ numberSaved });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.get("/numbers", async (req, res) => {
  try {
    const data = await Model.find();
    res.json({ data });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Methodes sesiones
router.post("/sesion", async (req, res) => {
  const data = new Model_sesiones({
    active_session: req.body.active_session,
    number: req.body.number,
  });

  try {
    const dataToSave = await data.save();
    res.status(200).json(dataToSave);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.get("/sesion", async (req, res) => {
  const numero_buscar = req.body.number;
  try {
    const session = await Model_sesiones.findOne({ number: numero_buscar });
    const number = await Model.findOne({ number: numero_buscar });

    if (!session || !session.active_session || !session.authenticated) {
      if (!number) {
        return res.json({ message: "Company number is not fund" });
      }

      const whatsappQueueProvider = new WhatsappQueueProvider();

      await whatsappQueueProvider.startSession({
        type: "SESSION",
        sender: { company: number.company, number: number.number },
      });
    }

    res.json({
      message: session
        ? session.authenticated
          ? "Your session is already started"
          : "Your session is starting"
        : "Your session is being started, wait that in a few moments you will be able to read the qrcode",

      session,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/session/qrcode", async (req, res) => {
  const { number, company } = req.body;

  try {
    const session = await Model_sesiones.findOne({ company, number });

    res.json({ session });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post("/message/text", async (req, res) => {
  const { sender, recipient } = req.body;
  const { company } = sender;
  const { phone, message } = recipient;

  try {
    const whatsappQueueProvider = new WhatsappQueueProvider();

    await whatsappQueueProvider.sendMessage({
      type: "MESSAGE",
      sender,
      recipient,
    });

    res.json({ message: "Your message is being sent" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
