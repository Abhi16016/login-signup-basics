const express = require('express');
const cookieParser = require('cookie-parser');
const app = express();
const PORT = 3000;

// In-memory "database" for example (replace with real DB in production)
const mockUsers = [
  { id: 1, username: 'john', password: 'secret123', name: 'John Doe' },
  { id: 2, username: 'jane', password: 'secret456', name: 'Jane Smith' }
];

// Middleware
app.use(express.json());
app.use(cookieParser());

// 1. Login Route (POST /login)
//    - Validates credentials, sets a cookie "sessionId"
app.post('/login', (req, res) => {
  const { username, password } = req.body;

  // Check if user exists
  const user = mockUsers.find(u => u.username === username && u.password === password);
  
  if (user) {
    // Let's say we generate a random session ID for demonstration
    // In reality, you'd securely generate and store this in a session store.
    const sessionId = `session-${user.id}-${Date.now()}`;

    // Setting the cookie with various attributes
    res.cookie('sessionId', sessionId, {
      httpOnly: true,        // Prevent client-side JS from reading the cookie
      secure: false,         // Set to 'true' in production over HTTPS
      sameSite: 'lax',       // Lax helps protect against CSRF while allowing normal POST from same site
      maxAge: 1000 * 60 * 30 // 30 minutes in milliseconds
    });

    // Additionally, store the session -> user mapping server-side for simplicity
    // (In real app, store in a DB or in-memory store like Redis, keyed by sessionId)
    // For demonstration, let's attach it to `app.locals.sessions`:
    if (!app.locals.sessions) {
      app.locals.sessions = {};
    }
    app.locals.sessions[sessionId] = {
      userId: user.id,
      username: user.username
    };

    res.json({ message: 'Logged in successfully!', sessionId });
  } else {
    res.status(401).json({ error: 'Invalid credentials' });
  }
});

// 2. Profile Route (GET /profile)
//    - Reads the "sessionId" cookie and returns the user's profile if valid
app.get('/profile', (req, res) => {
  const { sessionId } = req.cookies;

  if (!sessionId) {
    return res.status(403).json({ error: 'No session cookie found. Please log in.' });
  }
  
  // Retrieve session data (in real app, from DB or session store)
  const sessions = app.locals.sessions || {};
  const sessionData = sessions[sessionId];

  if (!sessionData) {
    return res.status(401).json({ error: 'Invalid session. Please log in again.' });
  }

  // Look up the user details
  const user = mockUsers.find(u => u.id === sessionData.userId);
  if (!user) {
    return res.status(404).json({ error: 'User not found.' });
  }

  // Return user profile data
  res.json({ 
    username: user.username,
    name: user.name,
    message: 'Welcome to your profile!'
  });
});

// 3. Logout Route (POST /logout)
//    - Clears (expires) the session cookie
app.post('/logout', (req, res) => {
  const { sessionId } = req.cookies;
  
  if (sessionId) {
    // Remove session from server store
    delete app.locals.sessions[sessionId];
  }
  
  // Clear the cookie by setting it to an empty value with an immediate expiration
  res.clearCookie('sessionId');

  res.json({ message: 'Logged out successfully!' });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
