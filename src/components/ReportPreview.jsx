import React, { useEffect, useRef } from 'react';
import Prism from 'prismjs';
// We import common languages for Prism
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-jsx';
import 'prismjs/components/prism-tsx';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-css';
import 'prismjs/components/prism-json';
import 'prismjs/components/prism-markdown';
import 'prismjs/themes/prism-tomorrow.css'; // A nice dark theme for code blocks

const ReportPreview = ({ projectData, screenshots, reportRef, snackUrl }) => {
  // Trigger PrismJS highlighting when data changes
  useEffect(() => {
    if (projectData && projectData.files) {
      setTimeout(() => Prism.highlightAll(), 100);
    }
  }, [projectData]);

  if (!projectData) return null;

  const { overview, structure, files } = projectData;

  const renderTree = (nodes, level = 0) => {
    return (
      <ul className={`tree-list level-${level}`}>
        {Object.entries(nodes).map(([key, value], index) => (
          <li key={`${level}-${index}`}>
            <span className={value === null ? 'tree-file' : 'tree-folder'}>
              {value === null ? '📄 ' : '📁 '}
              {key}
            </span>
            {value !== null && renderTree(value, level + 1)}
          </li>
        ))}
      </ul>
    );
  };

  const getLanguageClass = (ext) => {
    switch(ext) {
      case 'js': case 'jsx': return 'language-javascript';
      case 'ts': case 'tsx': return 'language-typescript';
      case 'py': return 'language-python';
      case 'html': return 'language-html';
      case 'css': return 'language-css';
      case 'json': return 'language-json';
      case 'md': return 'language-markdown';
      default: return 'language-javascript';
    }
  };

  return (
    <div className="report-container" ref={reportRef}>
      {/* 1. Cover Page */}
      <div className="report-page cover-page">
        <div className="cover-content">
          <h1>Reporte de Documentación del Proyecto</h1>
          <h2>{overview.filename}</h2>
          
          {snackUrl && (
            <div className="cover-snack-section">
              <h3>URL de Snack:</h3>
              <a href={snackUrl} target="_blank" rel="noopener noreferrer" className="cover-snack-link">
                {snackUrl}
              </a>
            </div>
          )}
        </div>
      </div>

      {/* 2. Project Structure */}
      <div className="report-page structure-page">
        <h2>Estructura del Proyecto</h2>
        <div className="tree-container">
          {renderTree(structure)}
        </div>
      </div>

      {/* 3. Source Code Sections (Grouped) */}
      <div className="source-code-sections">
        {Object.entries(files).map(([category, categoryFiles]) => (
          <div key={category} className="category-section">
            <h2 className="category-title">{category}</h2>
            {categoryFiles.map((file, idx) => (
              <div key={`${file.path}-${idx}`} className="file-block">
                <div className="file-header">
                  <span className="file-name">{file.name}</span>
                  <span className="file-path">{file.path}</span>
                </div>
                <pre className="code-container">
                  <code className={getLanguageClass(file.extension)}>
                    {file.content}
                  </code>
                </pre>
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* 4. Screenshots */}
      {screenshots && screenshots.length > 0 && (
        <div className="report-page screenshots-page">
          <h2>Capturas de Pantalla del Proyecto</h2>
          <div className="screenshots-grid">
            {screenshots.map((img, idx) => (
              <div key={img.id} className="screenshot-item">
                <img src={img.url} alt={`Captura ${idx + 1}`} />
                <p className="caption">Captura {idx + 1}: {img.name}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportPreview;
