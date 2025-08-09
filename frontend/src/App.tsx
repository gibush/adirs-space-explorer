import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ContextProvider } from "./context";
import Home from "./pages/Home";
import Platform from "./pages/Platform";
import Auth from "./pages/Auth";

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <ContextProvider>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/platform" element={<Platform />} />
          <Route path="/auth" element={<Auth />} />
        </Routes>
      </ContextProvider>
    </BrowserRouter>
  );
};

export default App;
