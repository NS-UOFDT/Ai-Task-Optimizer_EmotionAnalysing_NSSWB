// src/TasksPage.js
import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { getDatabase, ref, get, query, orderByChild, equalTo, push } from 'firebase/database';
import { getAuth } from 'firebase/auth';
import { db } from './firebaseConfig'; // Ensure your Firebase config is set up for Firebase v9

function TasksPage() {
  const [tasks, setTasks] = useState([]);
  const [error, setError] = useState("");
  const [selectedTaskId, setSelectedTaskId] = useState(null);
  const [employeeName, setEmployeeName] = useState("");
  const [employeeKey, setEmployeeKey] = useState("");
  const [pendingTaskIds, setPendingTaskIds] = useState([]); // global task IDs already in pending tasks

  const location = useLocation();
  const navigate = useNavigate();
  const { emotion } = location.state || {}; // The calculated emotion string

  // -------------------------
  // 1. Get the current user and employee record.
  //    We query Employees by email; when found, we store employeeName and employeeKey.
  useEffect(() => {
    const authInstance = getAuth();
    const unsubscribe = authInstance.onAuthStateChanged((currentUser) => {
      if (currentUser) {
        const normalizedEmail = currentUser.email.trim().toLowerCase();
        // For non-admin employees, query Employees by email.
        if (normalizedEmail !== "adminatemotion@gmail.com") {
          const employeesRef = ref(db, "Employees");
          const q = query(employeesRef, orderByChild("email"), equalTo(normalizedEmail));
          get(q)
            .then((snapshot) => {
              if (snapshot.exists()) {
                const data = snapshot.val();
                const key = Object.keys(data)[0];
                setEmployeeKey(key);
                setEmployeeName(data[key].name);
              }
            })
            .catch((err) => console.error("Error fetching employee record:", err));
        }
      }
    });
    return () => unsubscribe();
  }, []);

  // -------------------------
  // 2. Fetch the current employee's pending tasks (if any) to get their global task IDs.
  useEffect(() => {
    if (!employeeKey) return;
    const dbRef = ref(getDatabase(), `Employees/${employeeKey}/pendingTasks`);
    get(dbRef)
      .then((snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.val();
          // We assume that when tasks were pushed, we saved the original global task ID as globalTaskId.
          const ids = Object.values(data).map((task) => task.globalTaskId);
          setPendingTaskIds(ids);
        } else {
          setPendingTaskIds([]);
        }
      })
      .catch((err) => console.error("Error fetching employee pending tasks:", err));
  }, [employeeKey]);

  // -------------------------
  // 3. Fetch tasks from global tasks node based on the calculated emotion.
  //    Then filter out tasks whose IDs are already in pendingTaskIds.
  const fetchTasksForEmotion = async (emotionKey) => {
    try {
      const dbRef = ref(getDatabase(), `tasks/${emotionKey}`);
      const snapshot = await get(dbRef);
      console.log("Fetching tasks for emotion:", emotionKey);
      if (snapshot.exists()) {
        const data = snapshot.val();
        // Create unique IDs by prefixing the emotion key to each task key.
        const tasksArr = Object.entries(data).map(([key, value]) => ({
          id: `${emotionKey}-${key}`,
          ...value
        }));
        console.log("Data fetched for", emotionKey, ":", tasksArr);
        return tasksArr;
      } else {
        console.log("No tasks found for emotion:", emotionKey);
        return [];
      }
    } catch (err) {
      console.error("Failed to fetch tasks for emotion", emotionKey, ":", err);
      return [];
    }
  };

  useEffect(() => {
    if (!emotion) return;
    const fetchAllTasks = async () => {
      // If the emotion string contains an underscore (e.g. "happy_joy"),
      // split it into an array of emotions.
      const emotionsToFetch = emotion.includes("_") ? emotion.split("_") : [emotion];
      let combinedTasks = [];
      for (const emo of emotionsToFetch) {
        const tasksForEmotion = await fetchTasksForEmotion(emo);
        combinedTasks = combinedTasks.concat(tasksForEmotion);
      }
      // Fallback: if no tasks were found, try "happy"
      if (combinedTasks.length === 0) {
        const fallbackTasks = await fetchTasksForEmotion("happy");
        combinedTasks = fallbackTasks;
      }
      // Filter out tasks that are already in pending tasks.
      const filteredTasks = combinedTasks.filter(task => !pendingTaskIds.includes(task.id));
      if (filteredTasks.length === 0) {
        setError("No tasks available for this emotion or the fallback emotion.");
      } else {
        setTasks(filteredTasks);
      }
    };
    fetchAllTasks();
  }, [emotion, pendingTaskIds]);

  // -------------------------
  // Styles for the task cards.
  const cardStyle = {
    border: "1px solid #ccc",
    borderRadius: "8px",
    padding: "16px",
    marginBottom: "16px",
    cursor: "pointer",
    position: "relative" // for the overlay
  };

  // Style for the selected overlay.
  const selectedOverlayStyle = {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(255, 165, 0, 0.3)", // Orange with 30% opacity
    borderRadius: "8px"
  };

  // -------------------------
  // 4. Handler for the "Next" button click.
  //    Uploads the selected task (with current timestamp and its global task ID)
  //    to the employee's pendingTasks, then redirects to the Dashboard.
  const handleNextButton = async () => {
    if (!selectedTaskId) {
      alert("Please select a task before proceeding.");
      return;
    }
    // Find the selected task from the tasks array.
    const selectedTask = tasks.find((t) => t.id === selectedTaskId);
    if (!selectedTask) {
      alert("Selected task not found.");
      return;
    }

    // Get the current user from Firebase Authentication.
    const authInstance = getAuth();
    const user = authInstance.currentUser;
    if (!user || !user.email) {
      alert("User not authenticated.");
      return;
    }
    const userEmail = user.email;

    try {
      const database = getDatabase();
      // Query the Employees node for the employee with the matching email.
      const employeesRef = ref(database, 'Employees');
      const employeeQuery = query(employeesRef, orderByChild('email'), equalTo(userEmail));
      const snapshot = await get(employeeQuery);

      if (snapshot.exists()) {
        const employeesData = snapshot.val();
        const employeeKey = Object.keys(employeesData)[0];

        // Prepare the task details with the current timestamp.
        const timestamp = new Date().toISOString();
        // Add the original global task id as globalTaskId
        const taskToUpload = {
          ...selectedTask,
          globalTaskId: selectedTask.id,
          timestamp
        };

        // Push the task under the employee's pendingTasks.
        const pendingTasksRef = ref(database, `Employees/${employeeKey}/pendingTasks`);
        await push(pendingTasksRef, taskToUpload);
        alert("Task added to your pending tasks successfully!");
        // After showing the alert, redirect to the dashboard.
        navigate("/dashboard");
      } else {
        alert("No matching employee found.");
      }
    } catch (err) {
      console.error("Error uploading selected task:", err);
      alert("Error uploading selected task.");
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      <h2>Tasks for Emotion: {emotion}</h2>
      {error && <p style={{ color: "red" }}>{error}</p>}
      <div style={{ maxWidth: "600px", margin: "auto" }}>
        {tasks.length === 0 ? (
          <p>No tasks available for this emotion.</p>
        ) : (
          tasks.map((task) => (
            <div
              key={task.id}
              style={cardStyle}
              onClick={() => setSelectedTaskId(task.id)}
            >
              {selectedTaskId === task.id && <div style={selectedOverlayStyle}></div>}
              <h3 style={{ margin: "0 0 8px 0" }}>{task.taskName}</h3>
              <p><strong>Description:</strong> {task.taskDescription}</p>
              <p><strong>Emotion:</strong> {task.relatedEmotion}</p>
              <p><strong>Severity:</strong> {task.severity}</p>
            </div>
          ))
        )}
      </div>
      {tasks.length > 0 && (
        <div style={{ textAlign: "center", marginTop: "20px" }}>
          <button
            onClick={handleNextButton}
            style={{ padding: "10px 20px", fontSize: "16px", cursor: "pointer" }}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}

export default TasksPage;
