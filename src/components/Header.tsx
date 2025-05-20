
import React from 'react';

const Header = () => {
  return (
    <header className="w-full py-6 px-4 md:px-8">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center">
          {/* Replace with your actual logo */}
          <div className="h-10 w-10 rounded-lg bg-gradient-to-r from-purple-600 to-blue-500 flex items-center justify-center text-white font-bold text-xl">
            A
          </div>
          <span className="ml-3 text-xl font-bold gradient-text">AudioViz</span>
        </div>
        <nav className="hidden md:flex items-center space-x-8">
          <a href="#" className="text-gray-600 hover:text-gray-900 font-medium">Home</a>
          <a href="#" className="text-gray-600 hover:text-gray-900 font-medium">About</a>
          <a href="#" className="text-gray-600 hover:text-gray-900 font-medium">Contact</a>
        </nav>
      </div>
    </header>
  );
};

export default Header;
