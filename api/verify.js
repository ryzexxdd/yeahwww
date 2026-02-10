// api/verify.js
const CODES = ["104583"];

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const body = req.body || {};
  const code = String(body.code || "").trim();
  const deviceId = String(body.deviceId || "").trim();

  if (!code || !deviceId) {
    return res.status(400).json({ error: "No data", body });
  }

  if (!CODES.includes(code)) {
    return res.status(403).json({ error: "Неверный код", code });
  }

  return res.json({ ok: true });
};
