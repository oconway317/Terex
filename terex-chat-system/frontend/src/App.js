import React, { useEffect, useState } from "react"; // Import React hooks used for state management and lifecycle control
import io from "socket.io-client"; // Import Socket.IO client for real-time communication with the backend server
import api from "./services/api";  // Import configured Axios instance used to communicate with the backend API
import "./App.css"; // Import configured Axios instance used to communicate with the backend API

// Establish WebSocket connection to the backend server
// This allows real-time messaging between users
const socket = io("http://localhost:5000"); 

function App() {

   // Stores authentication token (not directly used but kept for token updates)
  const [, setToken] = useState("");
  // Stores login form input values (email and password)
  const [loginData, setLoginData] = useState({
    email: "",
    password: "",
  });

   // Stores the currently authenticated user object
  const [user, setUser] = useState(null);

   // Stores the list of available support channels retrieved from the backend
  const [channels, setChannels] = useState([]);

    // Stores the currently selected support channel
  const [selectedChannel, setSelectedChannel] = useState(null);

    // Stores the currently selected support channel
  const [messages, setMessages] = useState([]);

    // Stores messages belonging to the currently selected channel
  const [messageText, setMessageText] = useState("");

  // Stores the text currently being typed into the message input box
  const [errorMessage, setErrorMessage] = useState("");

  // Stores the search text entered by the user
  const [searchQuery, setSearchQuery] = useState("");

  // Stores results returned from the message search endpoint
  const [searchResults, setSearchResults] = useState([]);



  // Handles user logout by clearing stored authentication data
  const handleLogout = () => {
  localStorage.removeItem("token");
  setUser(null);
  setSelectedChannel(null);
  setMessages([]);
  setMessageText("");
};

 // Updates login form state whenever the user types into the email/password fields
  const handleLoginChange = (e) => {
    setLoginData({
      ...loginData,
      [e.target.name]: e.target.value,
    });
  };

  // Handles login form submission and authenticates user with the backend
  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      const response = await api.post("/auth/login", loginData);
      setToken(response.data.token);
      setUser(response.data.user);
      setErrorMessage("");

      // Save authentication token to browser storage for persistent login
      localStorage.setItem("token", response.data.token);
    } catch (error) {
  console.error("LOGIN ERROR:", error);
  setErrorMessage(
    error.response?.data?.message || error.message || "Login failed"
  );
}
  };
  const handleSearch = async (e) => {
  e.preventDefault();

  try {
    const response = await api.get(`/search/messages?q=${encodeURIComponent(searchQuery)}`);
    setSearchResults(response.data);
  } catch (error) {
    console.error("Search failed", error);
  }
};

// Retrieves the list of support channels from the backend
  const fetchChannels = async () => {
    try {
      const response = await api.get("/channels");
      setChannels(response.data);
    } catch (error) {
      console.error("Failed to fetch channels", error);
    }
  };

  const fetchMessages = async (channelId) => {
    try {
      const response = await api.get(`/channels/${channelId}/messages`);
      setMessages(response.data);
    } catch (error) {
      console.error("Failed to fetch messages", error);
    }
  };

  const handleSelectChannel = (channel) => {
    setSelectedChannel(channel);
    fetchMessages(channel.channel_id);
    socket.emit("join_channel", channel.channel_id);
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();

    if (!messageText.trim() || !selectedChannel || !user) {
      return;
    }

    const messagePayload = {
      channel_id: selectedChannel.channel_id,
      sender_id: user.user_id,
      message_text: messageText,
      message_type: "text",
    };

    socket.emit("send_message", messagePayload);
    setMessageText("");
  };

  useEffect(() => {
    if (user) {
      fetchChannels();
    }
  }, [user]);

  useEffect(() => {
    socket.on("receive_message", (newMessage) => {
      if (
        selectedChannel &&
        Number(newMessage.channel_id) === Number(selectedChannel.channel_id)
      ) {
        setMessages((prevMessages) => [...prevMessages, newMessage]);
      }
    });

    return () => {
      socket.off("receive_message");
    };
  }, [selectedChannel]);

useEffect(() => {
  const storedToken = localStorage.getItem("token");

  if (storedToken) {
    api
      .get("/auth/me", {
        headers: {
          Authorization: `Bearer ${storedToken}`,
        },
      })
      .then((response) => {
        setUser(response.data.user);
      })
      .catch(() => {
        localStorage.removeItem("token");
      });
  }
}, []);
  if (!user) {
    return (
      <div className="app-container">
        <div className="login-card">
          <h1>Terex Dealer Chat</h1>
          <p>Login to access brand-specific support channels</p>
          {errorMessage && <p className="error-message">{errorMessage}</p>}
          <form onSubmit={handleLogin} className="login-form">
            <input
              type="email"
              name="email"
              placeholder="Email"
              value={loginData.email}
              onChange={handleLoginChange}
              required
            />
            <input
              type="password"
              name="password"
              placeholder="Password"
              value={loginData.password}
              onChange={handleLoginChange}
              required
            />
            <button type="submit">Login</button>
          </form>

          <div className="test-login">
            <p>Test account example:</p>
            <small>Welcome to the Prototype </small>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="layout">
      <aside className="sidebar">
        <h2>Channels</h2>
        <p className="welcome-text">Welcome, {user.full_name}</p>
        <button className="logout-button" onClick={handleLogout}>
          Logout
          </button>

        <ul className="channel-list">
          {channels.map((channel) => (
            <li
              key={channel.channel_id}
              className={
                selectedChannel?.channel_id === channel.channel_id
                  ? "channel-item active"
                  : "channel-item"
              }
              onClick={() => handleSelectChannel(channel)}
            >
              <strong>{channel.channel_name}</strong>
              <span>{channel.brand}</span>
            </li>
          ))}
        </ul>
      </aside>

      <main className="chat-area">
        {selectedChannel ? (
          <>
            <div className="chat-header">
              <h2>{selectedChannel.channel_name}</h2>
              <p>{selectedChannel.brand}</p>
            </div>
                  <form className="search-form" onSubmit={handleSearch}>
                <input
                  type="text"
                  placeholder="Search troubleshooting messages..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  <button type="submit">Search</button>
                  </form>
                  {searchResults.length > 0 && (
                  <div className="search-results">
                  <h3>Search Results</h3>

                        {searchResults.map((result) => (
                    <div key={result.message_id} className="message-card">
                    <div className="message-meta">
                    <strong>{result.sender_name}</strong>
                    <span>{new Date(result.created_at).toLocaleString()}</span>
                    </div>

                    <p>{result.message_text}</p>
                    <small>{result.channel_name}</small>
                    </div>
                    ))}
                    </div>
                    )}

            <div className="messages-container">
              {messages.map((msg) => (
                <div key={msg.message_id || Math.random()} className="message-card">
                  <div className="message-meta">
                    <strong>{msg.sender_name || `User ${msg.sender_id}`}</strong>
                    <span>
                      {msg.created_at
                        ? new Date(msg.created_at).toLocaleString()
                        : "Just now"}
                    </span>
                  </div>
                  <p>{msg.message_text}</p>
                </div>
              ))}
            </div>

            <form className="message-form" onSubmit={handleSendMessage}>
              <input
                type="text"
                placeholder="Type your message..."
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
              />
              <button type="submit">Send</button>
            </form>
          </>
        ) : (
          <div className="empty-state">
            <h2>Select a channel</h2>
            <p>Choose a Terex support channel to view and send messages.</p>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;