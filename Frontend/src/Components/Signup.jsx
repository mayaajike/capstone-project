import React, { useState, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import { UserContext } from "../Context/UserContext";
import PasswordChecklist from "react-password-checklist";
import "../CSS/Signup.css";

export default function Signup() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordAgain, setPasswordAgain] = useState("");
  const { updateUser } = useContext(UserContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`http://localhost:4700/users/signup`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          firstName,
          lastName,
          username,
          email,
          password,
          passwordAgain,
        }),
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();
        const loggedInUser = data.user;
        localStorage.setItem("accessToken", data.user.accessToken);
        localStorage.setItem("refreshToken", data.user.refreshToken);
        localStorage.setItem("user", JSON.stringify(data.user));

        setFirstName("");
        setLastName("");
        setUsername("");
        setEmail("");
        setPassword("");
        setPasswordAgain("");

        updateUser(loggedInUser);
        navigate("/");
      } else {
        alert("Signup failed!");
      }
    } catch (error) {
      alert("Signup failed! " + error);
    }
  };

  return (
    <div className="signup-container">
      <form className="signup-form" onSubmit={handleSubmit}>
        <h2>Sign Up</h2>
        <div className="form-group">
          <label htmlFor="firstName">First Name:</label>
          <input
            type="text"
            id="firstName"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="lastName">Last Name:</label>
          <input
            type="text"
            id="lastName"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="username">Username:</label>
          <input
            type="text"
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="email">Email:</label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="password">Password:</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="passwordAgain">Password Again:</label>
          <input
            type="password"
            id="passwordAgain"
            value={passwordAgain}
            onChange={(e) => setPasswordAgain(e.target.value)}
            required
          />
        </div>
        <div className="password-check">
          <PasswordChecklist
            rules={[
              "minLength",
              "specialChar",
              "number",
              "capital",
              "match",
              "notEmpty",
            ]}
            minLength={8}
            value={password}
            valueAgain={passwordAgain}
            onChange={(isValid) => {}}
            messages={{
              minLength: "Password should have 8 characters minimum",
              specialChar: "Password must contain a special character",
              number: "Password must contain a number",
              capital: "Password must contain at least one capital letter",
              match: "Passwords must match",
              notEmpty: "Password cannot be empty",
            }}
          />
        </div>
        <button type="submit">Sign Up</button>
        <p>
          Already have an account? <Link to="/login">Login</Link>
        </p>
      </form>
    </div>
  );
}
