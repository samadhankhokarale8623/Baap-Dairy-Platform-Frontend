import React, { useState } from "react";
import BaapLogo from "../../assets/Images/baapblacklogo.png";
import { useNavigate } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { register } from "../../Api/Auth.jsx";
import { FiEye, FiEyeOff } from "react-icons/fi";

const Register = () => {
  const navigate = useNavigate();

  const [mobileno, setMobileno] = useState("");
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [middleName, setMiddleName] = useState("");
  const [lastName, setLastName] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [mobileError, setMobileError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [firstNameError, setFirstNameError] = useState("");
  const [middleNameError, setMiddleNameError] = useState("");
  const [lastNameError, setLastNameError] = useState("");
  const [passwordError, setPasswordError] = useState("");

  const handleMobileChange = (e) => {
    const value = e.target.value.trimStart();
    if (/^\d*$/.test(value) && value.length <= 10) {
      setMobileno(value);
      if (value === "") {
        setMobileError("");
      } else if (value.length !== 10) {
        setMobileError("Enter exactly 10 digits");
      } else {
        setMobileError("");
      }
    }
  };

  const handleEmailChange = (e) => {
    const value = e.target.value.trimStart();
    setEmail(value);
    
    if (value === "") {
      setEmailError("");
      return;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
      setEmailError("Please enter a valid email address");
    } else {
      setEmailError("");
    }
  };

  const handleFirstNameChange = (e) => {
    const value = e.target.value.trimStart();
    setFirstName(value);
    if (value === "") {
      setFirstNameError("");
    } else if (value.length < 2) {
      setFirstNameError("First name must be at least 2 characters");
    } else {
      setFirstNameError("");
    }
  };

  const handleMiddleNameChange = (e) => {
    const value = e.target.value.trimStart();
    setMiddleName(value);
    // Middle name is optional, so only validate if not empty
    if (value !== "" && value.length < 2) {
      setMiddleNameError("Middle name must be at least 2 characters");
    } else {
      setMiddleNameError("");
    }
  };

  const handleLastNameChange = (e) => {
    const value = e.target.value.trimStart();
    setLastName(value);
    if (value === "") {
      setLastNameError("");
    } else if (value.length < 2) {
      setLastNameError("Last name must be at least 2 characters");
    } else {
      setLastNameError("");
    }
  };

  const handlePasswordChange = (e) => {
    const value = e.target.value.replace(/\s/g, "");
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

  const isValid =
    mobileno.length === 10 &&
    email &&
    firstName &&
    lastName &&
    password.length >= 6 &&
    password.length <= 20 &&
    !mobileError &&
    !emailError &&
    !firstNameError &&
    !middleNameError &&
    !lastNameError &&
    !passwordError;

  const handleRegister = async (e) => {
    e.preventDefault();

    if (isValid) {
      const userData = {
        mobileno: mobileno.trim(),
        email: email.trim(),
        firstName: firstName.trim(),
        middleName: middleName.trim() || "", // Optional field
        lastName: lastName.trim(),
        password: password.trim(),
      };

      try {
        await register(userData);
        toast.success("Registration successful!", { autoClose: 2000 });
        setTimeout(() => navigate("/login"), 2000);
      } catch (error) {
        toast.error(error.response?.data?.error || "Registration failed", {
          autoClose: 3000,
        });
      }
    } else {
      toast.error("Please fill in all required fields correctly.", { 
        autoClose: 3000 
      });
    }
  };

  return (
    <div className="flex flex-wrap min-h-screen w-screen">
      <ToastContainer />
      <div className="flex flex-col flex-1 p-8 bg-white">
        <div className="mb-5">
          <img className="h-[9vh] rounded" src={BaapLogo} alt="baaplogo" />
        </div>
        <div className="flex-1 flex items-center mb-8">
          <p className="text-[25px] text-[#707070] max-w-[400px] leading-[1.9] font-[Georgia,serif]">
            Create your account and join the future with
            <br />
            <strong className="text-[50px] text-black block">
              baap company
            </strong>
          </p>
        </div>
      </div>

      <div className="flex flex-col flex-1 bg-[#3e3e3e] justify-center items-center p-8">
        <form
          className="flex flex-col w-full max-w-[300px] mt-5"
          onSubmit={handleRegister}
        >
          {/* Mobile Number */}
          <div className="mb-3">
            <input
              type="text"
              placeholder="Mobile Number *"
              value={mobileno}
              onChange={handleMobileChange}
              maxLength={10}
              className={`bg-transparent border text-white px-3 py-2 outline-none text-lg rounded-md placeholder:text-gray-400 focus:border-blue-400 w-full ${
                mobileError ? "border-red-500" : "border-[#666]"
              }`}
              required
            />
            {mobileError && (
              <p className="text-red-500 text-sm mt-1">{mobileError}</p>
            )}
          </div>

          {/* Email */}
          <div className="mb-3">
            <input
              type="email"
              placeholder="Email Address *"
              value={email}
              onChange={handleEmailChange}
              className={`bg-transparent border text-white px-3 py-2 outline-none text-lg rounded-md placeholder:text-gray-400 focus:border-blue-400 w-full ${
                emailError ? "border-red-500" : "border-[#666]"
              }`}
              required
            />
            {emailError && (
              <p className="text-red-500 text-sm mt-1">{emailError}</p>
            )}
          </div>

          {/* First Name */}
          <div className="mb-3">
            <input
              type="text"
              placeholder="First Name *"
              value={firstName}
              onChange={handleFirstNameChange}
              minLength={2}
              className={`bg-transparent border text-white px-3 py-2 outline-none text-lg rounded-md placeholder:text-gray-400 focus:border-blue-400 w-full ${
                firstNameError ? "border-red-500" : "border-[#666]"
              }`}
              required
            />
            {firstNameError && (
              <p className="text-red-500 text-sm mt-1">{firstNameError}</p>
            )}
          </div>

          {/* Middle Name */}
          <div className="mb-3">
            <input
              type="text"
              placeholder="Middle Name (Optional)"
              value={middleName}
              onChange={handleMiddleNameChange}
              minLength={2}
              className={`bg-transparent border text-white px-3 py-2 outline-none text-lg rounded-md placeholder:text-gray-400 focus:border-blue-400 w-full ${
                middleNameError ? "border-red-500" : "border-[#666]"
              }`}
            />
            {middleNameError && (
              <p className="text-red-500 text-sm mt-1">{middleNameError}</p>
            )}
          </div>

          {/* Last Name */}
          <div className="mb-3">
            <input
              type="text"
              placeholder="Last Name *"
              value={lastName}
              onChange={handleLastNameChange}
              minLength={2}
              className={`bg-transparent border text-white px-3 py-2 outline-none text-lg rounded-md placeholder:text-gray-400 focus:border-blue-400 w-full ${
                lastNameError ? "border-red-500" : "border-[#666]"
              }`}
              required
            />
            {lastNameError && (
              <p className="text-red-500 text-sm mt-1">{lastNameError}</p>
            )}
          </div>

          {/* Password */}
          <div className="mb-3">
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Password *"
                value={password}
                onChange={handlePasswordChange}
                minLength={6}
                maxLength={20}
                className={`bg-transparent border text-white px-3 py-2 pr-10 outline-none text-lg rounded-md placeholder:text-gray-400 focus:border-blue-400 w-full ${
                  passwordError ? "border-red-500" : "border-[#666]"
                }`}
                required
              />
              <div
                className="absolute top-1/2 right-3 transform -translate-y-1/2 cursor-pointer text-white"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <FiEye size={18} /> : <FiEyeOff size={18} />}
              </div>
            </div>
            {passwordError && (
              <p className="text-red-500 text-sm mt-1">{passwordError}</p>
            )}
          </div>

          {/* Buttons */}
          <div className="flex gap-3 mt-2">
            <button
              type="submit"
              disabled={!isValid}
              className={`bg-[#2f2f2f] text-white border-none px-4 py-2 transition rounded-md w-full ${
                !isValid
                  ? "opacity-50 cursor-not-allowed"
                  : "hover:bg-[#222] cursor-pointer"
              }`}
            >
              Register
            </button>
            <button
              type="button"
              onClick={() => navigate("/login")}
              className="bg-[#2f2f2f] text-white border-none px-4 py-2 rounded-md cursor-pointer transition hover:bg-[#222] w-full"
            >
              Back to Login
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Register;