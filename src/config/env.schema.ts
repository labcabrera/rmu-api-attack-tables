import Joi from 'joi';

export const envSchema = Joi.object({
  PORT: Joi.number().positive().default(3005),
  LOG_LEVEL: Joi.string().default('info'),
  // Folder with the tables (spec 013); empty: the bundled tables/ folder only.
  RMU_ATTACK_TABLES_DIR: Joi.string().allow('').default(''),
  RMU_IAM_URI: Joi.string().uri().default('http://localhost/sso'),
  RMU_IAM_REALM: Joi.string().default('rmu'),
  RMU_IAM_JWK_URI: Joi.string().uri().required(),
  RMU_IAM_ISSUER_URI: Joi.string().uri().required(),
  RMU_IAM_AUDIENCE: Joi.string().required(),
  // HTTP hardening (spec 018). No origins: CORS stays off, as the browser comes through the gateway.
  RMU_CORS_ORIGINS: Joi.string().allow('').default(''),
  RMU_THROTTLE_LIMIT: Joi.number().integer().min(0).default(300),
  RMU_THROTTLE_TTL_MS: Joi.number().integer().min(1).default(60_000),
  RMU_TRUST_PROXY: Joi.string().default('loopback, linklocal, uniquelocal'),
});
