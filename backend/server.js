const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const app = express();


app.use(cors());
app.use(express.json());

const token = jwt.sign({ id: 1 }, 'your_jwt_secret');
console.log(token);

const db = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '123456789',
  database: 'rr'
});


const authenticateUser = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Unauthorized' });

  try {
    const decoded = jwt.verify(token, 'your_jwt_secret'); 
    req.user = { id: decoded.id };
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid token' });
  }
};


const blockedWords = ['badword1', 'badword2', 'uglyword'];
function containsProfanity(text) {
  const regex = new RegExp(`\\b(${blockedWords.join('|')})\\b`, 'i');
  return regex.test(text);
}


app.post('/api/reviews', authenticateUser, async (req, res) => {
  const { courseId, rating, comment } = req.body;
  const userId = req.user.id;

  try {
    
    const [completed] = await db.execute(
      `SELECT * FROM enrollments WHERE user_id = ? AND course_id = ? AND status = 'completed'`,
      [userId, courseId]
    );
    if (completed.length === 0) {
      return res.status(403).json({ message: 'You must complete the course to submit a review.' });
    }

    
    const [existingReview] = await db.execute(
      `SELECT * FROM reviews WHERE user_id = ? AND course_id = ?`,
      [userId, courseId]
    );
    if (existingReview.length > 0) {
      return res.status(400).json({ message: 'You’ve already submitted a review for this course.' });
    }

   
    if (containsProfanity(comment)) {
      return res.status(400).json({ message: 'Your review contains inappropriate language.' });
    }

    
    await db.execute(
      `INSERT INTO reviews (user_id, course_id, rating, comment, is_approved) VALUES (?, ?, ?, ?, true)`,
      [userId, courseId, rating, comment]
    );

    res.status(201).json({ message: 'Review submitted successfully!' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});


app.get('/api/reviews/:courseId', async (req, res) => {
  const courseId = req.params.courseId;
  try {
    const [reviews] = await db.execute(
      `SELECT * FROM reviews WHERE course_id = ? AND is_approved = true ORDER BY created_at DESC`,
      [courseId]
    );
    res.json(reviews);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching reviews' });
  }
});


app.get('/api/reviews/:courseId/user', authenticateUser, async (req, res) => {
  const courseId = req.params.courseId;
  const userId = req.user.id;

  try {
    const [userReview] = await db.execute(
      `SELECT * FROM reviews WHERE course_id = ? AND user_id = ?`,
      [courseId, userId]
    );

    if (userReview.length === 0) {
      return res.status(404).json({ message: 'No review found for this course by the user' });
    }

    res.json(userReview[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error fetching user review' });
  }
});


app.listen(5000, () => {
  console.log('Server running on http://localhost:5000');
});
