const pool = require("../config/db");

const getMessagesByChannel = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `
      SELECT 
        m.message_id,
        m.channel_id,
        m.sender_id,
        u.full_name AS sender_name,
        m.message_text,
        m.created_at,
        m.edited_at,
        m.message_type,
        m.attachment_id
      FROM messages m
      JOIN users u ON m.sender_id = u.user_id
      WHERE m.channel_id = $1
      ORDER BY m.created_at ASC
      `,
      [id]
    );

    res.json(result.rows);
  } catch (error) {
    console.error("Get messages error:", error.message);
    res.status(500).json({ message: "Failed to fetch messages" });
  }
};

const createMessage = async (req, res) => {
  try {
    const { id } = req.params;
    const { sender_id, message_text, message_type = "text", attachment_id = null } = req.body;

    const result = await pool.query(
      `
      INSERT INTO messages (channel_id, sender_id, message_text, message_type, attachment_id)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
      `,
      [id, sender_id, message_text, message_type, attachment_id]
    );

    res.status(201).json({
      message: "Message created successfully",
      data: result.rows[0],
    });
  } catch (error) {
    console.error("Create message error:", error.message);
    res.status(500).json({ message: "Failed to create message" });
  }
};

module.exports = {
  getMessagesByChannel,
  createMessage,
};