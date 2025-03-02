import React, { useEffect, useState, useRef } from "react";
import Webcam from "react-webcam";
import { useNavigate, useLocation } from "react-router-dom";
import { auth, db } from "./firebaseConfig";
import { ref, push, get, child,update } from "firebase/database";

function DTask() {
  const [isExpanded, setIsExpanded] = useState(true);
  const [text, setText] = useState("");
  const [emotionLogs, setEmotionLogs] = useState([]);
  const webcamRef = useRef(null);
  const [employee, setEmployee] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  // Extract task details from location state
  const task = location.state?.task || {}; // Ensure task exists
  const taskName = task.taskName || "No Task Name Provided";
  const taskDescription = task.taskDescription || "No Description Available";
  const taskdate = task.assignedDate || "No Date Available";
  const [lastReportTime, setLastReportTime] = useState(null);
  useEffect(() => {
    fetchEmployeeDetails();
  }, []);

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  const fetchEmployeeDetails = async () => {
    const user = auth.currentUser;
    if (!user) return;
    
    const employeesRef = ref(db, "Employees");
    try {
      const snapshot = await get(employeesRef);
      if (snapshot.exists()) {
        snapshot.forEach((childSnapshot) => {
          const empData = childSnapshot.val();
          if (empData.email === user.email) {
            setEmployee({ empId: childSnapshot.key, ...empData });
          }
        });
      }
    } catch (error) {
      console.error("Error fetching employee details:", error);
    }
  };

  useEffect(() => {
    const interval = setInterval(captureAndAnalyze, 5000);
    return () => clearInterval(interval);
  }, []);

  const captureAndAnalyze = async () => {
    if (!webcamRef.current) return;

    const imageSrc = webcamRef.current.getScreenshot();
    if (!imageSrc) {
      console.error("Failed to capture image");
      return;
    }

    const base64Image = imageSrc.split(",")[1];

    try {
      const response = await fetch("http://localhost:5000/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: base64Image }),
      });

      const data = await response.json();

      if (response.ok && data.dominant_emotion) {
        setEmotionLogs((prevLogs) => [
          ...prevLogs,
          {
            time: new Date().toLocaleTimeString(),
            emotion: data.dominant_emotion,
            confidence: data.emotion_confidence?.toFixed(2) ?? "N/A",
          },
        ]);
      } else {
        console.error("Emotion detection failed:", data.error || "Unknown error");
      }
    } catch (error) {
      console.error("Error fetching analysis:", error);
    }
  };

    useEffect(() => {
        if (employee && emotionLogs.length > 0) {
            console.log("Checking emotion threshold...");
            checkEmotionThreshold();
        }
    }, [emotionLogs, employee]);
    
    const checkEmotionThreshold = async () => {
        if (!employee) {
            console.warn("Employee details not found, skipping threshold check");
            return;
        }
    
        const criticalEmotions = ["sad", "angry", "fear"];
        const lastFourLogs = emotionLogs.slice(-4); // Only consider the last 4 logs
    
        console.log("Last 4 Logs for check:", lastFourLogs);
    
        const filteredLogs = lastFourLogs.filter(
            (log) => criticalEmotions.includes(log.emotion) && log.confidence >= 50
        );
    
        console.log("Filtered logs:", filteredLogs);
    
        if (filteredLogs.length >= 4) {
            // Prevent multiple reports by checking last report time
            const currentTime = new Date().getTime();
            if (lastReportTime && currentTime - lastReportTime < 60000) { // 1 minute cooldown
                console.warn("Report already sent recently, skipping...");
                return;
            }
    
            const alreadyReported = await checkIfAlreadyReported();
            if (alreadyReported) {
                console.warn("Report already exists in Firebase, skipping...");
                return;
            }
    
            console.log("Threshold reached, pushing to Firebase...");
            setLastReportTime(currentTime); // Update last sent time
            pushToFirebase(filteredLogs);
        }
    };
    
    const checkIfAlreadyReported = async () => {
        if (!employee || !employee.empId) return false;
    
        const empRef = ref(db, `admin/${employee.empId}`);
        try {
            const snapshot = await get(empRef);
            if (snapshot.exists()) {
                const reports = Object.values(snapshot.val());
                const lastReport = reports[reports.length - 1];
    
                if (lastReport && lastReport.timestamp) {
                    const lastReportTime = new Date(lastReport.timestamp).getTime();
                    const currentTime = new Date().getTime();
    
                    // If last report was sent within the last 5 minutes, prevent duplicate
                    return currentTime - lastReportTime < 5 * 60 * 1000;
                }
            }
        } catch (error) {
            console.error("Error checking last report:", error);
        }
        return false;
    };
    

    const pushToFirebase = async (logs) => {
        if (!employee || !employee.empId) {
            console.error("Employee ID missing, cannot push to Firebase.");
            return;
        }
    
        const empRef = ref(db, `admin/${employee.empId}`);
    
        try {
            // Get the latest reports
            const snapshot = await get(empRef);
            let lastReportKey = null;
            let lastReport = null;
            let reportsArray = [];
    
            if (snapshot.exists()) {
                snapshot.forEach((childSnapshot) => {
                    reportsArray.push({ key: childSnapshot.key, ...childSnapshot.val() });
                });
    
                // Sort reports by timestamp (latest first)
                reportsArray.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
                // Get the latest report
                if (reportsArray.length > 0) {
                    lastReportKey = reportsArray[0].key;
                    lastReport = reportsArray[0];
                }
            }
    
            const currentDate = new Date().toISOString();
    
            const payload = {
                employeeName: employee.name || "Unknown",
                email: employee.email || "Unknown",
                taskName: taskName || "Unknown Task",
                taskDescription: taskDescription || "No Description",
                assignedDate: taskdate || "Unknown Date",
                emotionLogs: logs,
                status: `Employee is feeling ${logs[logs.length - 1]?.emotion} with confidence ${logs[logs.length - 1]?.confidence}%`,
                timestamp: currentDate,
            };
    
            // Check if the last report is within the last 15 minutes
            if (lastReport && (new Date(currentDate) - new Date(lastReport.timestamp)) / 60000 < 15) {
                console.log("Updating existing report in Firebase...");
    
                // Update the last report instead of adding a new one
                const updateRef = ref(db, `admin/${employee.empId}/${lastReportKey}`);
                await update(updateRef, payload); // Use update instead of set
                console.log("Report successfully updated.");
            } else {
                console.log("Pushing new data to Firebase...");
                await push(empRef, payload);
                console.log("New data successfully pushed to Firebase.");
            }
        } catch (error) {
            console.error("Error handling Firebase update:", error);
        }
    };
    

  

  return (
    <div style={{ padding: "20px", fontFamily: "Arial, sans-serif" }}>
      <div
        style={{
          background: "#f8f9fa",
          padding: "10px 20px",
          borderRadius: "5px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          cursor: "pointer",
        }}
        onClick={toggleExpand}
      >
        <h3>{taskName}</h3>
        <button>{isExpanded ? "▼" : "▲"}</button>
      </div>
      {isExpanded && <p style={{ marginTop: "10px" }}>{taskDescription}</p>}

      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        style={{
          width: "100%",
          height: "400px",
          marginTop: "10px",
          fontSize: "16px",
          lineHeight: "1.5",
          border: "1px solid #ccc",
          padding: "10px",
          fontFamily: "monospace",
        }}
        placeholder="Write here..."
      />

      <button
        style={{ marginTop: "10px", padding: "10px 20px", cursor: "pointer" }}
        onClick={() => console.log("Submitted: ", text)}
      >
        Submit
      </button>

      <button
        style={{ marginLeft: "10px", padding: "10px 20px", cursor: "pointer" }}
        onClick={() => console.log("Emotion Logs:", emotionLogs)}
      >
        Show Emotion Logs
      </button>

      <Webcam
        ref={webcamRef}
        audio={false}
        screenshotFormat="image/jpeg"
        width={320}
        height={240}
      />

      <div style={{ marginTop: "20px" }}>
        <h4>Emotion Logs:</h4>
        <ul>
          {emotionLogs.map((log, index) => (
            <li key={index}>
              [{log.time}] {log.emotion} ({log.confidence}%)
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default DTask;
