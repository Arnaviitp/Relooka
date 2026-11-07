const env = require('../config/env');

class CaptchaAdapter {
  async verify(token, remoteIp = null) {
    throw new Error('verify() must be implemented');
  }
}

class BypassCaptchaAdapter extends CaptchaAdapter {
  async verify(token) {
    // If dev bypass is enabled or in test environment, automatically pass
    return { success: true, reason: 'DEV_BYPASS_CAPTCHA' };
  }
}

class TurnstileCaptchaAdapter extends CaptchaAdapter {
  constructor(secretKey) {
    super();
    this.secretKey = secretKey || env.CAPTCHA_SECRET_KEY;
  }

  async verify(token, remoteIp = null) {
    if (env.DEV_BYPASS_CAPTCHA || !this.secretKey) {
      return { success: true, reason: 'BYPASS_OR_NO_KEY' };
    }
    if (!token) {
      return { success: false, reason: 'MISSING_CAPTCHA_TOKEN' };
    }

    try {
      const formData = new URLSearchParams();
      formData.append('secret', this.secretKey);
      formData.append('response', token);
      if (remoteIp) formData.append('remoteip', remoteIp);

      const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      return { success: !!data.success, errorCodes: data['error-codes'] };
    } catch (err) {
      console.error('[Turnstile Verify Error]', err.message);
      // In non-production or on network error, allow graceful degradation if configured
      return { success: false, reason: 'NETWORK_ERROR' };
    }
  }
}

function createCaptchaAdapter() {
  if (env.DEV_BYPASS_CAPTCHA || env.NODE_ENV === 'test' || !env.CAPTCHA_SECRET_KEY) {
    return new BypassCaptchaAdapter();
  }
  return new TurnstileCaptchaAdapter(env.CAPTCHA_SECRET_KEY);
}

module.exports = {
  CaptchaAdapter,
  BypassCaptchaAdapter,
  TurnstileCaptchaAdapter,
  captchaAdapter: createCaptchaAdapter()
};
