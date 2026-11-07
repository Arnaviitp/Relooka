const { z } = require('zod');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(5000),
  HOST: z.string().default('0.0.0.0'),
  APP_NAME: z.string().default('LoopWear'),
  CLIENT_URL: z.string().default('http://localhost:5173'),

  // Database
  MONGO_URI: z.string().default('mongodb://127.0.0.1:27017/loopwear'),

  // Queue
  QUEUE_TYPE: z.enum(['memory', 'bullmq']).default('memory'),
  REDIS_URL: z.string().default('redis://127.0.0.1:6379'),

  // Security & Tokens
  JWT_ACCESS_SECRET: z.string().default('dev_jwt_access_secret_32_characters_minimum!'),
  JWT_REFRESH_SECRET: z.string().default('dev_jwt_refresh_secret_32_characters_minimum!'),
  JWT_ACCESS_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),
  ENCRYPTION_KEY: z.string().default('0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef'), // 64 hex chars = 32 bytes

  // Cron / Scheduler Secret for Free Tier external scheduler trigger
  CRON_SECRET: z.string().default('dev_cron_secret_key_change_in_production'),

  // Adapters configuration
  DEV_BYPASS_CAPTCHA: z.coerce.boolean().default(true),
  CAPTCHA_DRIVER: z.enum(['turnstile', 'hcaptcha', 'bypass']).default('bypass'),
  CAPTCHA_SECRET_KEY: z.string().optional(),

  MAIL_DRIVER: z.enum(['console', 'smtp']).default('console'),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().default(587),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  MAIL_FROM: z.string().default('LoopWear <noreply@loopwear.in>'),

  SMS_DRIVER: z.enum(['console']).default('console'),

  STORAGE_DRIVER: z.enum(['local', 'freemedia']).default('local'),
  UPLOAD_DIR: z.string().default(path.resolve(process.cwd(), 'uploads')),

  PAYMENT_GATEWAY: z.enum(['mock', 'razorpay_test']).default('mock'),
  RAZORPAY_KEY_ID: z.string().optional(),
  RAZORPAY_KEY_SECRET: z.string().optional(),

  PUSH_DRIVER: z.enum(['inapp', 'fcm']).default('inapp'),
  FCM_SERVER_KEY: z.string().optional(),

  DELIVERY_DRIVER: z.enum(['mock']).default('mock'),

  ID_VERIFICATION_DRIVER: z.enum(['manual_admin', 'stub']).default('manual_admin')
});

let validatedEnv;
try {
  validatedEnv = envSchema.parse(process.env);
} catch (error) {
  console.error('Environment validation failed:', error.errors || error.message);
  // Fall back to defaults for safety in test or dev
  validatedEnv = envSchema.parse({});
}

module.exports = validatedEnv;

