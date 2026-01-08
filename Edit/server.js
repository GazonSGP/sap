const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const app = express();
const PORT = 3000;

/* ================= HELPERS ================= */

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

const ROOT = __dirname;
const UPLOADS = path.join(ROOT, "uploads");

const DIRS = {
  images: path.join(UPLOADS, "images"),
  videos: path.join(UPLOADS, "videos"),
  files: path.join(UPLOADS, "files"),
};

Object.values(DIRS).forEach(ensureDir);

/* ================= MULTER ================= */

const storage = multer.diskStorage({
  destination(req, file, cb) {
    if (file.mimetype.startsWith("image/")) {
      cb(null, DIRS.images);
    } else if (file.mimetype.startsWith("video/")) {
      cb(null, DIRS.videos);
    } else {
      cb(null, DIRS.files);
    }
  },
  filename(req, file, cb) {
    const safeName = file.originalname.replace(/\s+/g, "_");
    cb(null, `${Date.now()}-${safeName}`);
  },
});

const upload = multer({ storage });

/* ================= UPLOAD ================= */

app.post("/upload", upload.array("files"), (req, res) => {
  const result = req.files.map((f) => ({
    type: f.mimetype.startsWith("image/")
      ? "image"
      : f.mimetype.startsWith("video/")
      ? "video"
      : "file",
    filename: f.originalname,
    url: `/uploads/${path.basename(path.dirname(f.path))}/${path.basename(
      f.path
    )}`,
  }));

  res.json(result);
});

/* ================= DELETE FILE ================= */

app.post("/delete-file", express.json(), (req, res) => {
  const { url } = req.body;
  if (!url) return res.status(400).end();

  const filePath = path.join(ROOT, url);

  fs.unlink(filePath, (err) => {
    if (err && err.code !== "ENOENT") {
      return res.status(500).json({ error: "delete failed" });
    }
    res.json({ ok: true });
  });
});

/* ================= STATIC ================= */

app.use("/uploads", express.static(UPLOADS));
app.use(express.static(ROOT));

/* ================= START ================= */

app.listen(PORT, () => {
  console.log(`✅ Server running: http://localhost:${PORT}`);
});
