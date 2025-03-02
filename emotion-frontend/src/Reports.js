import React, { useState, useEffect } from "react";
import { db } from "./firebaseConfig";
import { ref, get } from "firebase/database";
import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from "recharts";

function Reports() {
  const [reports, setReports] = useState([]);
  const [selectedReport, setSelectedReport] = useState(null);

  useEffect(() => {
    const fetchReports = async () => {
      const adminRef = ref(db, "admin");
      const snapshot = await get(adminRef);

      if (snapshot.exists()) {
        const data = snapshot.val();
        const allReports = [];

        Object.keys(data).forEach((empId) => {
          Object.entries(data[empId]).forEach(([reportId, reportData]) => {
            allReports.push({
              empId,
              reportId,
              ...reportData,
            });
          });
        });

        setReports(allReports);
      }
    };

    fetchReports();
  }, []);

  const openModal = (report) => {
    setSelectedReport(report);
  };

  const closeModal = () => {
    setSelectedReport(null);
  };

  return (
    <div style={styles.container}>
      <h2>Employee Reports</h2>
      {reports.length > 0 ? (
        <div style={styles.grid}>
          {reports.map((report) => (
            <div key={report.reportId} style={styles.card} onClick={() => openModal(report)}>
              <h3>{report.employeeName} (ID: {report.empId})</h3>
              <p><strong>Email:</strong> {report.email}</p>
              <p><strong>Task:</strong> {report.taskName}</p>
              <p><strong>Status:</strong> {report.status}</p>
              <p><strong>Assigned Date:</strong> {report.assignedDate}</p>
              <p><strong>Timestamp:</strong> {new Date(report.timestamp).toLocaleString()}</p>
            </div>
          ))}
        </div>
      ) : (
        <p>No reports found.</p>
      )}

      {selectedReport && (
        <div style={styles.modalOverlay} onClick={closeModal}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h3>{selectedReport.employeeName} - Emotion Analysis</h3>
            <p><strong>Task:</strong> {selectedReport.taskName}</p>
            <p><strong>Status:</strong> {selectedReport.status}</p>
            
            {selectedReport.emotionLogs ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={selectedReport.emotionLogs.map(log => ({
                  time: log.time,
                  confidence: parseFloat(log.confidence),
                }))}>
                  <XAxis dataKey="time" />
                  <YAxis domain={[0, 100]} />
                  <Tooltip />
                  <CartesianGrid strokeDasharray="3 3" />
                  <Line type="monotone" dataKey="confidence" stroke="#ff7300" />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <p>No emotion logs available.</p>
            )}

            <button style={styles.closeButton} onClick={closeModal}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: { padding: "20px" },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "20px" },
  card: { padding: "15px", border: "1px solid #ddd", borderRadius: "8px", backgroundColor: "#f9f9f9", cursor: "pointer" },
  modalOverlay: { position: "fixed", top: 0, left: 0, width: "100%", height: "100%", backgroundColor: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "center", alignItems: "center" },
  modal: { backgroundColor: "#fff", padding: "20px", borderRadius: "8px", width: "400px", textAlign: "center" },
  closeButton: { marginTop: "10px", padding: "10px", backgroundColor: "#ff4d4d", color: "#fff", border: "none", borderRadius: "5px", cursor: "pointer" },
};

export default Reports;
