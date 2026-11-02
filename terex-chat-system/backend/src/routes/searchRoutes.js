const express = require("express");
const router = express.Router();
const { searchMessages } = require("../controllers/searchController");

router.get("/messages", searchMessages);

module.exports = router;