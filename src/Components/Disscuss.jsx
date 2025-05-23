import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';
import { AiOutlineSend, AiFillStar, AiOutlineStar, AiFillDelete } from 'react-icons/ai';
import { FaPaperclip, FaSmile } from 'react-icons/fa';

const socket = io(import.meta.env.VITE_SANGAM_BACKEND);

const departments = [
  { name: "Road Department", icon: "🛣️" },
  { name: "Electricity Department", icon: "⚡" },
  { name: "Water Department", icon: "💧" },
  { name: "Gas Pipelines", icon: "⛽" },
  { name: "Municipal Department", icon: "🏢" },
];

const Discuss = () => {
  const [selectedDepartment, setSelectedDepartment] = useState(departments[0].name);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  useEffect(() => {
    socket.emit('joinDepartment', selectedDepartment);
    socket.on('messageHistory', (history) => setMessages(history));
    socket.on('newMessage', (message) => setMessages((prev) => [...prev, message]));
    socket.on('typing', (status) => setIsTyping(status));
    return () => {
      socket.off('messageHistory');
      socket.off('newMessage');
      socket.off('typing');
    };
  }, [selectedDepartment]);

  const handleSendMessage = () => {
    if (!newMessage.trim()) return;
    const message = {
      id: Date.now(),
      user: "Current User",
      department: selectedDepartment,
      content: newMessage,
      time: new Date().toLocaleTimeString(),
      isFavorite: false,
    };
    socket.emit('sendMessage', message);
    setMessages((prev) => [...prev, message]);
    setNewMessage("");
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-950 ">
      <div className="flex  w-full h-full  bg-gray-900 text-gray-200 shadow-lg overflow-hidden">
        {/* Sidebar */}
        <aside className="w-1/4 bg-gray-800 p-5">
          <h2 className="text-2xl font-semibold mb-6 border-b border-gray-700 pb-2">Departments</h2>
          <ul className="space-y-3">
            {departments.map((dept, index) => (
              <li
                key={index}
                className={`flex items-center p-4 rounded-lg cursor-pointer transition-all hover:scale-105 ${
                  selectedDepartment === dept.name ? 'bg-gray-700 shadow-md' : 'bg-gray-800 hover:bg-gray-700'
                }`}
                onClick={() => setSelectedDepartment(dept.name)}
              >
                <span className="mr-3 text-lg">{dept.icon}</span> {dept.name}
              </li>
            ))}
          </ul>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6 flex flex-col space-y-4">
          <h1 className="text-3xl font-bold">{selectedDepartment} Discussion</h1>
          {isTyping && <p className="text-sm italic text-gray-400 animate-pulse">Someone is typing...</p>}

          {/* Messages */}
          <div className="flex-1 overflow-y-auto space-y-4 p-4 bg-gray-800 rounded-lg shadow-inner">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`p-4 rounded-lg relative shadow-md ${
                  msg.user === "Current User" ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300'
                }`}
              >
                <div className="flex justify-between items-center mb-2">
                  <p className="font-bold text-lg">{msg.user}</p>
                  <div className="flex space-x-3">
                    <button className="text-yellow-500 hover:text-yellow-400">
                      {msg.isFavorite ? <AiFillStar size={20} /> : <AiOutlineStar size={20} />}
                    </button>
                    <button className="text-red-500 hover:text-red-400">
                      <AiFillDelete size={20} />
                    </button>
                  </div>
                </div>
                <p className="mb-1">{msg.content}</p>
                <p className="text-xs text-gray-500">{msg.time}</p>
              </div>
            ))}
          </div>

          {/* Input Box */}
          <div className="mt-4 flex items-center bg-gray-700 p-3 rounded-lg shadow-md">
            <FaPaperclip className="text-gray-400 mr-3 cursor-pointer hover:text-gray-200" size={20} />
            <input
              type="text"
              className="flex-1 bg-gray-600 p-3 rounded-l-lg text-gray-200 focus:outline-none"
              placeholder="Type your message..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
            />
            <button
              onClick={handleSendMessage}
              className="bg-blue-500 px-5 py-2 rounded-r-lg hover:bg-blue-600 transition"
            >
              <AiOutlineSend size={20} />
            </button>
            <FaSmile className="text-gray-400 ml-3 cursor-pointer hover:text-gray-200" size={20} />
          </div>
        </main>
      </div>
    </div>
  );
};

export default Discuss;
