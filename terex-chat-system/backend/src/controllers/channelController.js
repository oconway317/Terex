const pool = require("../config/db");

const getAllChannels = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT channel_id, channel_name, brand, created_by, created_at, is_private
      FROM channels
      ORDER BY channel_name ASC
    `);

    res.json(result.rows);
  } catch (error) {
    console.error("Get channels error:", error.message);
    res.status(500).json({ message: "Failed to fetch channels" });
  }
};

const getChannelById = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `
      SELECT channel_id, channel_name, brand, created_by, created_at, is_private
      FROM channels
      WHERE channel_id = $1
      `,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Channel not found" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Get channel error:", error.message);
    res.status(500).json({ message: "Failed to fetch channel" });
  }
};

module.exports = {
  getAllChannels,
  getChannelById,
};