const Joi = require("joi");

const registerSchema = Joi.object({
  name: Joi.string().min(2).max(60).required(),
  email: Joi.string().email().required(),
  phone: Joi.string().optional(),
  password: Joi.string().min(6).max(128).required(),
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

const contactSchema = Joi.object({
  name: Joi.string().required(),
  phone: Joi.string().required(),
  relationship: Joi.string().allow(""),
  email: Joi.string().email().allow(""),
  preferred: Joi.boolean().default(false),
});

const startTripSchema = Joi.object({
  origin: Joi.object({
    lat: Joi.number().required(),
    lng: Joi.number().required(),
    label: Joi.string().allow(""),
  }),
  destination: Joi.object({
    lat: Joi.number().required(),
    lng: Joi.number().required(),
    label: Joi.string().allow(""),
  }),
  sharedWith: Joi.array()
    .items(
      Joi.object({
        name: Joi.string(),
        phone: Joi.string(),
        email: Joi.string().email(),
      })
    )
    .default([]),
  routePolyline: Joi.string().allow(""), // NEW
});


const locationUpdateSchema = Joi.object({
  lat: Joi.number().required(),
  lng: Joi.number().required(),
  ts: Joi.date().default(() => new Date()),
});

module.exports = {
  registerSchema,
  loginSchema,
  contactSchema,
  startTripSchema,
  locationUpdateSchema,
};
