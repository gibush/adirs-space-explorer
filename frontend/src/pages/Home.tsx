import React from "react";
import { useNavigate } from "react-router-dom";

const Home: React.FC = () => {
  const navigate = useNavigate();

  const handleGoToPlatform = () => {
    navigate("/platform");
  };

  const handleSignup = () => {
    navigate("/auth?type=signup");
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-blue-900 to-black flex flex-col items-center justify-center px-4">
      <div className="text-center space-y-8 max-w-4xl">
        <h1 className="text-6xl md:text-8xl font-bold text-white mb-4">
          Space Explorer
        </h1>
        
        <p className="text-2xl md:text-4xl text-blue-200 font-light">
          Ready for your space journey?
        </p>
        
        <p className="text-lg md:text-xl text-gray-300 max-w-2xl mx-auto leading-relaxed">
          Discover the wonders of the universe through stunning images from NASA's vast collection. 
          Explore galaxies, nebulae, planets, and cosmic phenomena like never before.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mt-12">
          <button
            onClick={handleGoToPlatform}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 px-8 rounded-lg text-lg transition-colors duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            Go to Platform
          </button>
          
          <button
            onClick={handleSignup}
            className="bg-transparent border-2 border-blue-400 hover:border-blue-300 text-blue-400 hover:text-blue-300 font-semibold py-4 px-8 rounded-lg text-lg transition-colors duration-200 hover:bg-blue-400 hover:bg-opacity-10"
          >
            Sign Up
          </button>
        </div>
      </div>
      
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-2 h-2 bg-white rounded-full opacity-60 animate-pulse"></div>
        <div className="absolute top-40 right-20 w-1 h-1 bg-blue-300 rounded-full opacity-80 animate-pulse"></div>
        <div className="absolute bottom-40 left-20 w-1.5 h-1.5 bg-white rounded-full opacity-70 animate-pulse"></div>
        <div className="absolute bottom-20 right-40 w-1 h-1 bg-blue-200 rounded-full opacity-60 animate-pulse"></div>
        <div className="absolute top-60 left-1/2 w-1 h-1 bg-white rounded-full opacity-50 animate-pulse"></div>
      </div>
    </div>
  );
};

export default Home;
