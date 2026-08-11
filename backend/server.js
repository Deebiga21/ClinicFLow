require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const mongoose = require('mongoose');
const { Server } = require('socket.io');

const queueRoutes       = require('./routes/queue');
const authRoutes        = require('./routes/auth');
const chatRoutes        = require('./routes/chat');
const doctorRoutes      = require('./routes/doctors');
const appointmentRoutes = require('./routes/appointments');
const analyticsRoutes   = require('./routes/analytics');
const adminRoutes       = require('./routes/admin');
const visitRoutes       = require('./routes/visits');
const { router: mlRoutes } = require('./routes/ml');
const treatmentsRoutes  = require('./routes/treatments');
const clinicalAIRoutes  = require('./routes/clinicalAI');

const Message = require('./models/Message');
const { verifyToken } = require('./middleware/auth');

const app    = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST', 'PUT', 'DELETE'] }
});

io.use((socket, next) => {
  const token = socket.handshake.auth?.token;
  if (token) {
    const decoded = verifyToken(token);
    if (decoded) socket.data.user = decoded;
  }
  next();
});

io.on('connection', (socket) => {
  socket.on('chat:join',  ({ tokenNumber }) => { if (tokenNumber) socket.join(`token:${tokenNumber}`); });
  socket.on('chat:leave', ({ tokenNumber }) => { if (tokenNumber) socket.leave(`token:${tokenNumber}`); });
  socket.on('doctor:join', ({ doctorId }) => { if (doctorId) socket.join(`doctor:${doctorId}`); });

  socket.on('chat:send', async ({ tokenNumber, text, senderRole, senderName }) => {
    if (!tokenNumber || !text?.trim()) return;
    try {
      const msg = await Message.create({
        tokenNumber: Number(tokenNumber),
        senderRole: senderRole === 'staff' ? 'staff' : 'patient',
        senderName: senderName || '',
        text: text.trim()
      });
      const payload = {
        _id: msg._id, tokenNumber: msg.tokenNumber,
        senderRole: msg.senderRole, senderName: msg.senderName,
        text: msg.text, createdAt: msg.createdAt
      };
      io.to(`token:${tokenNumber}`).emit('chat:message', payload);
      // Emit global notification for staff & nurses
      io.emit('chat:new_message', payload);
      if (senderRole !== 'staff') {
        io.emit('notify', {
          tone: 'info',
          title: `💬 New Message from Token #${tokenNumber}`,
          message: `${senderName || 'Patient'}: "${text.trim().slice(0, 45)}"`,
          tokenNumber: msg.tokenNumber
        });
      }
    } catch (err) { console.error('chat:send error', err); }
  });
});

app.use(cors());
app.use(express.json());
app.use((req, _res, next) => { req.io = io; next(); });

// Routes
app.use('/api/auth',  authRoutes);
app.use('/api',       queueRoutes);
app.use('/api',       chatRoutes);
app.use('/api',       doctorRoutes);
app.use('/api',       appointmentRoutes);
app.use('/api',       analyticsRoutes);
app.use('/api',       adminRoutes);
app.use('/api',       visitRoutes);
app.use('/api',       mlRoutes);
app.use('/api',       treatmentsRoutes);
app.use('/api',       clinicalAIRoutes);

app.get('/api/health', (_req, res) => res.json({ status: 'ok', time: new Date().toISOString() }));

const { MongoMemoryServer } = require('mongodb-memory-server');

const PORT = process.env.PORT || 5000;

async function startDatabaseAndServer() {
  try {
    const mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    
    await mongoose.connect(mongoUri);
    console.log('MongoDB connected successfully to IN-MEMORY database (No installation required!)');
    
    server.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
  } catch (err) {
    console.error('Failed to start in-memory MongoDB:', err);
  }
}

startDatabaseAndServer();
