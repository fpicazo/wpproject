const qrcode = require("qrcode-terminal");
const { QueueScheduler, Worker } = require("bullmq");
const { Client: WhatsappClient, LocalAuth } = require("whatsapp-web.js");

const Model_sesiones = require("../../../../models/model_sesiones");
const RedisConnection = require("../../../redis/connection");

const { dateFormatted, timeFormatted } = require("../../../../utils/dates");

class WhatsappProvider {
  whatsapp = [];

  constructor() {
    new Promise(async (resolve, reject) => {
      try {
        console.log(`Disabling all whatsapp sessions`);

        await Model_sesiones.updateMany({
          active_session: false,
          authenticated: false,
        });

        resolve();
      } catch (err) {
        console.log(
          `Erro in disable all sessions whatsapp | Details: ${err.message}`
        );
        reject(err);
      }
    });
  }

  /**
   *
   * @param {type} string "SESSION" or "MESSAGE"
   * @param {sender} object "company" = string
   * @param {recipient} object {
   *  phone = string
   *  contactId = string
   *  contactLocated = boolean
   *  message = {
   *    isMedia = boolean
   *    body = object | string
   *  }
   * }
   */
  processor({ type, sender, recipient }) {
    if (!sender.company) {
      console.log(
        `Company param not found | Date: ${dateFormatted()} - ${timeFormatted()}`
      );

      return;
    }

    switch (type) {
      case "SESSION":
        this.sessionController({ ...sender });
        break;
      case "MESSAGE":
        this.sendMessage({ sender, recipient });
        break;
      default:
        console.log("Type object not found");
        break;
    }
  }

  async sendMessage({ sender, recipient }) {
    const { company } = sender;
    const { phone, message } = recipient;

    try {
      console.log(`Total active sessions | Sessions ${this.whatsapp.length}`);

      const session = this.whatsapp.find((wts) => wts.company === company);

      if (!session) {
        console.log(
          `Unable to send message, selected company does not have active session | Company: ${company} | Date: ${dateFormatted()} - ${timeFormatted()}`
        );

        return;
      }

      await session.sendMessage(phone, message);
    } catch (err) {
      console.log(
        `Erro ao enviar mensagem por WhatsApp | Company: ${company} | Date: ${dateFormatted()} - ${timeFormatted()} | Detalhes: ${
          err.message
        }`
      );
    }
  }

  async sessionController({ company, number }) {
    try {
      let session;

      console.log(
        `Start new session function | Company ${company} | Date: ${dateFormatted()} - ${timeFormatted()}`
      );

      const whatsapp = new WhatsappClient({
        authStrategy: new LocalAuth({ clientId: company }),
      });

      session = await Model_sesiones.findOne({ company });

      whatsapp.on("qr", async (qr) => {
        console.log(
          `Generate Qrcode | Company: ${company} | Date: ${dateFormatted()} - ${timeFormatted()}`
        );

        if (!session) {
          session = new Model_sesiones({
            company,
            number,
            qrcode: null,
            active_session: false,
            authenticated: false,
          });
        }

        session.active_session = false;
        session.authenticated = false;
        session.qrcode = qr;

        await session.save();

        if (process.env.API_AMBIENT == "development") {
          qrcode.generate(qr, { small: true });
        }
      });

      whatsapp.on("message", async (message) => {
        const contact = await message.getContact();

        console.log(
          `Message received from: ${
            contact.pushname
          } in ${dateFormatted()} as ${timeFormatted()}`
        );
      });

      whatsapp.on("authenticated", async (authSession) => {
        if (!session) {
          console.log(
            `Session restored by Token: ${company} | Date: ${dateFormatted()} - ${timeFormatted()} `
          );

          return;
        }

        session.active_session = true;
        session.authenticated = true;

        await session.save();
      });

      whatsapp.on("ready", async () => {
        if (!this.whatsapp || !this.whatsapp.length) {
          whatsapp.company = company;
          this.whatsapp.push(whatsapp);
        } else {
          const sessionIndex = this.whatsapp.findIndex(
            (wts) => wts.company === company
          );

          if (sessionIndex === -1) {
            whatsapp.company = company;
            this.whatsapp.push(whatsapp);
          }
        }

        console.log(`Total active sessions | Sessions ${this.whatsapp.length}`);
        console.log(
          `WhatsApp session started successfully | Company: ${company} | Date: ${dateFormatted()} - ${timeFormatted()}`
        );
      });

      whatsapp.on("auth_failure", async (message) => {
        console.log(
          `Error in initialize whatsapp session | Company: ${company} | Detalhes: ${message}`
        );

        if (!session) {
          session = new Model_sesiones({
            company,
            number,
            qrcode: null,
            active_session: false,
            authenticated: false,
          });
        }

        session.actived = false;
        session.authenticated = false;

        await session.save();
      });

      whatsapp.initialize();
    } catch (err) {
      console.log(
        `Error in the function to initialize new whatsapp session | Details: ${
          err.message
        } | Date: ${dateFormatted()} - ${timeFormatted()}`
      );
    }
  }

  async process(processFunction) {
    new Worker("@whatsapp:queue", processFunction, {
      concurrency: 100,
      connection: RedisConnection,
      limiter: { max: 400, duration: 1000 },
    });

    new QueueScheduler("@whatsapp:queue", { connection: RedisConnection });
  }
}

module.exports = WhatsappProvider;
