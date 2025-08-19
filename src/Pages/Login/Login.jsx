import React, { useState } from "react";
import BaapLogo from "../../assets/Images/baapblacklogo.png";
import { useNavigate } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { login } from "../../Api/Auth";
import { FaUser, FaLock } from "react-icons/fa";
import { FiEye, FiEyeOff } from "react-icons/fi";

const Login = () => {
  const navigate = useNavigate();
  const [loginIdentifier, setLoginIdentifier] = useState(""); // Can be mobile or email
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [identifierError, setIdentifierError] = useState("");
  const [passwordError, setPasswordError] = useState("");

  const handleIdentifierChange = (e) => {
    let value = e.target.value.trimStart();
    setLoginIdentifier(value);

    if (value === "") {
      setIdentifierError("");
      return;
    }

    // Check if it's a mobile number (only digits)
    const isOnlyDigits = /^\d+$/.test(value);

    if (isOnlyDigits) {
      // Mobile number validation
      if (value.length > 10) {
        setLoginIdentifier(value.slice(0, 10)); // Limit to 10 digits
        return;
      }
      if (value.length !== 10) {
        setIdentifierError("Please enter exactly 10 digits for mobile number.");
      } else {
        setIdentifierError("");
      }
    } else {
      // Email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value)) {
        setIdentifierError("Please enter a valid email address.");
      } else {
        setIdentifierError("");
      }
    }
  };

  const handlePasswordChange = (e) => {
    const value = e.target.value.replace(/\s/g, ""); // remove all spaces
    setPassword(value);
    if (value === "") {
      setPasswordError("");
      return;
    }
    const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@#$%^&+=!]).{6,}$/;
    if (!regex.test(value)) {
      setPasswordError(
        "Password must contain uppercase, lowercase, number, special character"
      );
    } else {
      setPasswordError("");
    }
  };

  // Validation logic
  const isValidIdentifier = () => {
    if (loginIdentifier === "") return false;

    const isOnlyDigits = /^\d+$/.test(loginIdentifier);
    if (isOnlyDigits) {
      return loginIdentifier.length === 10;
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(loginIdentifier);
    }
  };

  const isValid =
    isValidIdentifier() &&
    identifierError === "" &&
    passwordError === "" &&
    password.trim().length >= 6 &&
    password.trim().length <= 20;

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      // Determine if login identifier is mobile or email
      const isOnlyDigits = /^\d+$/.test(loginIdentifier.trim());

      // Backend expects both fields, one will be null
      const loginData = {
        mobileno: isOnlyDigits ? loginIdentifier.trim() : null,
        email: !isOnlyDigits ? loginIdentifier.trim() : null,
        password: password.trim(),
      };

      const result = await login(loginData);
      toast.success("Login successful!", { autoClose: 2000 });
      localStorage.setItem("token", result.token);
      localStorage.setItem("userInfo", JSON.stringify(result.user)); // Save user info
      localStorage.setItem("firstname", result.user.firstname);
      localStorage.setItem("lastname", result.user.lastname);
      setTimeout(() => navigate("/home"), 2000);
    } catch (err) {
      toast.error(
        err?.response?.data?.error ||
          err?.response?.data?.message ||
          "Login failed",
        {
          autoClose: 3000,
        }
      );
    }
  };

  return (
    <div className="flex flex-wrap min-h-screen w-screen">
      <ToastContainer />

      {/* Left Panel */}
      <div className="flex flex-col flex-1 p-8 bg-white">
        <div className="mb-5">
          <img className="h-[9vh] rounded" src={BaapLogo} alt="baaplogo" />
        </div>
        <div className="flex-1 flex items-center mb-8">
          <p className="text-[25px] text-[#707070] max-w-[400px] leading-[1.9] font-[Georgia,serif]">
            Get ready for the future One smart platform for dairy management and
            growth proudly powered by
            <br />
            <strong className="text-[50px] text-black block">
              baap company
            </strong>
          </p>
        </div>
      </div>

      {/* Right Panel */}
      <div className="flex flex-col flex-1 bg-[#3e3e3e] justify-center items-center p-8">
        <form
          className="flex flex-col w-full max-w-[300px] mt-20"
          onSubmit={handleLogin}
        >
          {/* Mobile/Email */}
          <div
            className={`flex items-center border ${
              identifierError
                ? "border-red-500"
                : "border-[#666] focus-within:border-blue-400"
            } text-white rounded-md px-2 mb-2`}
          >
            <FaUser className="text-white mr-2" />
            <input
              type="text"
              placeholder="Mobile Number or Email"
              value={loginIdentifier}
              onChange={handleIdentifierChange}
              className="bg-transparent text-white py-2 outline-none w-full placeholder:text-gray-400"
            />
          </div>
          {identifierError && (
            <p className="text-red-500 text-sm mt-1 mb-4">{identifierError}</p>
          )}

          {/* Password */}
          <div
            className={`flex items-center border ${
              passwordError
                ? "border-red-500"
                : "border-[#666] focus-within:border-blue-400 "
            } text-white rounded-md px-2 mb-1 mt-6 relative`}
          >
            <FaLock className="text-white mr-2" />
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              value={password}
              onChange={handlePasswordChange}
              minLength={6}
              maxLength={20}
              className="bg-transparent text-white py-2 pr-10 outline-none w-full placeholder:text-gray-400"
            />
            <div
              className="absolute right-2 cursor-pointer"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <FiEye size={18} /> : <FiEyeOff size={18} />}
            </div>
          </div>
          {passwordError && (
            <p className="text-red-500 text-sm mt-1 mb-4">{passwordError}</p>
          )}

          {/* Buttons */}
          <div className="flex gap-3 mt-4">
            <button
              type="submit"
              disabled={!isValid}
              className={`bg-[#2f2f2f] text-white border-none px-4 py-2 transition ${
                !isValid
                  ? "opacity-50 cursor-not-allowed"
                  : "cursor-pointer hover:bg-[#222]"
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => navigate("/register")}
              className="bg-[#2f2f2f] text-white border-none px-4 py-2 cursor-pointer transition hover:bg-[#222]"
            >
              Register
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;
