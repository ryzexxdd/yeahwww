// api/verify.js — Vercel / serverless compatible
const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');
const CODES_FILE = path.join(process.cwd(), 'codes.json');

function sha(s){ return crypto.createHash('sha256').update(s).digest('hex'); }

module.exports = async (req, res) => {
  if(req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { code, deviceId } = req.body || {};
  if(!code || !deviceId) return res.status(400).json({ error: 'no data' });
  if(!/^\d{6}$/.test(code)) return res.status(400).json({ error: 'invalid format' });

  try {
    // read codes.json
    const txt = await fs.readFile(CODES_FILE, 'utf8').catch(()=> '[]');
    const arr = JSON.parse(txt || '[]');

    const h = sha(code);
    const idx = arr.findIndex(r => r.code_hash === h);
    if(idx === -1) return res.status(403).json({ error: 'Неверный код' });

    const row = arr[idx];
    if(!row.is_active) return res.status(403).json({ error: 'Код отключён' });

    // если не активирован — привязываем к deviceId
    if(!row.activated_at){
      row.activated_at = (new Date()).toISOString();
      row.assigned_device_id = deviceId;
      arr[idx] = row;
      await fs.writeFile(CODES_FILE, JSON.stringify(arr, null, 2), 'utf8');
      return res.json({ ok: true, message:'Активирован и привязан' });
    } else {
      // если уже привязан — только тому же deviceId разрешаем
      if(row.assigned_device_id === deviceId){
        return res.json({ ok: true, message:'Доступ подтверждён' });
      } else {
        return res.status(403).json({ error:'Код уже использован на другом устройстве' });
      }
    }
  } catch(err){
    console.error(err);
    return res.status(500).json({ error:'server error' });
  }
};
