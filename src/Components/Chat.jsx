import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion'; // For animations
import io from 'socket.io-client';
import axios from 'axios'; // For making HTTP requests
import {
  FaSearch,
  FaPaperPlane,
  FaSmile,
  FaCircle,
  FaEllipsisV,
  FaEdit,
  FaTrashAlt,
} from 'react-icons/fa';

const socket = io(import.meta.env.VITE_SANGAM_B); // Replace with your server's URL

const profiles = [
  {
    name: 'Aryaman',
    avatar: 'https://bootdey.com/img/Content/avatar/avatar2.png',
    status: 'Online',
    chatHistory: [],
  },
  {
    name: 'Brijesh',
    avatar: 'https://bootdey.com/img/Content/avatar/avatar1.png',
    status: 'Offline',
    chatHistory: [],
  },
];

const ChatApp = () => {
  const [message, setMessage] = useState('');
  const [selectedProfile, setSelectedProfile] = useState(profiles[0]);
  const [typing, setTyping] = useState(false);
  const [chatHistory, setChatHistory] = useState([]); // Local chat history

  useEffect(() => {
    // Load chat history from backend when a profile is selected
    const fetchChatHistory = async () => {
      try {
        const response = await axios.get(`/api/chat/history/${selectedProfile.name}`);
        // Ensure the data is an array
        const history = Array.isArray(response.data) ? response.data : [];
        setChatHistory(history); // Set the fetched chat history
      } catch (error) {
        console.error('Error fetching chat history:', error);
        setChatHistory([]); // Set chatHistory as an empty array in case of an error
      }
    };
  
    fetchChatHistory();
  
    // Listen for incoming messages via Socket.io
    socket.on('message', (message) => {
      if (message.receiver === selectedProfile.name) {
        setChatHistory((prev) => [...prev, message]);
      }
    });
  
    // Typing indicator
    socket.on('typing', (data) => {
      if (data.sender === selectedProfile.name) {
        setTyping(data.typing);
      }
    });
  
    // Cleanup socket listeners when component unmounts or profile changes
    return () => {
      socket.off('message');
      socket.off('typing');
    };
  }, [selectedProfile]);
  

  const sendMessage = async (e) => {
    e.preventDefault();
    if (message.trim()) {
      const newMessage = {
        sender: 'You',
        text: message,
        receiver: selectedProfile.name,
      };

      // Emit the message to the server via Socket.io
      socket.emit('chatMessage', newMessage);

      // Store the message in the backend (MongoDB)
      try {
        await axios.post('/api/chat/send', newMessage);
        setChatHistory((prev) => [...prev, newMessage]); // Update local chat history
        setMessage('');
      } catch (error) {
        console.error('Error sending message:', error);
      }
    }
  };

  const handleTyping = (e) => {
    setMessage(e.target.value);
    socket.emit('typing', { sender: 'You', receiver: selectedProfile.name, typing: e.target.value.length > 0 });
  };

  return (
    <div className="min-h-screen mt-4 flex bg-gray-950 text-white">
      {/* Sidebar */}
      <aside className="w-1/4 bg-gray-800 p-5 shadow-lg">
        <h2 className="text-2xl font-bold mb-5 border-b border-gray-700 pb-2">Contacts</h2>
        <ul className="space-y-3">
          {profiles.map((profile, index) => (
            <li
              key={index}
              className={`p-3 rounded-lg cursor-pointer transition-transform hover:scale-105 ${
                selectedProfile.name === profile.name
                  ? 'bg-gray-700 shadow-md'
                  : 'hover:bg-gray-700'
              }`}
              onClick={() => {
                setSelectedProfile(profile);
                setChatHistory(profile.chatHistory); // Load the selected profile's chat history
              }}
            >
              <div className="flex items-center">
                <img
                  src={profile.avatar}
                  alt={profile.name}
                  className="w-12 h-12 rounded-full mr-3"
                />
                <div>
                  <p className="font-semibold">{profile.name}</p>
                  <div className="flex items-center">
                    <p className="text-sm text-gray-400">{profile.status}</p>
                    <FaCircle
                      className={`ml-2 text-${profile.status === 'Online' ? 'green' : 'gray'}-500`}
                      size={10}
                    />
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </aside>

      {/* Chat Section */}
      <section className="flex-1 flex flex-col bg-gray-900 shadow-lg">
        {/* Chat Header */}
        <header className="flex items-center p-4 border-b border-gray-700 bg-gray-800">
          <img
            src={selectedProfile.avatar}
            alt={selectedProfile.name}
            className="w-12 h-12 rounded-full mr-3"
          />
          <div>
            <h2 className="text-lg font-semibold">{selectedProfile.name}</h2>
            <p className="text-sm text-gray-400">{typing ? 'Typing...' : selectedProfile.status}</p>
          </div>
        </header>

        {/* Chat Messages */}
        <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-gray-900">
          <ul>
            {chatHistory.map((msg, index) => (
              <motion.li
                key={index}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
                className={`max-w-[75%] p-3 rounded-lg ${
                  msg.sender === 'You'
                    ? 'bg-blue-600 ml-auto text-white'
                    : 'bg-gray-700 text-gray-300'
                }`}
              >
                <p className="text-sm font-semibold mb-1">{msg.sender}</p>
                <p>{msg.text}</p>
              </motion.li>
            ))}
          </ul>
        </div>

        {/* Message Input */}
        <form
          onSubmit={sendMessage}
          className="flex items-center p-4 bg-gray-800 border-t border-gray-700"
        >
          <div className="relative w-full">
            <input
              type="text"
              value={message}
              onChange={handleTyping}
              className="peer p-3 rounded-lg bg-gray-700 text-gray-200 focus:outline-none focus:ring focus:ring-blue-500 w-full"
              id="message"
              placeholder="Type a message"
              required
            />
            <label
              htmlFor="message"
              className="absolute left-3 text-sm text-gray-400 peer-focus:text-blue-500 top-2 transition-all duration-200 ease-in-out"
            >
              Type a message
            </label>
          </div>

          <button
            type="submit"
            className="p-3 bg-blue-600 rounded-lg ml-3 hover:bg-blue-700 transition-transform transform hover:scale-105"
          >
            <FaPaperPlane className="text-white" />
          </button>
        </form>
      </section>
    </div>
  );
};

export default ChatApp;
