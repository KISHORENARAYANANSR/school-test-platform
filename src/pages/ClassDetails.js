import React, { useEffect, useState } from "react";
import { db } from "../firebase";
import { collection, doc, getDoc, addDoc, serverTimestamp } from "firebase/firestore";
import ExcelJS from "exceljs";
import { ArrowLeft, FileText, CheckCircle, XCircle, Upload, Users } from "lucide-react";
import "../styles/ClassDetails.css";

const ClassDetails = () => {
  const [classData, setClassData] = useState(null);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showPopup, setShowPopup] = useState(false);

  const [testName, setTestName] = useState("");
  const [testDuration, setTestDuration] = useState(30);
  const [negativeMarking, setNegativeMarking] = useState(false);
  const [negativeMarks, setNegativeMarks] = useState(0.25);

  const [selectedStudents, setSelectedStudents] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [excelFile, setExcelFile] = useState(null);
  const [uploadError, setUploadError] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    const fetchClassData = async () => {
      try {
        const classId = window.location.pathname.split("/").pop();
        const classRef = doc(db, "classes", classId);
        const classSnap = await getDoc(classRef);

        if (classSnap.exists()) {
          const data = classSnap.data();
          setClassData({ id: classSnap.id, ...data });

          if (data.students && data.students.length > 0) {
            const studentPromises = data.students.map(async (studentId) => {
              const studentRef = doc(db, "students", studentId);
              const studentSnap = await getDoc(studentRef);
              return studentSnap.exists()
                ? { id: studentSnap.id, ...studentSnap.data() }
                : null;
            });
            const studentList = await Promise.all(studentPromises);
            setStudents(studentList.filter((s) => s !== null));
          }
        }
        setLoading(false);
      } catch (err) {
        console.error("Error fetching class data:", err);
        setLoading(false);
      }
    };

    fetchClassData();
  }, []);

  const compressBase64Image = (base64Data, maxWidth = 600, quality = 0.6) => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        const compressedBase64 = canvas.toDataURL('image/jpeg', quality);
        resolve(compressedBase64);
      };
      img.onerror = () => {
        console.error("Failed to load image for compression");
        resolve(base64Data);
      };
      img.src = base64Data;
    });
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setExcelFile(file);
    setUploadError("");
    setQuestions([]);
    setIsProcessing(true);

    try {
      const workbook = new ExcelJS.Workbook();
      const arrayBuffer = await file.arrayBuffer();
      await workbook.xlsx.load(arrayBuffer);

      const sheet = workbook.worksheets[0];

      console.log("📊 Sheet info:", {
        name: sheet.name,
        rowCount: sheet.rowCount,
        columnCount: sheet.columnCount
      });

      // Build a map of cells that contain images (marked by #VALUE! error)
      const imageCells = [];
      sheet.eachRow((row, rowIndex) => {
        row.eachCell((cell, colIndex) => {
          if (cell.model && cell.model.value && typeof cell.model.value === 'object') {
            if (cell.model.value.error === '#VALUE!') {
              imageCells.push({
                rowIndex,
                colIndex,
                key: `${rowIndex - 1}:${colIndex - 1}`
              });
              console.log(`🔍 Found #VALUE! error at cell [${rowIndex}, ${colIndex}] - likely an image`);
            }
          }
        });
      });

      console.log(`📸 Found ${imageCells.length} cells with potential images`);
      console.log(`📸 Total media items in workbook:`, workbook.model?.media?.length || 0);

      // Extract and compress all images
      const imageMap = {};
      const compressionPromises = [];

      if (workbook.model && workbook.model.media && workbook.model.media.length > 0) {
        // Map each media item to the corresponding cell
        // Since we can't directly correlate, we'll use position matching
        imageCells.forEach((cellInfo, index) => {
          // Try to match with media by index (assumes images are in order)
          const mediaItem = workbook.model.media[index];
          
          if (mediaItem && mediaItem.buffer) {
            const base64 = mediaItem.buffer.toString('base64');
            const ext = mediaItem.extension || 'png';
            const base64Data = `data:image/${ext};base64,${base64}`;
            
            console.log(`📸 Mapping media ${index} to cell ${cellInfo.key}`);
            console.log(`   Original size: ${(base64Data.length / 1024).toFixed(2)} KB`);
            
            const promise = compressBase64Image(base64Data).then(compressed => {
              console.log(`   ✅ Compressed to: ${(compressed.length / 1024).toFixed(2)} KB`);
              imageMap[cellInfo.key] = compressed;
            });
            
            compressionPromises.push(promise);
          }
        });
      }

      // Also handle anchored/floating images
      const worksheetImages = sheet.getImages ? sheet.getImages() : [];
      console.log("📸 Anchored images found:", worksheetImages.length);

      for (let i = 0; i < worksheetImages.length; i++) {
        const imgInfo = worksheetImages[i];
        const mediaItem = workbook.model.media.find(m => m.index === imgInfo.imageId);
        
        if (mediaItem && mediaItem.buffer) {
          const base64 = mediaItem.buffer.toString('base64');
          const ext = mediaItem.extension || 'png';
          const base64Data = `data:image/${ext};base64,${base64}`;

          const promise = compressBase64Image(base64Data).then(compressed => {
            const { tl, br } = imgInfo.range;
            for (let r = tl.row; r <= br.row; r++) {
              for (let c = tl.col; c <= br.col; c++) {
                const key = `${r}:${c}`;
                imageMap[key] = compressed;
              }
            }
          });

          compressionPromises.push(promise);
        }
      }

      await Promise.all(compressionPromises);
      console.log("\n✅ All images processed!");
      console.log("📋 Final imageMap keys:", Object.keys(imageMap));

      // Parse questions
      const parsedQuestions = [];

      sheet.eachRow((row, rowNumber) => {
        if (rowNumber === 1) return; // Skip header

        const getCellContent = (rowNum, colNum) => {
          // Check for image in map (0-indexed)
          const imgKey = `${rowNum - 1}:${colNum - 1}`;
          if (imageMap[imgKey]) {
            console.log(`🖼️ Using image for row ${rowNum}, col ${colNum}`);
            return { type: "image", data: imageMap[imgKey] };
          }

          // Get cell value
          const cell = sheet.getRow(rowNum).getCell(colNum);
          let val = cell.value;

          // Handle various cell value types
          if (val && typeof val === 'object') {
            // Skip #VALUE! errors (these are images we've already mapped)
            if (val.error === '#VALUE!') {
              console.log(`⚠️ Cell [${rowNum}, ${colNum}] has #VALUE! but no image mapped - returning empty`);
              return { type: "text", data: "" };
            }
            
            // Handle rich text
            if (val.richText) {
              val = val.richText.map(t => t.text).join('');
            } else if (val.result !== undefined) {
              val = val.result;
            } else if (val.text !== undefined) {
              val = val.text;
            } else {
              val = JSON.stringify(val);
            }
          }

          const text = val ? String(val).trim() : "";

          if (!text) {
            return { type: "text", data: "" };
          }

          // Detect LaTeX
          if (text.includes('\\') || text.includes('`')) {
            return { 
              type: "latex", 
              data: text.replace(/`/g, '').replace(/^['"]|['"]$/g, '') 
            };
          }

          return { type: "text", data: text };
        };

        const sno = getCellContent(rowNumber, 1).data;
        const subject = getCellContent(rowNumber, 2).data;
        const difficulty = getCellContent(rowNumber, 3).data;
        const questionContent = getCellContent(rowNumber, 4);
        
        console.log(`\n📝 Question ${rowNumber - 1}:`);
        
        const optionA = getCellContent(rowNumber, 5);
        const optionB = getCellContent(rowNumber, 6);
        const optionC = getCellContent(rowNumber, 7);
        const optionD = getCellContent(rowNumber, 8);

        console.log(`   Options: A=${optionA.type}, B=${optionB.type}, C=${optionC.type}, D=${optionD.type}`);

        const allOptionsEmpty = !optionA.data && !optionB.data && !optionC.data && !optionD.data;

        const answerCell = getCellContent(rowNumber, 9);
        const marks = Number(getCellContent(rowNumber, 10).data) || 1;
        const imageCol = getCellContent(rowNumber, 11);
        const formulaCol = getCellContent(rowNumber, 12);

        let finalQuestion = questionContent;
        if (imageCol.type === "image") {
          finalQuestion = imageCol;
        } else if (formulaCol.type === "latex" || formulaCol.data) {
          finalQuestion = {
            type: "combined",
            text: questionContent,
            formula: formulaCol
          };
        }

        if (allOptionsEmpty) {
          parsedQuestions.push({
            sno,
            subject,
            difficulty,
            question: finalQuestion,
            questionType: "text",
            correctAnswer: answerCell.data,
            marks
          });
        } else {
          const ans = String(answerCell.data).toLowerCase().trim();
          let correctAnswer = 0;
          if (["a", "b", "c", "d"].includes(ans)) {
            correctAnswer = ans.charCodeAt(0) - 97;
          } else if (!isNaN(ans)) {
            correctAnswer = Number(ans) - 1;
          }

          parsedQuestions.push({
            sno,
            subject,
            difficulty,
            question: finalQuestion,
            questionType: "mcq",
            options: [optionA, optionB, optionC, optionD],
            correctAnswer,
            marks
          });
        }
      });

      console.log("\n✅ Total questions parsed:", parsedQuestions.length);
      setQuestions(parsedQuestions);
      setIsProcessing(false);

      if (parsedQuestions.length === 0) {
        setUploadError("No questions found");
      }
    } catch (err) {
      console.error("❌ Error:", err);
      setUploadError("Failed to parse: " + err.message);
      setIsProcessing(false);
    }
  };

  const handleStudentSelect = (id) => {
    setSelectedStudents((prev) =>
      prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id]
    );
  };
  
  const handleSelectAll = () =>
    selectedStudents.length === students.length
      ? setSelectedStudents([])
      : setSelectedStudents(students.map((s) => s.id));

  const handleCreateTest = async () => {
    if (!testName.trim()) return alert("Enter test name");
    if (questions.length === 0) return alert("Upload questions first");
    if (selectedStudents.length === 0) return alert("Select at least one student");

    try {
      const totalMarks = questions.reduce((sum, q) => sum + q.marks, 0);

      await addDoc(collection(db, "tests"), {
        testName,
        classId: classData.id,
        className: classData.name,
        section: classData.section,
        grade: classData.grade,
        duration: testDuration,
        negativeMarking,
        negativeMarks: negativeMarking ? negativeMarks : 0,
        questions,
        selectedStudents,
        totalMarks,
        totalQuestions: questions.length,
        createdAt: serverTimestamp(),
        status: "active",
      });

      alert("Test created successfully! 🎉");
      setShowPopup(false);
      
      setTestName("");
      setTestDuration(30);
      setNegativeMarking(false);
      setNegativeMarks(0.25);
      setSelectedStudents([]);
      setQuestions([]);
      setExcelFile(null);
    } catch (err) {
      console.error(err);
      alert("Failed to create test: " + err.message);
    }
  };

  if (loading) return <div className="loading">Loading...</div>;
  if (!classData) return <div className="error">Class not found</div>;

  return (
    <div className="class-details-container">
      <div className="class-header">
        <button className="back-btn" onClick={() => window.history.back()}>
          <ArrowLeft size={18} />
          <span>Back</span>
        </button>
        <h1>{classData.name} - {classData.section}</h1>

        <div className="class-info">
          <span className="info-badge">Grade: {classData.grade}</span>
          <span className="info-badge">Subject: {classData.mappings?.[0]?.subject}</span>
          <span className="info-badge">Total Students: {students.length}</span>
        </div>
      </div>

      <div className="students-section">
        <div className="section-header">
          <div className="header-left">
            <Users size={24} />
            <h2>Students List</h2>
          </div>
          <button className="conduct-test-btn" onClick={() => setShowPopup(true)}>
            <FileText size={20} />
            Conduct Test
          </button>
        </div>

        <div className="students-table-container">
          <table className="students-table">
            <thead>
              <tr>
                <th>S.No</th><th>Student ID</th><th>Name</th><th>Email</th><th>Roll Number</th>
              </tr>
            </thead>
            <tbody>
              {students.map((s, i) => (
                <tr key={s.id}>
                  <td>{i + 1}</td>
                  <td>{s.studentId}</td>
                  <td>{s.name}</td>
                  <td>{s.email || "N/A"}</td>
                  <td>{s.rollNumber || "N/A"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showPopup && (
        <div className="popup-overlay" onClick={() => setShowPopup(false)}>
          <div className="popup-content" onClick={(e) => e.stopPropagation()}>
            
            <div className="popup-header">
              <FileText size={28} />
              <h2>Create New Test</h2>
              <button className="close-btn" onClick={() => setShowPopup(false)}>×</button>
            </div>

            <div className="popup-body">

              <div className="form-group">
                <label>Test Name *</label>
                <input 
                  type="text"
                  value={testName} 
                  onChange={(e) => setTestName(e.target.value)}
                  placeholder="e.g., Physics Mid-Term Exam"
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Duration (minutes)</label>
                  <input 
                    type="number" 
                    value={testDuration} 
                    onChange={(e) => setTestDuration(Number(e.target.value))}
                    min="1"
                  />
                </div>

                <label className="checkbox-label">
                  <input 
                    type="checkbox" 
                    checked={negativeMarking} 
                    onChange={(e) => setNegativeMarking(e.target.checked)} 
                  />
                  Enable Negative Marking
                </label>
              </div>

              {negativeMarking && (
                <div className="form-group">
                  <label>Negative Marks (per wrong answer)</label>
                  <input 
                    type="number" 
                    step="0.25" 
                    value={negativeMarks} 
                    onChange={(e) => setNegativeMarks(Number(e.target.value))} 
                  />
                </div>
              )}

              <div className="form-group">
                <label>Upload Questions Excel File *</label>
                <div className="file-upload-wrapper">
                  <input 
                    type="file" 
                    accept=".xlsx,.xls" 
                    onChange={handleFileUpload} 
                    id="file-upload"
                    className="file-input"
                    disabled={isProcessing}
                  />
                  <label htmlFor="file-upload" className="file-upload-label">
                    <Upload size={20} />
                    {isProcessing ? "Processing..." : excelFile ? excelFile.name : "Choose Excel File"}
                  </label>
                </div>
                {uploadError && <p className="error-text">{uploadError}</p>}
                {isProcessing && (
                  <p className="info-text" style={{color: '#ff9800'}}>
                    ⏳ Processing images... Please wait.
                  </p>
                )}
                {questions.length > 0 && !isProcessing && (
                  <p className="success-text">
                    <CheckCircle size={16} />
                    {questions.length} questions loaded! 🎉
                  </p>
                )}
              </div>

              <div className="form-group">
                <label>Select Students *</label>
                <button className="select-all-btn" onClick={handleSelectAll}>
                  {selectedStudents.length === students.length ? "Deselect All" : "Select All"}
                </button>

                <div className="student-list">
                  {students.map((s) => (
                    <label key={s.id} className="student-checkbox">
                      <input 
                        type="checkbox" 
                        checked={selectedStudents.includes(s.id)} 
                        onChange={() => handleStudentSelect(s.id)} 
                      />
                      <span>{s.name} ({s.rollNumber || s.studentId})</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="popup-footer">
              <button className="btn-cancel" onClick={() => setShowPopup(false)}>Cancel</button>
              <button 
                className="btn-create" 
                onClick={handleCreateTest}
                disabled={isProcessing || questions.length === 0}
              >
                <CheckCircle size={18} />
                Create Test
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default ClassDetails;