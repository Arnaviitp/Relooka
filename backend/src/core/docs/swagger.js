const swaggerUi = require('swagger-ui-express');

const openApiSpec = {
  openapi: '3.0.3',
  info: {
    title: 'LoopWear (Closet Circle) API',
    version: '1.0.0',
    description:
      'Peer-to-peer luxury clothing rental platform in India. Monolithic REST API featuring Partner Laundry Hub operations, immutable state machine audit logs, CFO-controlled pricing, and zero-budget architecture.',
    contact: {
      name: 'LoopWear Engineering Team',
      email: 'tech@loopwear.in'
    }
  },
  servers: [
    {
      url: '/api/v1',
      description: 'Default Local / Hosted Gateway'
    }
  ],
  components: {
    securitySchemes: {
      BearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Provide your JWT access token'
      }
    },
    schemas: {
      ErrorResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          error: {
            type: 'object',
            properties: {
              code: { type: 'string', example: 'VALIDATION_ERROR' },
              message: { type: 'string', example: 'Invalid input' },
              details: { type: 'object' }
            }
          }
        }
      },
      User: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
          email: { type: 'string' },
          phone: { type: 'string' },
          role: { type: 'string', enum: ['user', 'delivery_agent', 'hub_staff', 'admin'] },
          capabilities: { type: 'array', items: { type: 'string', enum: ['renter', 'lender'] } },
          tier: { type: 'string', enum: ['Silver', 'Gold', 'Platinum', 'Diamond'] },
          emailVerified: { type: 'boolean' },
          phoneVerified: { type: 'boolean' }
        }
      }
    }
  },
  paths: {
    '/health': {
      get: {
        summary: 'API Health Check',
        responses: {
          200: { description: 'Server is healthy' }
        }
      }
    },
    '/auth/signup': {
      post: {
        summary: 'Register new user with Email & Phone OTP generation',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name', 'email', 'phone', 'password'],
                properties: {
                  name: { type: 'string' },
                  email: { type: 'string' },
                  phone: { type: 'string' },
                  password: { type: 'string', minLength: 6 },
                  capabilities: { type: 'array', items: { type: 'string', enum: ['renter', 'lender'] } }
                }
              }
            }
          }
        },
        responses: {
          201: { description: 'Registered. OTPs dispatched.' }
        }
      }
    },
    '/auth/login': {
      post: {
        summary: 'Sign in with email/phone & password',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['emailOrPhone', 'password'],
                properties: {
                  emailOrPhone: { type: 'string' },
                  password: { type: 'string' }
                }
              }
            }
          }
        },
        responses: {
          200: { description: 'Authenticated with access & refresh tokens' }
        }
      }
    },
    '/pricing/quote': {
      post: {
        summary: 'Calculate dynamic CFO rental quote & deposit hold',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['dailyRent'],
                properties: {
                  dailyRent: { type: 'number' },
                  retailPrice: { type: 'number' },
                  rentalDays: { type: 'number', default: 3 },
                  renterTier: { type: 'string', default: 'Silver' }
                }
              }
            }
          }
        },
        responses: {
          200: { description: 'Itemized rental quote breakdown' }
        }
      }
    },
    '/listings': {
      get: {
        summary: 'Browse outfits with occasion, category, and price filters',
        responses: {
          200: { description: 'List of outfits' }
        }
      },
      post: {
        summary: 'List an outfit (requires lender capability)',
        security: [{ BearerAuth: [] }],
        responses: {
          201: { description: 'Listing created, pending review & QC' }
        }
      }
    },
    '/orders': {
      post: {
        summary: 'Create rental order with initial pricing snapshot & handover OTP',
        security: [{ BearerAuth: [] }],
        responses: {
          201: { description: 'Order created with CREATED status' }
        }
      }
    },
    '/orders/{id}/handover': {
      post: {
        summary: 'Rule 4 Handover: Verify government ID and confirm recipient OTP',
        security: [{ BearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          200: { description: 'Handover cleared; status transitions to DELIVERED_TO_RENTER' }
        }
      }
    },
    '/tiers/nightly-recompute': {
      post: {
        summary: 'Idempotent nightly batch recomputation of RFM scores',
        security: [{ BearerAuth: [] }],
        responses: {
          200: { description: 'All user tiers refreshed' }
        }
      }
    }
  }
};

function setupSwagger(app) {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(openApiSpec));
  app.get('/api-docs.json', (req, res) => {
    res.json(openApiSpec);
  });
}

module.exports = {
  setupSwagger,
  openApiSpec
};

