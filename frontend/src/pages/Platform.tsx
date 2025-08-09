import React, { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { apiUtils, authAPI } from "../api";
import Grid from "../components/Grid/Grid";
import ImageView from "../components/ImageView/ImageView";
import SearchBox from "../components/SearchBox/SearchBox";
import UserAvatar from "../components/shared/UserAvatar/UserAvatar";

const Platform: React.FC = () => {
  const navigate = useNavigate();
  const [isValidating, setIsValidating] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userFirstName, setUserFirstName] = useState<string>("");
  const [userLastName, setUserLastName] = useState<string>("");

  useEffect(() => {
    const validateUserAuth = async () => {
      try {
        const token = apiUtils.getAuthToken();
        if (!token) {
          navigate("/auth?type=login");
          return;
        }

        const response = await authAPI.validateToken({ token });
        
        if (response.data.valid) {
          setIsAuthenticated(true);
          // Fetch user details for avatar initials
          try {
            const userResponse = await authAPI.getCurrentUser();
            if (userResponse.data.success) {
              setUserFirstName(userResponse.data.user.first_name);
              setUserLastName(userResponse.data.user.last_name);
            }
          } catch (userError) {
            console.error("Failed to fetch user details:", userError);
          }
        } else {
          apiUtils.removeAuthToken();
          navigate("/auth?type=login");
        }
      } catch (error) {
        console.error("Token validation failed:", error);
        apiUtils.removeAuthToken();
        navigate("/auth?type=login");
      } finally {
        setIsValidating(false);
      }
    };

    validateUserAuth();
  }, [navigate]);

  // Memoized user initials calculation
  const userInitials = useMemo(() => {
    if (!userFirstName || !userLastName) {
      return "FL"; // fallback initials
    }
    return `${userFirstName.charAt(0).toUpperCase()}${userLastName.charAt(0).toUpperCase()}`;
  }, [userFirstName, userLastName]);

  if (isValidating) {
    return (
      <div className="min-h-screen bg-space flex items-center justify-center">
        <div className="text-white text-lg flex items-center">
          <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Verifying authentication...
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-space flex items-center justify-center">
        <div className="text-white text-lg">Redirecting to login...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-space">
      {/* Fixed Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-space/80 backdrop-blur-sm border-b border-white/10">
        <div className="flex items-center justify-between px-6 py-4">
          {/* Logo */}
          <div className="flex items-center">
            <img 
              src="/conntour_logo_white.svg" 
              alt="Conntour Logo" 
              className="h-8 w-auto cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => navigate("/")}
            />
          </div>
          
          {/* Avatar */}
          <div className="flex items-center">
            <UserAvatar initials={userInitials} />
          </div>
        </div>
      </header>
      
      {/* Main content with top padding to account for fixed header */}
      <div className="pt-20">
        <SearchBox />
        <Grid />
        <ImageView />
      </div>
    </div>
  );
};

export default Platform;
