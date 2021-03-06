const express = require("express");
const router = express.Router();
const Hashids = require("hashids");
const hashids = new Hashids(
  process.env.HASHIDS_EVENT_SALT,
  process.env.HASHIDS_EVENT_LENGTH,
  process.env.HASHIDS_EVENT_ALPHABET
);

const Event = require("../../../models/event");
const Response = require("../../../models/response");

const asyncMiddleware = require("../../../middlewares/async");

const { isValidEvent } = require("../../../utils/validators");
const { RequestError } = require("../../../utils/errors");

const { RESPONDER_NAME_MAX } = require("../../../utils/constants");

// Create (POST) an Event Response
router.post("/api/event/respond", asyncMiddleware(async (req, res, next) => {

  const eventID = hashids.decode(req.body.id)[0];

  // Verify ID was decoded
  if (eventID === undefined)
    throw new RequestError("Event ID invalid");

  const event = await Event.findOne({ _id: eventID }).exec();

  // If no Event, error
  if (!event)
    throw new RequestError("No Event found for specified ID");

  if (!isValidEvent(event))
    throw new RequestError("Event not valid");

  // Create the Response
  const response = await new Response({
    eventID,
    timesSelected: req.body.events,
    email: req.body.email,
    name: req.body.name.slice(0, RESPONDER_NAME_MAX)
  }).save();

  const resp = {
    status: true,
    messages: [],
    result: {}
  };

  res
    .status(201)
    .send(resp);
}));

module.exports = router;
