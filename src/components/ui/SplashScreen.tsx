import React from 'react';
import './SplashScreen.css';

const SplashScreen: React.FC<{ className?: string }> = ({ className }) => {
  return (
    <div className={`splash-screen ${className || ''}`}>
      <div className="splash-content">
        <h1>Loading...</h1>
      </div>
    </div>
  );
};

export default SplashScreen;
