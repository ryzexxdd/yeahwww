// api/admin.js — простая админ панель API (demo)
// Установи в Vercel переменную ADMIN_PASS=ryzx2021
const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');
const CODES_FILE = path.join(process.cwd(), 'codes.json');

function sha(s){ return crypto.createHash('sha256').update(s).digest('hex'); }
function rand6(){ return String(Math.floor(100000 + Math.random()*900000)); }

const ADMIN_PASS = process.env.ADMIN_PASS || 'ryzx2021';

async function readCodes(){ const t = await fs.readFile(CODES_FILE,'utf8').catch(()=> '[]'); return JSON.parse(t||'[]'); }
async function writeCodes(a){ await fs.writeFile(CODES_FILE, JSON.stringify(a,null,2),'utf8'); }

module.exports = async (req,res) => {
  if(req.method !== 'POST') return res.status(405).json({ error:'Method' });
  const body = req.body || {};
  const action = body.action;

  try {
    if(action === 'auth'){
      const pass = body.password || '';
      if(pass === ADMIN_PASS) return res.json({ ok:true, token: sha('adm:'+Date.now()+Math.random()) });
      return res.status(403).json({ error:'Неверный пароль' });
    }

    const token = body.token || '';
    if(!token) return res.status(403).json({ error:'No token' });

    if(action === 'list'){
      const arr = await readCodes();
      const out = arr.map(r => ({ id:r.id, activated_at:r.activated_at, assigned_device_id:r.assigned_device_id, is_active:r.is_active }));
      return res.json({ ok:true, codes: out });
    }

    if(action === 'add'){
      const code = (body.code||'').trim();
      if(!/^\d{6}$/.test(code)) return res.status(400).json({ error:'bad format' });
      const arr = await readCodes();
      const h = sha(code);
      if(arr.find(x => x.code_hash === h)) return res.status(400).json({ error:'exists' });
      arr.push({ id: crypto.randomUUID(), code_hash: h, created_by:'admin', activated_at:null, assigned_device_id:null, is_active:true, created_at:(new Date()).toISOString() });
      await writeCodes(arr);
      return res.json({ ok:true });
    }

    if(action === 'generate'){
      const count = Math.min(500, Math.max(1, parseInt(body.count||10,10)));
      const arr = await readCodes();
      const generated = [];
      for(let i=0;i<count;i++){
        let c;
        do{ c = rand6(); } while(arr.find(x=>x.code_hash===sha(c)));
        arr.push({ id: crypto.randomUUID(), code_hash:sha(c), created_by:'admin', activated_at:null, assigned_device_id:null, is_active:true, created_at:(new Date()).toISOString() });
        generated.push(c);
      }
      await writeCodes(arr);
      return res.json({ ok:true, generated });
    }

    if(action === 'revoke'){
      const code = (body.code||'').trim();
      if(!/^\d{6}$/.test(code)) return res.status(400).json({ error:'bad format' });
      const arr = await readCodes();
      const h = sha(code);
      const idx = arr.findIndex(x => x.code_hash === h);
      if(idx === -1) return res.status(404).json({ error:'not found' });
      arr[idx].is_active = false;
      await writeCodes(arr);
      return res.json({ ok:true });
    }

    return res.status(400).json({ error:'unknown action' });
  } catch(err){
    console.error(err);
    return res.status(500).json({ error:'server error' });
  }
};
