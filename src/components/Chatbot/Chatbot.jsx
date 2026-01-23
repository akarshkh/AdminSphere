import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    MessageSquare, X, Send, Bot, User,
    ChevronDown, Maximize2, Minimize2, Sparkles,
    RefreshCw, Terminal, Navigation
} from 'lucide-react';
import { GeminiService } from '../../services/gemini.service';
import './Chatbot.css';

const Chatbot = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [isMinimized, setIsMinimized] = useState(false);
    const [message, setMessage] = useState('');
    const [chatHistory, setChatHistory] = useState([
        { role: 'assistant', content: 'Hello! I am AdminSphere AI. How can I assist you with the portal today?' }
    ]);
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [chatHistory, isTyping]);

    const handleSend = async (e) => {
        e?.preventDefault();
        if (!message.trim() || isTyping) return;

        const userMessage = { role: 'user', content: message };
        setChatHistory(prev => [...prev, userMessage]);
        setMessage('');
        setIsTyping(true);

        try {
            const response = await GeminiService.chat(message, chatHistory);
            setChatHistory(prev => [...prev, { role: 'assistant', content: response }]);
        } catch (error) {
            setChatHistory(prev => [...prev, { role: 'assistant', content: error.message }]);
        } finally {
            setIsTyping(false);
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const clearChat = () => {
        setChatHistory([
            { role: 'assistant', content: 'Chat cleared. How can I help you now?' }
        ]);
    };

    return (
        <div className={`chatbot-container ${isOpen ? 'active' : ''}`}>
            {/* Floating Action Button */}
            <motion.button
                className="chatbot-fab"
                onClick={() => setIsOpen(!isOpen)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
            >
                <AnimatePresence mode="wait">
                    {isOpen ? (
                        <motion.div
                            key="close"
                            initial={{ rotate: -90, opacity: 0 }}
                            animate={{ rotate: 0, opacity: 1 }}
                            exit={{ rotate: 90, opacity: 0 }}
                        >
                            <X size={24} />
                        </motion.div>
                    ) : (
                        <motion.div
                            key="open"
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0, opacity: 0 }}
                            style={{ position: 'relative' }}
                        >
                            <MessageSquare size={24} />
                            <div className="fab-glow" />
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.button>

            {/* Chat Window */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        className={`chatbot-window glass-panel ${isMinimized ? 'minimized' : ''}`}
                        initial={{ opacity: 0, y: 20, scale: 0.95, transformOrigin: 'bottom right' }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.95 }}
                    >
                        {/* Header */}
                        <div className="chatbot-header">
                            <div className="header-info">
                                <div className="bot-avatar">
                                    <Bot size={18} />
                                    <div className="active-dot" />
                                </div>
                                <div>
                                    <h3>AdminSphere AI</h3>
                                    <span className="status-text">Online & Knowledgeable</span>
                                </div>
                            </div>
                            <div className="header-actions">
                                <button onClick={clearChat} title="Clear Chat">
                                    <RefreshCw size={16} />
                                </button>
                                <button onClick={() => setIsOpen(false)} title="Close">
                                    <ChevronDown size={20} />
                                </button>
                            </div>
                        </div>

                        {!isMinimized && (
                            <>
                                {/* Messages Body */}
                                <div className="chatbot-body">
                                    {chatHistory.map((msg, idx) => (
                                        <motion.div
                                            key={idx}
                                            className={`chat-message ${msg.role}`}
                                            initial={{ opacity: 0, x: msg.role === 'user' ? 10 : -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                        >
                                            <div className="message-icon">
                                                {msg.role === 'user' ? <User size={14} /> : <Bot size={14} />}
                                            </div>
                                            <div className="message-content">
                                                {msg.content.split('\n').map((line, i) => (
                                                    <p key={i}>{line}</p>
                                                ))}
                                            </div>
                                        </motion.div>
                                    ))}

                                    {isTyping && (
                                        <div className="chat-message assistant">
                                            <div className="message-icon">
                                                <Bot size={14} />
                                            </div>
                                            <div className="message-content typing">
                                                <span className="dot" />
                                                <span className="dot" />
                                                <span className="dot" />
                                            </div>
                                        </div>
                                    )}
                                    <div ref={messagesEndRef} />
                                </div>

                                {/* Input Area */}
                                <form className="chatbot-input" onSubmit={handleSend}>
                                    <textarea
                                        placeholder="Ask Me"
                                        value={message}
                                        onChange={(e) => setMessage(e.target.value)}
                                        onKeyDown={handleKeyPress}
                                        rows={1}
                                    />
                                    <button type="submit" disabled={!message.trim() || isTyping}>
                                        <Send size={18} />
                                    </button>
                                </form>

                                {/* Suggestions */}
                                {chatHistory.length < 3 && (
                                    <div className="chat-suggestions">
                                        <button onClick={() => { setMessage('Show me portal overview steps'); }}>
                                            <Navigation size={12} /> Overview Steps
                                        </button>
                                        <button onClick={() => { setMessage('How to check teams usage?'); }}>
                                            <Terminal size={12} /> Teams Usage
                                        </button>
                                        <button onClick={() => { setMessage('Where can I see secure score?'); }}>
                                            <Sparkles size={12} /> Secure Score
                                        </button>
                                    </div>
                                )}
                            </>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default Chatbot;
