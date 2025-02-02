import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { auth, provider, signInWithPopup, signOut } from "../firebase";
import ReCAPTCHA from "react-google-recaptcha";
import logo from "../assets/logo2.png";

const FormUrl = () => {
  const [sourcelUrl, setSourceUrl] = useState("");
  const [resultShortUrl, setResultShortUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);
  const [userUrls, setUserUrls] = useState([]);
  const [userEmail, setUserEmail] = useState("");
  const [captchaToken, setCaptchaToken] = useState(null);
  const [darkMode, setDarkMode] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const recaptchaRef = useRef(null);

  const SITE_KEY = import.meta.env.VITE_RECAPTCHA_SITE_KEY;
  const REQ_SHORT_URL = import.meta.env.VITE_URL_REQ_SHORT_URL;
  const BACKEND_URL = import.meta.env.VITE_BASE_BACKEND_URL;
  const FETCH_URLS_USER = import.meta.env.VITE_FETCH_URLS_USER;

  const handleLogin = async () => {
    try {
      const result = await signInWithPopup(auth, provider);
      setUser(result.user);
      setUserEmail(result.user.email);
    } catch (error) {
      console.error("Login Error:", error);
      setErrorMessage("Login failed. Please try again.");
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setUser(null);
      setUserUrls([]);

      setSourceUrl("");
      setResultShortUrl("");
      setLoading(false);
      setUserEmail("");
      setCaptchaToken(null);
      setDarkMode(false);
      setErrorMessage("");
    } catch (error) {
      console.error("Logout Error:", error);
      setErrorMessage("Logout failed. Please try again.");
    }
  };

  const handleCaptchaChange = (token) => {
    setCaptchaToken(token);
  };

  const shortThisUrl = async () => {
    if (!sourcelUrl) {
      setErrorMessage("Please enter a valid URL.");
      return;
    }

    if (!captchaToken) {
      setErrorMessage("Please complete the CAPTCHA.");
      return;
    }

    setLoading(true);
    setErrorMessage("");

    try {
      const response = await axios.post(REQ_SHORT_URL, {
        source_url: sourcelUrl,
        email: user ? user.email : "null",
        captcha_token: captchaToken,
      });
      setResultShortUrl(`${BACKEND_URL}${response.data.result_short_url}`);
    } catch (error) {
      if (error.response && error.response.status === 422) {
        setErrorMessage(`Invalid URL: ${error.response.data.error}`);
      } else {
        setErrorMessage("An unexpected error occurred. Please try again.");
      }
      setResultShortUrl("");
    } finally {
      setLoading(false);
      setCaptchaToken(null);
      recaptchaRef.current.reset();
      setUserEmail(user.email);
    }
  };

  const fetchUserUrls = async (email) => {
    try {
      const response = await axios.get(`${FETCH_URLS_USER}${btoa(email)}`);
      setUserUrls(response.data.user_urls);
    } catch (error) {
      console.error("Error fetching user URLs:", error);
      setErrorMessage("Failed to fetch user URLs. Please try again later.");
    }
  };

  useEffect(() => {
    if (userEmail) {
      fetchUserUrls(userEmail);
    }
  }, [userEmail]);

  return (
    <div
      className={
        darkMode
          ? "dark bg-gray-900 text-white min-h-screen"
          : "bg-gray-200 text-gray-900 min-h-screen"
      }
    >
      <div className="p-4 flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <img
            src={logo}
            alt="Shortly Logo"
            className={`h-10 ${darkMode ? "" : "invert"}`}
          />
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="px-3 py-1 bg-indigo-500 text-white rounded hover:bg-indigo-600"
          >
            {darkMode ? "🌞" : "🌙"}
          </button>
          {user ? (
            <>
              <img
                src={user.photoURL}
                alt="User"
                className="w-8 h-8 rounded-full"
              />
              <button
                onClick={handleLogout}
                className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
              >
                Logout
              </button>
            </>
          ) : (
            <button
              onClick={handleLogin}
              className="px-3 py-1 bg-indigo-500 text-white rounded hover:bg-indigo-600"
            >
              Sign in
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-col md:flex-row items-start justify-center py-8 md:space-x-6 space-y-6 md:space-y-0 px-4">
        <div
          className={`p-6 rounded-xl shadow-lg w-full max-w-md mx-auto md:mx-4 ${
            darkMode ? "bg-gray-800 text-white" : "bg-white text-gray-900"
          }`}
        >
          <h1 className="text-2xl font-bold mb-4">
            Shortly - Shorten Your URL <br />
            Dont worry, its Free! 😎
          </h1>
          <input
            className={`w-full border p-2 mt-4 rounded ${
              darkMode
                ? "bg-gray-700 border-gray-600 text-white"
                : "bg-white border-gray-300 text-gray-900"
            }`}
            type="text"
            value={sourcelUrl}
            onChange={(e) => setSourceUrl(e.target.value)}
            placeholder="Enter your URL"
          />

          <ReCAPTCHA
            sitekey={SITE_KEY}
            onChange={handleCaptchaChange}
            ref={recaptchaRef}
            className="my-4"
          />

          <button
            className={`w-full bg-indigo-500 text-white px-4 py-2 rounded ${
              loading ? "opacity-50 cursor-not-allowed" : "hover:bg-indigo-600"
            }`}
            onClick={shortThisUrl}
            disabled={loading || !captchaToken}
          >
            {loading ? "Loading..." : "Short this URL! 🚀"}
          </button>

          {errorMessage && (
            <p className="mt-4 text-red-500 font-semibold text-center">
              {errorMessage}
            </p>
          )}

          {resultShortUrl && (
            <div className="mt-4 text-center dark:text-white">
              <p
                className={`font-semibold ${
                  darkMode ? "text-white" : "text-gray-900"
                }`}
              >
                Result:
              </p>
              <a
                href={resultShortUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 hover:underline"
              >
                {resultShortUrl}
              </a>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(resultShortUrl);
                  alert("URL copied to clipboard!");
                }}
                className="mt-2 px-3 py-1 bg-gray-300 text-white rounded hover:bg-grey-600 ml-2"
              >
                📋
              </button>
            </div>
          )}
        </div>

        {userUrls.length > 0 && (
          <div
            className={`w-full max-w-md mx-auto p-4 rounded-xl shadow-md ${
              darkMode ? "bg-gray-800 text-white" : "bg-gray-300 text-gray-900"
            }`}
          >
            <h2 className="text-xl font-semibold mb-4 text-center">
              History ⌛️
            </h2>
            <ul className="space-y-4">
              {userUrls.map((url, index) => (
                <li
                  key={index}
                  className={`p-4 rounded-lg shadow-md flex items-center space-x-4 ${
                    darkMode
                      ? "bg-gray-700 text-white"
                      : "bg-gray-100 text-black"
                  }`}
                >
                  <div className="flex flex-col space-y-1 w-full">
                    <p className="font-semibold break-words whitespace-normal">
                      🔗 {url.original_url}
                    </p>
                    <a
                      href={`${BACKEND_URL}${url.short_url}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      ➡️ {BACKEND_URL}
                      {url.short_url}
                    </a>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <footer className="text-center py-4 text-gray-500 dark:text-gray-400">
        Made with ❤️ by{" "}
        <a
          href="https://github.com/ragil132"
          target="_blank"
          rel="noopener noreferrer"
        >
          Ragillio Aji
        </a>
      </footer>
    </div>
  );
};

export default FormUrl;
