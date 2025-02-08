import { React, useEffect } from "react";
import FormUrl from "./components/FormUrl";
import "./App.css";

function App() {
  const REAL_BACKEND_URL = import.meta.env.VITE_BASE_REAL_BACKEND_URL;
  const path = window.location.pathname.replace("/", "");

  useEffect(() => {
    if (path) {
      window.location.href = REAL_BACKEND_URL + path;
    }
  }, [path, REAL_BACKEND_URL]);

  return path ? <div>Redirecting...</div> : <FormUrl />;
}

export default App;
