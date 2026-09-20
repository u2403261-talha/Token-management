// Vercel Serverless Function entry point
// Connects to MongoDB (cached connection) and forwards requests to Express
const { app, connectDB } = require("../server/server");

module.exports = async (req, res) => {
  try {
    await connectDB();
    return app(req, res);
  } catch (err) {
    console.error("Vercel Serverless Handler Error:", err);
    return res.status(500).json({
      error: "Internal Server Error",
      message: "Database connection failed. Please ensure MONGO_URI is set in Vercel environment variables.",
      details: err.message,
    });
  }
};
