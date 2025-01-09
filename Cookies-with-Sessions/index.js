const express = require('express');
const session = require('express-session');
const cookieParser = require('cookie-parser');

const app = express();
const PORT = 3000;

// A simple mock "database" of users
const mockUsers = [
  { id: 1, username: 'john', password: 'secret123', name: 'John Doe' },
  { id: 2, username: 'jane', password: 'secret456', name: 'Jane Smith' }
];

// Middleware
app.use(express.json());
app.use(cookieParser());

// 1. Configure express-session
app.use(
  session({
    name: 'mySessionCookie',     // The name of the cookie to set (default: "connect.sid")
    secret: 'mySuperSecretKey',  // Used to sign the session ID cookie
    resave: false,               // Whether to force save session on every request
    saveUninitialized: false,    // Only save session if something is stored
    cookie: {
      httpOnly: true,            // Mitigates XSS
      secure: false,             // Should be set to true in HTTPS (production)
      sameSite: 'lax',           // Helps protect against CSRF
      maxAge: 1000 * 60 * 30     // 30 minutes in milliseconds
    }
  })
);

// 2. Login Route
app.post('/login', (req, res) => {
  const { username, password } = req.body;
  
  // Validate user credentials
  const user = mockUsers.find(
    u => u.username === username && u.password === password
  );

  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  // Save user data to session
  req.session.userId = user.id;
  req.session.username = user.username;
  // You can store additional info as needed: req.session.cart = ...

  return res.json({ message: 'Logged in successfully!' });
});

// 3. Protected Profile Route
app.get('/profile', (req, res) => {
  // Check if user is logged in by verifying session data
  if (!req.session.userId) {
    return res.status(401).json({ error: 'Not authenticated.' });
  }

  // Find the user from the "database"
  const user = mockUsers.find(u => u.id === req.session.userId);
  if (!user) {
    return res.status(404).json({ error: 'User not found.' });
  }

  res.json({ 
    username: user.username,
    name: user.name,
    message: 'Welcome to your profile!'
  });
});

// 4. Logout Route
app.post('/logout', (req, res) => {
  // Destroy the session
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ error: 'Could not log out.' });
    }

    // Clear the cookie as well
    res.clearCookie('mySessionCookie');
    res.json({ message: 'Logged out successfully!' });
  });
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
