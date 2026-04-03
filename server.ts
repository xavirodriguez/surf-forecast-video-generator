import express from "express";
import path from "path";

const app = express();
const PORT = 3000;

// In this environment, we usually serve the Remotion Studio or a preview.
// Since Remotion Studio has its own server, we might just provide a health check
// or serve the rendered files if they exist.

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", message: "Surf Forecast Video Generator is ready" });
});

// Serve rendered videos
app.use("/out", express.static(path.join(process.cwd(), "out")));

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
