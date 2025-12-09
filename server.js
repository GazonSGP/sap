const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

const DATA_DIR = path.join(__dirname, 'data');
const MODULES_FILE = path.join(DATA_DIR, 'modules.json');
const INSTRUCTIONS_FILE = path.join(DATA_DIR, 'instructions.json');

// простой демо-админ
const ADMIN_USER = { username: 'admin', password: 'admin123' };
const ADMIN_TOKEN = 'very_secret_admin_token_123';

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// статика
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(express.static(path.join(__dirname, 'public')));

// ensure data
function ensureFile(file, defaultData) {
  if (!fs.existsSync(file)) {
    fs.writeFileSync(file, JSON.stringify(defaultData, null, 2), 'utf8');
  }
}
ensureFile(MODULES_FILE, []);
ensureFile(INSTRUCTIONS_FILE, []);

function readJSON(file) {
  try {
    const raw = fs.readFileSync(file, 'utf8');
    return JSON.parse(raw || '[]');
  } catch (e) {
    console.error('Error reading', file, e);
    return [];
  }
}
function writeJSON(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf8');
}

// auth middleware
function authMiddleware(req, res, next) {
  const auth = req.headers.authorization || '';
  const parts = auth.split(' ');
  if (parts.length === 2 && parts[0] === 'Bearer' && parts[1] === ADMIN_TOKEN) {
    return next();
  }
  return res.status(401).json({ message: 'Unauthorized' });
}

// ---- AUTH ----
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body || {};
  if (username === ADMIN_USER.username && password === ADMIN_USER.password) {
    return res.json({ token: ADMIN_TOKEN, username });
  }
  return res.status(401).json({ message: 'Неверный логин или пароль' });
});

// ---- MODULES ----
app.get('/api/modules', (req, res) => {
  const modules = readJSON(MODULES_FILE);
  res.json(modules);
});

app.post('/api/modules', authMiddleware, (req, res) => {
  const { code, name } = req.body || {};
  if (!code || !name) {
    return res.status(400).json({ message: 'code и name обязательны' });
  }
  const modules = readJSON(MODULES_FILE);
  const newModule = {
    id: Date.now().toString(),
    code,
    name,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  modules.push(newModule);
  writeJSON(MODULES_FILE, modules);
  res.status(201).json(newModule);
});

app.put('/api/modules/:id', authMiddleware, (req, res) => {
  const id = req.params.id;
  const { code, name } = req.body || {};
  let modules = readJSON(MODULES_FILE);
  const index = modules.findIndex(m => m.id === id);
  if (index === -1) return res.status(404).json({ message: 'Module not found' });

  modules[index] = {
    ...modules[index],
    code: code || modules[index].code,
    name: name || modules[index].name,
    updatedAt: new Date().toISOString()
  };
  writeJSON(MODULES_FILE, modules);
  res.json(modules[index]);
});

app.delete('/api/modules/:id', authMiddleware, (req, res) => {
  const id = req.params.id;
  let modules = readJSON(MODULES_FILE);
  const index = modules.findIndex(m => m.id === id);
  if (index === -1) return res.status(404).json({ message: 'Module not found' });
  const deleted = modules.splice(index, 1)[0];
  writeJSON(MODULES_FILE, modules);
  res.json(deleted);
});

// ---- INSTRUCTIONS ----
app.get('/api/instructions', (req, res) => {
  const { moduleId, search } = req.query;
  let instructions = readJSON(INSTRUCTIONS_FILE);

  if (moduleId) {
    instructions = instructions.filter(i => i.moduleId === moduleId);
  }
  if (search) {
    const q = search.toLowerCase();
    instructions = instructions.filter(i =>
      (i.title && i.title.toLowerCase().includes(q)) ||
      (i.transactionCode && i.transactionCode.toLowerCase().includes(q)) ||
      (i.notes && i.notes.toLowerCase().includes(q))
    );
  }
  res.json(instructions);
});

app.get('/api/instructions/:id', (req, res) => {
  const id = req.params.id;
  const instructions = readJSON(INSTRUCTIONS_FILE);
  const found = instructions.find(i => i.id === id);
  if (!found) return res.status(404).json({ message: 'Instruction not found' });
  res.json(found);
});

app.post('/api/instructions', authMiddleware, (req, res) => {
  const { title, moduleId, transactionCode, steps, notes, media } = req.body || {};

  if (!title || !moduleId) {
    return res.status(400).json({ message: 'title и moduleId обязательны' });
  }

  const instructions = readJSON(INSTRUCTIONS_FILE);
  const newInstruction = {
    id: Date.now().toString(),
    title,
    moduleId,
    transactionCode: transactionCode || '',
    steps: Array.isArray(steps) ? steps : [],
    notes: notes || '',
    media: Array.isArray(media) ? media : [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  instructions.push(newInstruction);
  writeJSON(INSTRUCTIONS_FILE, instructions);
  res.status(201).json(newInstruction);
});

app.put('/api/instructions/:id', authMiddleware, (req, res) => {
  const id = req.params.id;
  const { title, moduleId, transactionCode, steps, notes, media } = req.body || {};
  let instructions = readJSON(INSTRUCTIONS_FILE);
  const index = instructions.findIndex(i => i.id === id);
  if (index === -1) return res.status(404).json({ message: 'Instruction not found' });

  instructions[index] = {
    ...instructions[index],
    title: title ?? instructions[index].title,
    moduleId: moduleId ?? instructions[index].moduleId,
    transactionCode: transactionCode ?? instructions[index].transactionCode,
    steps: Array.isArray(steps) ? steps : instructions[index].steps,
    notes: notes ?? instructions[index].notes,
    media: Array.isArray(media) ? media : instructions[index].media,
    updatedAt: new Date().toISOString()
  };
  writeJSON(INSTRUCTIONS_FILE, instructions);
  res.json(instructions[index]);
});

app.delete('/api/instructions/:id', authMiddleware, (req, res) => {
  const id = req.params.id;
  let instructions = readJSON(INSTRUCTIONS_FILE);
  const index = instructions.findIndex(i => i.id === id);
  if (index === -1) return res.status(404).json({ message: 'Instruction not found' });
  const deleted = instructions.splice(index, 1)[0];
  writeJSON(INSTRUCTIONS_FILE, instructions);
  res.json(deleted);
});

// ---- FILE UPLOAD ----
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const isVideo = file.mimetype.startsWith('video/');
    const folder = isVideo ? 'videos' : 'images';
    cb(null, path.join(__dirname, 'uploads', folder));
  },
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, unique + ext);
  }
});
const upload = multer({ storage });

app.post('/api/media/upload', authMiddleware, upload.single('file'), (req, res) => {
  const file = req.file;
  if (!file) return res.status(400).json({ message: 'Файл не получен' });

  const isVideo = file.mimetype.startsWith('video/');
  const type = isVideo ? 'video' : 'image';
  const publicUrl = `/uploads/${isVideo ? 'videos' : 'images'}/${file.filename}`;

  res.json({ type, url: publicUrl });
});

// root
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log('Server started on port', PORT);
});
