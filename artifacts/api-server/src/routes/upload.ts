import { Router } from "express";
import multer from "multer";

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

router.post("/upload-bukti", upload.single("bukti"), async (req, res) => {
  if (!req.file) {
    res.status(400).json({ error: "File tidak ditemukan" });
    return;
  }

  const apiKey = process.env.IMGBB_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: "IMGBB_API_KEY tidak dikonfigurasi" });
    return;
  }

  const base64 = req.file.buffer.toString("base64");
  const form = new URLSearchParams();
  form.set("key", apiKey);
  form.set("image", base64);

  let imgbbRes: Response;
  try {
    imgbbRes = await fetch("https://api.imgbb.com/1/upload", {
      method: "POST",
      body: form,
    });
  } catch (err) {
    req.log.error({ err }, "ImgBB fetch failed (network error)");
    res.status(502).json({ error: "Gagal menghubungi ImgBB" });
    return;
  }

  if (!imgbbRes.ok) {
    const text = await imgbbRes.text().catch(() => "(unreadable)");
    req.log.error({ status: imgbbRes.status, body: text }, "ImgBB upload failed");
    res.status(502).json({ error: "Gagal upload ke ImgBB" });
    return;
  }

  let json: { data: { url: string; display_url: string } };
  try {
    json = await imgbbRes.json() as { data: { url: string; display_url: string } };
  } catch (err) {
    req.log.error({ err }, "ImgBB response JSON parse failed");
    res.status(502).json({ error: "Respons ImgBB tidak valid" });
    return;
  }

  res.json({ url: json.data.url });
});

export default router;
