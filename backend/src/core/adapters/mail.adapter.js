const nodemailer = require('nodemailer');
const env = require('../config/env');

class MailAdapter {
  async sendMail({ to, subject, html, text }) {
    throw new Error('sendMail() must be implemented');
  }
}

class ConsoleMailAdapter extends MailAdapter {
  async sendMail({ to, subject, html, text }) {
    console.log(`\n================== [MAIL (CONSOLE STUB)] ==================`);
    console.log(`To: ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(`Content:\n${text || html}`);
    console.log(`===========================================================\n`);
    return { success: true, messageId: `console-${Date.now()}` };
  }
}

class SmtpMailAdapter extends MailAdapter {
  constructor() {
    super();
    if (!env.SMTP_HOST || !env.SMTP_USER) {
      console.warn('[MailAdapter] SMTP credentials not fully provided; falling back to ConsoleMailAdapter');
      this.fallback = new ConsoleMailAdapter();
      return;
    }

    this.transporter = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: env.SMTP_PORT === 465,
      auth: {
        user: env.SMTP_USER,
        pass: env.SMTP_PASS
      }
    });
  }

  async sendMail({ to, subject, html, text }) {
    if (this.fallback) {
      return this.fallback.sendMail({ to, subject, html, text });
    }

    try {
      const info = await this.transporter.sendMail({
        from: env.MAIL_FROM,
        to,
        subject,
        html,
        text
      });
      return { success: true, messageId: info.messageId };
    } catch (err) {
      console.error('[MailAdapter SMTP Error]', err.message);
      // Fall back to console so operations don't completely crash on SMTP failure
      const fallback = new ConsoleMailAdapter();
      return fallback.sendMail({ to, subject, html, text });
    }
  }
}

function createMailAdapter() {
  if (env.MAIL_DRIVER === 'smtp' && env.SMTP_HOST) {
    return new SmtpMailAdapter();
  }
  return new ConsoleMailAdapter();
}

module.exports = {
  MailAdapter,
  ConsoleMailAdapter,
  SmtpMailAdapter,
  mailAdapter: createMailAdapter()
};
