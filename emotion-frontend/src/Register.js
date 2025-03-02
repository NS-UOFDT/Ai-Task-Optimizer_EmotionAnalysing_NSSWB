// src/Register.js
import React, { useState } from "react";
import { ref, push } from "firebase/database";
import { db } from "./firebaseConfig";  // Ensure the path is correct

function Register() {
  const [name, setName] = useState("");
  const [empId, setEmpId] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");

    if (name.trim() === "" || empId.trim() === "" || email.trim() === "") {
      setMessage("Please fill in all fields");
      return;
    }

    // Create an employee object
    const employeeData = {
      name: name.trim(),
      empId: empId.trim(),
      email: email.trim(),
    };

    try {
      // Create a reference to the "Employees" node in the database
      const employeesRef = ref(db, "Employees/");
      // Push the new employee data into the Employees node
      await push(employeesRef, employeeData);
      setMessage("Employee added successfully!");
      // Clear the form
      setName("");
      setEmpId("");
      setEmail("");
    } catch (error) {
      setMessage("Error adding employee: " + error.message);
    }
  };

  return (
    <div style={styles.container}>
      <h3>Register New Employee</h3>
      <form onSubmit={handleSubmit} style={styles.form}>
        <input
          type="text"
          placeholder="Employee Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          style={styles.input}
          required
        />
        <input
          type="text"
          placeholder="Employee ID"
          value={empId}
          onChange={(e) => setEmpId(e.target.value)}
          style={styles.input}
          required
        />
        <input
          type="email"
          placeholder="Employee Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={styles.input}
          required
        />
        <button type="submit" style={styles.button}>Submit</button>
      </form>
      {message && <p style={styles.message}>{message}</p>}
    </div>
  );
}

const styles = {
  container: {
    padding: "20px",
    maxWidth: "400px",
    margin: "0 auto",
    textAlign: "center",
    backgroundColor: "#fff",
    borderRadius: "10px",
    boxShadow: "0 4px 10px rgba(0,0,0,0.1)"
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "10px"
  },
  input: {
    padding: "10px",
    fontSize: "16px",
    border: "1px solid #ccc",
    borderRadius: "5px"
  },
  button: {
    padding: "10px",
    fontSize: "16px",
    backgroundColor: "#1877f2",
    color: "#fff",
    border: "none",
    borderRadius: "5px",
    cursor: "pointer"
  },
  message: {
    marginTop: "15px",
    fontSize: "14px",
    color: "green"
  }
};

export default Register;
