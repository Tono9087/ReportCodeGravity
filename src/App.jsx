import React, { useState, useRef, useEffect } from 'react';
import { pdf } from '@react-pdf/renderer';
import ReportDocument from './components/ReportPDF';
import { Settings, FileDown } from 'lucide-react';
import UploadSection from './components/UploadSection';
import ReportPreview from './components/ReportPreview';
import FileSelector from './components/FileSelector';
import { loadZipAndGetTree, processSelectedFiles } from './utils/zipParser';

function App() {
  const [projectData, setProjectData] = useState(null);
  const [pendingZipData, setPendingZipData] = useState(null);
  const [screenshots, setScreenshots] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  
  // SQA Reflection settings
  const [isSqaEnabled, setIsSqaEnabled] = useState(false);
  const [sqaData, setSqaData] = useState({ s: '', q: '', a: '' });
  
  // Snack URL settings
  const [snackUrl, setSnackUrl] = useState('');

  const reportRef = useRef(null);

  const handleZipUpload = async (file) => {
    setIsGenerating(true);
    setProjectData(null); // Clear previous
    try {
      const data = await loadZipAndGetTree(file);
      setPendingZipData(data);
    } catch (err) {
      alert("Error parsing zip file. Validate it is a valid zip and try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleConfirmSelection = async (selectedFiles) => {
    setIsGenerating(true);
    try {
      const data = await processSelectedFiles(selectedFiles, pendingZipData.overview);
      setProjectData(data);
      setPendingZipData(null);
    } catch (err) {
      alert("Error reading selected files.");
    } finally {
      setIsGenerating(false);
    }
  };

  const cancelSelection = () => {
    setPendingZipData(null);
  };

  const handleScreenshotsUpload = (images) => {
    setScreenshots(prev => [...prev, ...images]);
  };

  const handleRemoveScreenshot = (idToRemove) => {
    setScreenshots(prev => prev.filter(s => s.id !== idToRemove));
  };

  useEffect(() => {
    const handlePaste = (event) => {
      const clipboardData = event.clipboardData || window.clipboardData;
      if (!clipboardData) return;

      const newScreenshots = [];
      const items = clipboardData.items;

      if (items && items.length) {
        for (let i = 0; i < items.length; i++) {
          if (items[i].type.indexOf("image/") !== -1) {
            const blob = items[i].getAsFile();
            if (blob) {
              const url = URL.createObjectURL(blob);
              newScreenshots.push({
                id: Math.random().toString(36).substr(2, 9),
                name: `Pasted Image ${new Date().toLocaleTimeString()}`,
                url: url
              });
            }
          }
        }
      } else if (clipboardData.files && clipboardData.files.length) {
        for (let i = 0; i < clipboardData.files.length; i++) {
          const file = clipboardData.files[i];
          if (file.type.indexOf("image/") !== -1) {
            const url = URL.createObjectURL(file);
            newScreenshots.push({
              id: Math.random().toString(36).substr(2, 9),
              name: `Pasted Image ${new Date().toLocaleTimeString()}`,
              url: url
            });
          }
        }
      }

      if (newScreenshots.length > 0) {
        setScreenshots(prev => [...prev, ...newScreenshots]);
      }
    };

    window.addEventListener("paste", handlePaste);
    return () => {
      window.removeEventListener("paste", handlePaste);
    };
  }, []);

  const generatePDF = async () => {
    if (!projectData) return;
    
    if (!snackUrl.trim()) {
      alert("Snack URL is required to generate the report.");
      return;
    }
    
    if (!snackUrl.trim().startsWith("https://snack.expo.dev/")) {
      alert("Snack URL must start with https://snack.expo.dev/");
      return;
    }
    
    setIsGenerating(true);
    try {
      const blob = await pdf(
        <ReportDocument 
          projectData={projectData} 
          screenshots={screenshots} 
          isSqaEnabled={isSqaEnabled}
          sqaData={sqaData}
          snackUrl={snackUrl}
        />
      ).toBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Reporte-${projectData.overview.filename.replace('.zip', '') || 'Proyecto'}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch(err) {
      console.error(err);
      alert("Error generating PDF.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="app-container">
      <header className="app-header">
        <div className="header-content">
          <Settings className="logo-icon" />
          <h1>AutoReport Pro</h1>
          <p>Genera reportes PDF limpios y estructurados desde tu código.</p>
        </div>
      </header>

      <main className="app-main">
        <div className="control-panel">
          <UploadSection 
            onZipUpload={handleZipUpload} 
            onScreenshotsUpload={handleScreenshotsUpload} 
            onRemoveScreenshot={handleRemoveScreenshot}
            isGenerating={isGenerating}
            screenshots={screenshots}
          />
          
          <div className="export-section">
            {projectData && (
              <div className="snack-input-container">
                <label className="snack-label">URL de Snack <span style={{ color: '#ef4444' }}>*</span></label>
                <input 
                  type="url" 
                  className="snack-input"
                  placeholder="https://snack.expo.dev/@user/project"
                  value={snackUrl}
                  onChange={(e) => setSnackUrl(e.target.value)}
                />
              </div>
            )}
            <button 
              className={`btn-export ${!projectData || !snackUrl.trim() ? 'disabled' : ''}`}
              onClick={generatePDF}
              disabled={!projectData || isGenerating}
            >
              <FileDown className="btn-icon" />
              {isGenerating ? 'Procesando...' : 'Generar PDF'}
            </button>
            {projectData && (
              <>
                <div className="sqa-toggle-container">
                  <label className="fs-label" style={{ marginBottom: '1rem', cursor: 'pointer' }}>
                    <input 
                      type="checkbox" 
                      checked={isSqaEnabled} 
                      onChange={(e) => setIsSqaEnabled(e.target.checked)}
                    />
                    <span>Incluir Sección de Reflexión SQA</span>
                  </label>
                </div>
                <div className="status-badge success">
                  Proyecto Cargado: {projectData.overview.filename}
                </div>
              </>
            )}
          </div>
        </div>

        {/* This div is shown on screen but also captured by html2pdf */}
        <div className="preview-panel glass">
          {pendingZipData ? (
             <FileSelector 
               allFiles={pendingZipData.allFiles}
               structure={pendingZipData.structure}
               onConfirm={handleConfirmSelection}
               onCancel={cancelSelection}
             />
          ) : projectData ? (
            <div className="pdf-wrapper">
              <ReportPreview 
                projectData={projectData} 
                screenshots={screenshots} 
                reportRef={reportRef} 
                snackUrl={snackUrl}
              />
              
              {isSqaEnabled && (
                <div className="sqa-preview-section">
                  <h2>Reflexión SQA</h2>
                  <p className="sqa-subtitle">Responde estas tres breves preguntas:</p>
                  
                  <div className="sqa-field">
                    <label>S (Lo que Sabía):</label>
                    <textarea 
                      value={sqaData.s} 
                      onChange={(e) => setSqaData({...sqaData, s: e.target.value})}
                      placeholder="Escribe aquí lo que sabías..."
                    />
                  </div>
                  
                  <div className="sqa-field">
                    <label>Q (Lo que Quería saber):</label>
                    <textarea 
                      value={sqaData.q} 
                      onChange={(e) => setSqaData({...sqaData, q: e.target.value})}
                      placeholder="Escribe aquí lo que querías saber..."
                    />
                  </div>
                  
                  <div className="sqa-field">
                    <label>A (Lo que Aprendí):</label>
                    <textarea 
                      value={sqaData.a} 
                      onChange={(e) => setSqaData({...sqaData, a: e.target.value})}
                      placeholder="Escribe aquí lo que aprendiste..."
                    />
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-icon-wrap">
                <FileDown className="empty-icon" />
              </div>
              <h3>Ningún Proyecto Cargado</h3>
              <p>Sube un archivo .zip y cualquier captura de pantalla para generar la vista previa.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default App;
