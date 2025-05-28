import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API = 'http://localhost:5000/api';
const COURSE_ID = 101; 

const ReviewApp = () => {
  const [token, setToken] = useState('');
  const [reviews, setReviews] = useState([]);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    try {
      const res = await axios.get(`${API}/reviews/${COURSE_ID}`);
      setReviews(res.data);
    } catch (err) {
      setMessage('Error fetching reviews');
    }
  };

  const submitReview = async (e) => {
    e.preventDefault();
    if (!token) return setMessage('Please enter a token.');

    try {
      const res = await axios.post(
        `${API}/reviews`,
        { courseId: COURSE_ID, rating, comment },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMessage(res.data.message);
      setComment('');
      fetchReviews();
    } catch (err) {
      setMessage(err.response?.data?.message || 'Submission error');
    }
  };

  return (
    <div style={{ maxWidth: 600, margin: '40px auto', fontFamily: 'Arial' }}>
      <h2>Course Reviews (Course ID: {COURSE_ID})</h2>

      <div style={{ marginBottom: 20 }}>
        <label>JWT Token: </label><br />
        <input
          type="text"
          value={token}
          onChange={(e) => setToken(e.target.value)}
          placeholder="Paste JWT token here"
          style={{ width: '100%' }}
        />
      </div>

      <form onSubmit={submitReview} style={{ marginBottom: 30 }}>
        <h3>Submit a Review</h3>
        <label>
          Rating:
          <select value={rating} onChange={(e) => setRating(Number(e.target.value))}>
            {[5, 4, 3, 2, 1].map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        </label>
        <br /><br />
        <textarea
          rows="4"
          style={{ width: '100%' }}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Write your review..."
          required
        ></textarea>
        <br /><br />
        <button type="submit">Submit Review</button>
      </form>

      {message && <p style={{ color: 'crimson' }}>{message}</p>}

      <hr />

      <h3>Approved Reviews</h3>
      {reviews.length === 0 ? (
        <p>No reviews yet.</p>
      ) : (
        reviews.map((rev) => (
          <div key={rev.id} style={{ marginBottom: 20, padding: 10, border: '1px solid #ccc' }}>
            <p><strong>Rating:</strong> {rev.rating} ⭐</p>
            <p><strong>Comment:</strong> {rev.comment}</p>
            <p style={{ fontSize: '0.85em', color: '#555' }}>
              Submitted on {new Date(rev.created_at).toLocaleString()}
            </p>
          </div>
        ))
      )}
    </div>
  );
};

export default ReviewApp;
