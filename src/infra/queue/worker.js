require("dotenv").config();

const mongoose = require("mongoose");
const WhatsappProvider = require("../providers/implementations/whatsapp/WhatsappProvider");

const { dateFormatted, timeFormatted } = require("../../utils/dates");

const mongoString = process.env.DATABASE_URL;
mongoose.connect(mongoString);
const database = mongoose.connection;

database.on("error", (error) => console.log(error));
database.once("connected", () => console.log("Database Connected"));

const whatsappProvider = new WhatsappProvider();
whatsappProvider.process(async ({ data }) => whatsappProvider.processor(data));

console.log(
  `Queue manager started | Data:${dateFormatted()} as ${timeFormatted()}`
);
