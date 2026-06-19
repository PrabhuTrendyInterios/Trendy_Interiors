require('dotenv').config({ path: __dirname + '/.env', override: true });
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const connectDB = require('./config/db');
const contactRoutes = require('./routes/contacts');
const testimonialRoutes = require('./routes/testimonials');
const authRoutes = require('./routes/auth');
const projectRoutes = require('./routes/projects');
const expertiseRoutes = require('./routes/expertise');
const teamMemberRoutes = require('./routes/teamMembers');
const serviceRoutes = require('./routes/services');
const categoryRoutes = require('./routes/categories');
const designRoutes = require('./routes/designs');
const estimatorRoutes = require('./routes/estimators');
const chatbotRoutes = require('./routes/chatbot');
const settingsRoutes = require('./routes/settings');
const cmsRoutes = require('./routes/cms');
const errorHandler = require('./middleware/errorHandler');

const http = require('http');
const { Server } = require('socket.io');

const app = express();

const startServer = async () => {
  await connectDB();

  server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
};

// Middleware
app.use(cors());
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ limit: '10mb', extended: true }));

// Routes
app.use('/api/contacts', contactRoutes);
app.use('/api/testimonials', testimonialRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/expertise', expertiseRoutes);
app.use('/api/team-members', teamMemberRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/designs', designRoutes);
app.use('/api/estimators', estimatorRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/chatbot', chatbotRoutes);
app.use('/api/cms', cmsRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'Server is running' });
});

// Error handling
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

// Create HTTP server and attach Socket.IO
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_ORIGIN || '*',
    methods: ['GET', 'POST']
  }
});

// attach io to app so routes can access via req.app.get('io')
app.set('io', io);

io.on('connection', (socket) => {
  console.log('Socket connected:', socket.id);
  socket.on('disconnect', () => {
    // console.log('Socket disconnected:', socket.id);
  });
});

// Set SO_REUSEADDR to allow immediate port reuse after shutdown
server.setsockopt = function(level, optname, value) {
  if (this._handle !== null) {
    this._handle.setsockopt(level, optname, value);
  }
};

startServer().catch((error) => {
  console.error('Server startup failed:', error);
  process.exit(1);
});

// Handle port already in use error
server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use. Retrying in 3 seconds...`);
    setTimeout(() => {
      server.close();
      server.listen(PORT);
    }, 3000);
  } else {
    throw err;
  }
});
