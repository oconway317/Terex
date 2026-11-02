const pool = require("../config/db");

const searchMessages = async (req, res) => {
  try {
    const { q } = req.query;

    if (!q || !q.trim()) {
      return res.status(400).json({ message: "Search query is required" });
    }

    const result = await pool.query(
      `
      SELECT
        m.message_id,
        m.channel_id,
        c.channel_name,
        u.full_name AS sender_name,
        m.message_text,
        m.created_at
      FROM messages m
      JOIN users u ON m.sender_id = u.user_id
      JOIN channels c ON m.channel_id = c.channel_id
      WHERE m.message_text ILIKE $1
      ORDER BY m.created_at DESC
      `,
      [`%${q}%`]
    );

    res.json(result.rows);
  } catch (error) {
    console.error("Search messages error:", error.message);
    res.status(500).json({ message: "Failed to search messages" });
  }
};

module.exports = { searchMessages };