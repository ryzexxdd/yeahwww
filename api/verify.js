// api/verify.js
module.exports = async (req, res) => {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { code, deviceId } = req.body || {};

  if (code === "104583") {
    return res.json({ ok: true });
  }

  return res.status(403).json({ error: "Неверный код" });
};
