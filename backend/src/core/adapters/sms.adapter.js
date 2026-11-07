class SmsAdapter {
  async sendSms({ to, message }) {
    throw new Error('sendSms() must be implemented');
  }
}

/**
 * Free/Console Stub for SMS.
 * As per LoopWear Zero-Budget Rules: NO paid SMS gateway is integrated.
 * Phone verification OTP is logged here in dev/demo; real production channel is Email OTP.
 */
class ConsoleSmsAdapter extends SmsAdapter {
  async sendSms({ to, message }) {
    console.log(`\n================== [SMS (CONSOLE STUB)] ==================`);
    console.log(`To Phone: ${to}`);
    console.log(`Message: ${message}`);
    console.log(`==========================================================\n`);
    return { success: true, messageId: `sms-stub-${Date.now()}` };
  }
}

module.exports = {
  SmsAdapter,
  ConsoleSmsAdapter,
  smsAdapter: new ConsoleSmsAdapter()
};

