const express = require("express");
const router = express.Router({ mergeParams: true });
const { getMessagesByChannel, createMessage } = require("../controllers/messageController");

router.get("/", getMessagesByChannel);
router.post("/", createMessage);

module.exports = router;