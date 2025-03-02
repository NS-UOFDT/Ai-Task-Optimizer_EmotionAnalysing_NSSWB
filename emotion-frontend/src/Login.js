// src/Login.js
import React, { useState } from "react";
import { auth } from "./firebaseConfig";
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword 
} from "firebase/auth";
import { ref, query, orderByChild, equalTo, get, set } from "firebase/database";
import { db } from "./firebaseConfig";
import { useNavigate } from "react-router-dom";
import bcrypt from "bcryptjs";

// Function to hash the password using bcrypt (one-way hash)
const hashPassword = (pwd) => {
  const salt = bcrypt.genSaltSync(10);
  return bcrypt.hashSync(pwd, salt);
};

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    // Normalize email (trim and lowercase)
    const normalizedEmail = email.trim().toLowerCase();

    // Admin bypass logic: if admin email, sign in directly
    if (normalizedEmail === "adminatemotion@gmail.com") {
      try {
        await signInWithEmailAndPassword(auth, normalizedEmail, password);
        navigate("/dashboard");
      } catch (err) {
        setError(err.message);
      }
      return;
    }

    try {
      // Query the "Employees" node in the Realtime Database to check if the email exists.
      const employeesRef = ref(db, "Employees/");
      const q = query(employeesRef, orderByChild("email"), equalTo(normalizedEmail));
      const snapshot = await get(q);

      if (!snapshot.exists()) {
        // If the email is not found in the employee records, show an error.
        setError("Email not found in employee records");
        return;
      }

      // If employee exists, attempt to sign in using Firebase Authentication
      try {
        await signInWithEmailAndPassword(auth, normalizedEmail, password);
      } catch (error) {
        if (error.code === "auth/user-not-found") {
          // If the user is not found in Firebase Authentication, register them
          await createUserWithEmailAndPassword(auth, normalizedEmail, password);
        } else {
          throw error;
        }
      }

      // Once authentication is successful, update the employee record with the hashed password.
      const employeesData = snapshot.val();
      const employeeKey = Object.keys(employeesData)[0];
      const hashedPassword = hashPassword(password);
      await set(ref(db, "Employees/" + employeeKey + "/password"), hashedPassword);

      // Navigate to dashboard upon successful login/registration
      navigate("/dashboard");
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2>Login</h2>
        <form onSubmit={handleLogin}>
          <input
            type="email"
            placeholder="Email"
            style={styles.input}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Password"
            style={styles.input}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button type="submit" style={styles.button}>Login</button>
        </form>
        {error && <p style={styles.error}>{error}</p>}
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    height: "100vh",
    backgroundColor: "#f0f2f5",
  },
  card: {
    backgroundColor: "#fff",
    padding: "30px",
    borderRadius: "10px",
    boxShadow: "0 4px 10px rgba(0,0,0,0.1)",
    textAlign: "center",
  },
  input: {
    width: "100%",
    padding: "10px",
    margin: "10px 0",
    borderRadius: "5px",
    border: "1px solid #ccc",
    fontSize: "16px",
  },
  button: {
    width: "100%",
    padding: "10px",
    backgroundColor: "#1877f2",
    color: "#fff",
    border: "none",
    borderRadius: "5px",
    fontSize: "16px",
    cursor: "pointer",
  },
  error: {
    color: "red",
    marginTop: "10px",
  },
};

export default Login;
