const express = require('express');
const jwt = require('jsonwebtoken');
const bodyParser = require('body-parser');

const app = express();
const PORT = 3000;
const SECRET_KEY = 'your-secret-key';

app.use(bodyParser.json());

// Mock user (in a real app, you'd check a database)
const mockUser = {
  id: 1,
  username: 'john',
  password: 'mypassword123'
};

// 1. Login route to generate JWT
app.post('/login', (req, res) => {
  const { username, password } = req.body;

  // Validate user credentials
  if (username === mockUser.username && password === mockUser.password) {
    // Payload to embed in JWT
    const payload = {
      userId: mockUser.id,
      username: mockUser.username
    };

    // Sign the token with the secret key, set expiry to e.g., 1h
    const token = jwt.sign(payload, SECRET_KEY, { expiresIn: '1h' });

    res.json({ token });
  } else {
    res.status(401).json({ error: 'Invalid credentials' });
  }
});

// 2. Protected route
app.get('/protected', (req, res) => {
  // Extract token from Authorization header: "Bearer <token>"
  const authHeader = req.headers['authorization'];
  if (!authHeader) {
    return res.status(403).json({ error: 'No token provided' });
  }

  const token = authHeader.split(' ')[1]; // get the token after "Bearer"

  // Verify token
  jwt.verify(token, SECRET_KEY, (err, decoded) => {
    if (err) {
      return res.status(401).json({ error: 'Token is invalid or expired' });
    }

    // If valid, decoded will contain the payload used to sign the token
    res.json({
      message: 'Protected data access granted',
      decoded
    });
  });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
