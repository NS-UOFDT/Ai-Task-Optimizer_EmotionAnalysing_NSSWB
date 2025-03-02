// src/Dashboard.js
import React, { useState, useEffect } from "react";
import { auth, db } from "./firebaseConfig";
import { onAuthStateChanged } from "firebase/auth";
import { ref, query, orderByChild, equalTo, get } from "firebase/database";
import { Link, Routes, Route, useNavigate } from "react-router-dom";
import Register from "./Register";
import Reports from "./Reports";

function Dashboard() {
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [employeeName, setEmployeeName] = useState("");
  
  const [pendingTasks, setPendingTasks] = useState([]);
  const [finishedTasks, setFinishedTasks] = useState([]);
  const navigate = useNavigate();

  
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        const normalizedEmail = currentUser.email.trim().toLowerCase();
        if (normalizedEmail === "adminatemotion@gmail.com") {
          setIsAdmin(true);
        } else {
          setIsAdmin(false);
          // Query the Employees node by email.
          const employeesRef = ref(db, "Employees");
          const q = query(employeesRef, orderByChild("email"), equalTo(normalizedEmail));
          get(q)
            .then((snapshot) => {
              if (snapshot.exists()) {
                const data = snapshot.val();
                // Assuming one record per email; we take the first matching record.
                const key = Object.keys(data)[0];
                // Set the employeeName from the found record.
                setEmployeeName(data[key].name);
              }
            })
            .catch((err) => console.error("Error fetching employee record:", err));
        }
      }
    });
    return () => unsubscribe();
  }, []);

  // Once employeeName is available, find the matching employee record by name
  // among all children under "Employees", and then fetch pending and finished tasks.
  useEffect(() => {
    if (!isAdmin && employeeName) {
      const employeesRef = ref(db, "Employees");
      get(employeesRef)
        .then((snapshot) => {
          if (snapshot.exists()) {
            const data = snapshot.val();
            let foundKey = "";
            // Loop over every child under Employees to find a record where the name matches.
            for (const key in data) {
              if (data[key].name === employeeName) {
                foundKey = key;
                break;
              }
            }
            if (foundKey) {
              // Fetch pending tasks from Employees/{foundKey}/pendingTasks
              const pendingRef = ref(db, `Employees/${foundKey}/pendingTasks`);
              get(pendingRef)
                .then((snapshot) => {
                  if (snapshot.exists()) {
                    const tasksData = snapshot.val();
                    const tasksArray = Object.entries(tasksData).map(([key, value]) => ({
                      id: key,
                      ...value,
                    }));
                    setPendingTasks(tasksArray);
                  } else {
                    setPendingTasks([]);
                  }
                })
                .catch((err) => console.error("Error fetching pending tasks:", err));

              // Fetch finished tasks from Employees/{foundKey}/finishedTasks
              const finishedRef = ref(db, `Employees/${foundKey}/finishedTasks`);
              get(finishedRef)
                .then((snapshot) => {
                  if (snapshot.exists()) {
                    const tasksData = snapshot.val();
                    const tasksArray = Object.entries(tasksData).map(([key, value]) => ({
                      id: key,
                      ...value,
                    }));
                    setFinishedTasks(tasksArray);
                  } else {
                    setFinishedTasks([]);
                  }
                })
                .catch((err) => console.error("Error fetching finished tasks:", err));
            } else {
              // If no matching employee is found.
              setPendingTasks([]);
              setFinishedTasks([]);
              console.error("No employee record found for employeeName:", employeeName);
            }
          }
        })
        .catch((err) => console.error("Error fetching Employees:", err));
    }
  }, [employeeName, isAdmin]);

  // Navigation Bar component.
  const NavigationBar = () => (
    <div style={styles.navbar}>
      <Link style={styles.navLink} to="/dashboard">
        Home
      </Link>
      {isAdmin && (
        <>
        <Link style={styles.navLink} to="/dashboard/register">
          Register
        </Link>
        <Link style={styles.navLink} to="/dashboard/reports">
        Reports
       </Link>
        </>
      )}
       
    </div>
  );

  // Home component for dashboard content.
  const Home = () => {
    const navigateLocal = useNavigate();
    return (
      <div>
        <p>This is your home dashboard. Here you'll see your tasks and details.</p>
        {!isAdmin && (
          <>
            <div style={styles.tasksContainer}>
              <div style={styles.taskBox}>
                <h3>Pending Tasks</h3>
                {pendingTasks.length > 0 ? (
                  <ul>
                    {pendingTasks.map((task, index) => (
                      <li key={index}  style={styles.pendingTask} onClick={() =>
                        navigateLocal("/dotask", { state: { task, taskType: "pending" } })
                      }>
                        {task.taskName ? task.taskName : task}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p>No pending tasks.</p>
                )}
              </div>
              <div style={styles.taskBox}>
                <h3>Finished Tasks</h3>
                {finishedTasks.length > 0 ? (
                  <ul>
                    {finishedTasks.map((task, index) => (
                      <li key={index} style={styles.finishedTask}>
                        {task.taskName ? task.taskName : task}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p>No finished tasks.</p>
                )}
              </div>
            </div>
            <div style={styles.startDayContainer}>
              <button
                style={styles.startDayButton}
                onClick={() => navigateLocal("/emotion")}
              >
                Start Your Day
              </button>
            </div>
          </>
        )}
      </div>
    );
  };

  return (
    <div style={styles.container}>
      <NavigationBar />
      <div style={styles.content}>
        <h2>
          {isAdmin
            ? "Welcome ADMIN!"
            : `Welcome, ${employeeName || user?.email || "User"}`}
        </h2>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/register" element={isAdmin ? <Register /> : <Home />} />
          <Route path="/reports" element={isAdmin ? <Reports /> : <Home />} />
        </Routes>
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: "flex",
    flexDirection: "row",
    minHeight: "100vh",
  },
  navbar: {
    width: "200px",
    backgroundColor: "#f0f0f0",
    padding: "20px",
    boxSizing: "border-box",
  },
  navLink: {
    display: "block",
    marginBottom: "15px",
    textDecoration: "none",
    color: "#333",
    fontWeight: "bold",
  },
  pendingTask: {
    backgroundColor: "rgba(255, 255, 0, 0.17)",
    padding: "10px",
    borderRadius: "5px",
    margin: "5px 0",
    boxShadow: "0 2px 5px rgba(0,0,0,0.1)"
  },
  finishedTask: {
    backgroundColor: "rgba(0, 128, 0, 0.3)",
    padding: "10px",
    borderRadius: "5px",
    margin: "5px 0",
    boxShadow: "0 2px 5px rgba(0,0,0,0.1)"
  },
  content: {
    flex: 1,
    padding: "20px",
  },
  tasksContainer: {
    display: "flex",
    gap: "20px",
    marginTop: "20px",
  },
  taskBox: {
    flex: 1,
    padding: "20px",
    border: "1px solid #ccc",
    borderRadius: "5px",
    backgroundColor: "#fff",
    boxShadow: "0 2px 5px rgba(0,0,0,0.1)",
  },
  startDayContainer: {
    marginTop: "20px",
    display: "flex",
    justifyContent: "flex-end",
  },
  startDayButton: {
    padding: "10px 20px",
    fontSize: "16px",
    backgroundColor: "#28a745",
    color: "#fff",
    border: "none",
    borderRadius: "5px",
    cursor: "pointer",
  },
};

export default Dashboard;
