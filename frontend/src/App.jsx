import { useState } from 'react';
import axios from 'axios';
import './App.css';
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';
import { db } from './firebase';
import { collection, addDoc } from 'firebase/firestore';

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
  const [user, setUser] = useState(null);
  const [note, setNote] = useState('');
  const [summary, setSummary] = useState('');

  const handleLoginSuccess = (resp) => {
    console.log('Google login successful:', resp);
    const tok = resp.credential;
    if (tok) {
      const userObj = parseJwt(tok);
      console.log('Decoded user:', userObj);
      setUser({
        ...userObj, // Store the user data, including the token (credential)
        credential: tok, // Store the token (Google ID token) here
      });
    } else {
      console.error('No credential in response');
    }
  };

  const handleLoginFailure = (err) => {
    console.error('Google login failed:', err);
  };

  const handleSubmit = async () => {
    try {
      if (user) {
        const res = await axios.post("http://127.0.0.1:8000/process-note", {
          token: user.credential, // Sending the token (credential from Google OAuth)
          text: note,
        });
        setSummary(res.data.summary);

        // Save to Firestore
        await addDoc(collection(db, "notes"), {
          userId: user.sub,
          text: note,
          summary: res.data.summary,
          timestamp: new Date(),
        });
      } else {
        console.error("User not logged in");
      }
    } catch (error) {
      console.error("Error submitting note:", error);
    }
  };

  return (
    <GoogleOAuthProvider clientId="23789837941-nber5iabsr4cvr2a5bui9cjp8aq6icie.apps.googleusercontent.com">
      <div className="App">
        <h1>AI Notes Buddy</h1>

        {user ? (
          <div>
            <h2>Welcome, {user.name}!</h2>
            <p>Email: {user.email}</p>

            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Write your note here"
              rows={6}
              cols={60}
            />
            <br />
            <button onClick={handleSubmit}>Submit Note</button>

            {summary && (
              <div>
                <h3>Summary:</h3>
                <p>{summary}</p>
              </div>
            )}
          </div>
        ) : (
          <GoogleLogin
            onSuccess={handleLoginSuccess}
            onError={handleLoginFailure}
          />
        )}
      </div>
    </GoogleOAuthProvider>
  );
}

export default App;
