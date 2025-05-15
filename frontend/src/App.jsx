import { useState } from 'react';
import axios from 'axios';
import './App.css';
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';
import { db } from './firebase';
import { collection, addDoc, query, where, getDocs } from 'firebase/firestore';

function parseJwt(token) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch {
    return {};
  }
}

function App() {
  const [notesList, setNotesList] = useState([]);
  const [user, setUser] = useState(null);
  const [note, setNote] = useState('');
  const [summary, setSummary] = useState('');

  const handleSignOut = () => {
  window.google.accounts.id.disableAutoSelect(); // Optional
  localStorage.removeItem("token");
  setUser(null);
  window.location.reload();
};



  const handleLoginSuccess = async (resp) => {
    const tok = resp.credential;
    if (tok) {
      const userObj = parseJwt(tok);
      const fullUser = { ...userObj, credential: tok };
      setUser(fullUser);

      const q = query(collection(db, 'notes'), where('userId', '==', userObj.sub));
      const querySnapshot = await getDocs(q);
      const fetchedNotes = [];
      querySnapshot.forEach((doc) => {
        fetchedNotes.push(doc.data());
      });
      setNotesList(fetchedNotes);
    } else {
      console.error('No credential in response');
    }
  };

  const handleLoginFailure = (err) => {
    console.error('Google login failed:', err);
  };

  const handleSubmit = async () => {
    if (note.trim().length < 5) {
      alert('Please enter a valid note!');
      return;
    }

    try {
      if (user) {
        const res = await axios.post('http://127.0.0.1:8000/process-note', {
          token: user.credential,
          text: note,
        });

        const resultSummary = res.data.summary?.summary_text || res.data.summary;
        setSummary(resultSummary);

        await addDoc(collection(db, 'notes'), {
          userId: user.sub,
          text: note,
          summary: resultSummary,
          timestamp: new Date(),
        });
      } else {
        console.error('User not logged in');
      }
    } catch (error) {
      console.error('Error submitting note:', error);
    }
  };

  return (
    <GoogleOAuthProvider clientId="23789837941-nber5iabsr4cvr2a5bui9cjp8aq6icie.apps.googleusercontent.com">
  <div className="min-vh-100" style={{ 
    position: 'relative',
    overflow: 'hidden'
  }}>
    {/* Animated Gradient Background */}
    <div style={{
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      background: 'linear-gradient(-45deg, #ee7752, #e73c7e, #23a6d5, #23d5ab)',
      backgroundSize: '400% 400%',
      animation: 'gradient 15s ease infinite',
      zIndex: 0
    }}></div>

    {/* Content Container */}
    <div style={{ position: 'relative', zIndex: 1 }}>
      <div className="container-fluid py-5">
        <div className="row justify-content-center">
          <div className="col-12 text-center">
            <h1 className="display-4 fw-bold" style={{ color: 'black', textShadow: '2px 2px 4px rgba(255,255,255,0.5)' }}>AI Notes Buddy</h1>
          </div>
        </div>

        {user ? (
          <div className="row justify-content-center">
            {/* Left column: Notes list */}
            <div className="col-md-4 mb-4 mb-md-0">
              <div className="card shadow p-3 fs-5 h-100" style={{ 
                maxHeight: '400px', 
                overflowY: 'auto',
                backgroundColor: 'rgba(255, 255, 255, 0.9)' 
              }}>
                <h5>Your Notes</h5>
                <ul className="list-group">
                  {notesList.map((item, idx) => (
                    <li
                      className="list-group-item list-group-item-action"
                      key={idx}
                      style={{ cursor: 'pointer' }}
                      onClick={() => {
                        setNote(item.text);
                        setSummary(item.summary);
                      }}
                    >
                      {item.text.split(' ').slice(0, 5).join(' ')}...
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Right column: input and user info */}
            <div className="col-md-8">
              <div className="card shadow p-4 h-100" style={{ backgroundColor: 'rgba(255, 255, 255, 0.9)' }}>
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h4>Welcome, {user.name || 'User'}!</h4>
                  <button
                    className="btn btn-danger"
                    onClick={handleSignOut}
                    style={{ minWidth: '90px' }}
                  >
                    Sign Out
                  </button>
                </div>
                <p>Email: {user.email}</p>

                <div className="mb-3">
                  <textarea
                    className="form-control"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Write your note here"
                    rows={6}
                  />
                  {summary && (
                    <div className="alert alert-secondary mt-4 fs-5 p-4">
                      <strong>Summary:</strong> {summary}
                    </div>
                  )}
                </div>

                <button className="btn btn-primary btn-lg w-100 fs-5" onClick={handleSubmit}>
                  Submit Note
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '70vh' }}>
            <div className="p-4 border rounded bg-white shadow" style={{ backgroundColor: 'rgba(255, 255, 255, 0.9)' }}>
              <GoogleLogin
                onSuccess={handleLoginSuccess}
                onError={handleLoginFailure}
                theme="filled_blue"
                size="large"
                width="300"
              />
            </div>
          </div>
        )}
      </div>
    </div>

    {/* Add this to your CSS file */}
    <style>
      {`
        @keyframes gradient {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
      `}
    </style>
  </div>
</GoogleOAuthProvider>  );
}

export default App;
