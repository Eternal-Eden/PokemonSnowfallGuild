'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

export default function Footer() {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    
    return `${year} ${month} ${day} ${hours} ${minutes} ${seconds}`;
  };

  return (
    <motion.footer
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-t border-gray-200/50 dark:border-gray-700/50 py-3 px-4"
    >
      <div className="max-w-7xl mx-auto">
        <div className="text-center">
          <motion.p
            key={currentTime.getSeconds()}
            initial={{ opacity: 0.8 }}
            animate={{ opacity: 1 }}
            className="text-sm text-gray-600 dark:text-gray-400 font-mono"
          >
            © 落雪公会 {formatTime(currentTime)}
          </motion.p>
        </div>
      </div>
    </motion.footer>
  );
}