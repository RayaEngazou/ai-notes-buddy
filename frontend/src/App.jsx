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
    <GoogleOAuthProvider clientId="23789837941-od2kghqa1c17jlqug3vflrh475gq6qmh.apps.googleusercontent.com">
      <div className="min-vh-100 bg-light d-flex flex-column justify-content-center align-items-center">
        
          <div className="mb-4 text-center">
            <h1 className="display-5 fw-bold">AI Notes Buddy</h1>
          </div>

          {user ? (
            <div className="row w-100">
              {/* Left column: Notes list */}
              <div className="col-md-4 d-flex flex-column align-items-start">
                <div className="card shadow p-5 fs-5" style={{ minHeight: '500px', overflowY: 'auto' }}>
                  <h5>Your Notes</h5>
                  <ul className="list-group">
                    {notesList.map((item, idx) => (
                      <li
                        className="list-group-item list-group-item-action"
                        key={idx}
                        style={{ cursor: 'pointer' }}
                        onClick={() => {
                          setNote(item.text);        // Show full note in textarea
                          setSummary(item.summary);  // Show its summary
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
                <div className="card shadow p-4">
                  <h4>Welcome, {user.name || 'User'}!</h4>
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

                  {/* Larger submit button */}
                  <button className="btn btn-primary btn-lg w-100" onClick={handleSubmit}>
                    Submit Note
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="d-flex justify-content-center">
              <GoogleLogin onSuccess={handleLoginSuccess} onError={handleLoginFailure} />
            </div>
          )}
        
      </div>
    </GoogleOAuthProvider>
  );
}

export default App;
