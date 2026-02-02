
import React from 'react';
import { View } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  activeView: View;
  onViewChange: (view: View) => void;
}

const Layout: React.FC<LayoutProps> = ({ children, activeView, onViewChange }) => {
  return (
    <div className="flex flex-col h-screen overflow-hidden">
      {/* Modern Top Bar Navigation */}
      <nav className="fixed top-0 left-0 right-0 bg-black/40 backdrop-blur-xl border-b border-purple-500/20 flex justify-between items-center px-4 py-3 z-50 md:px-8">
        <div className="flex items-center gap-4">
          <button className="p-2 hover:bg-white/10 rounded-lg transition-colors">
            <MenuIcon />
          </button>
          <button className="px-4 py-2 bg-gradient-to-r from-pink-500 to-purple-600 rounded-full text-sm font-semibold hover:from-pink-600 hover:to-purple-700 transition-all shadow-lg shadow-pink-500/30">
            Login / Gal
          </button>
          <button className="p-2 hover:bg-white/10 rounded-lg transition-colors">
            <SearchIcon />
          </button>
        </div>
        
        <div className="hidden md:flex gap-8 lg:gap-12 absolute left-1/2 -translate-x-1/2">
          <button 
            onClick={() => onViewChange('home')}
            className={`flex flex-col items-center gap-1 transition-colors ${activeView === 'home' ? 'text-purple-400 border-b-2 border-purple-400 pb-1' : 'text-gray-400 hover:text-white'}`}
          >
            <HomeIcon />
            <span className="text-xs">Home / Guri</span>
          </button>
          <button 
            onClick={() => onViewChange('queue')}
            className={`flex flex-col items-center gap-1 transition-colors ${activeView === 'queue' ? 'text-purple-400 border-b-2 border-purple-400 pb-1' : 'text-gray-400 hover:text-white'}`}
          >
            <ListIcon />
            <span className="text-xs">Queue / Liiska</span>
          </button>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center font-bold text-white text-lg shadow-lg">
            A
          </div>
          <span className="hidden md:block text-lg font-bold bg-gradient-to-r from-purple-300 to-pink-300 bg-clip-text text-transparent">Abdijaliil</span>
        </div>
      </nav>

      {/* Bottom Nav for Mobile */}
      <nav className="fixed bottom-0 left-0 right-0 bg-black/40 backdrop-blur-xl border-t border-purple-500/20 flex justify-around items-center py-3 z-50 md:hidden">
        <button 
          onClick={() => onViewChange('home')}
          className={`flex flex-col items-center gap-1 transition-colors ${activeView === 'home' ? 'text-purple-400' : 'text-gray-400 hover:text-white'}`}
        >
          <HomeIcon />
          <span className="text-xs">Home</span>
        </button>
        <button 
          onClick={() => onViewChange('queue')}
          className={`flex flex-col items-center gap-1 transition-colors ${activeView === 'queue' ? 'text-purple-400' : 'text-gray-400 hover:text-white'}`}
        >
          <ListIcon />
          <span className="text-xs">Queue</span>
        </button>
        <button 
          onClick={() => onViewChange('now-playing')}
          className={`flex flex-col items-center gap-1 transition-colors ${activeView === 'now-playing' ? 'text-purple-400' : 'text-gray-400 hover:text-white'}`}
        >
          <PlayIcon />
          <span className="text-xs">Now</span>
        </button>
      </nav>

      <main className="flex-1 overflow-y-auto pt-20 pb-32 px-4 md:px-12 max-w-6xl mx-auto w-full">
        {children}
      </main>
    </div>
  );
};

const HomeIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1h1 0 001 1h3m10-11l2 2m-2-2v10a1h1 0 01-1 1h-3m-6 0a1h1 0 001-1v-4a1h1 0 011-1h2a1h1 0 011 1v4a1h1 0 001 1m-6 0h6" />
  </svg>
);

const ListIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
  </svg>
);

const PlayIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const MenuIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
  </svg>
);

const SearchIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-gray-300 cursor-pointer" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
);

const SettingsIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

export default Layout;
