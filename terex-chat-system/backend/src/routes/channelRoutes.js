const express = require("express");
const router = express.Router();
const { getAllChannels, getChannelById } = require("../controllers/channelController");

router.get("/", getAllChannels);
router.get("/:id", getChannelById);

module.exports = router;