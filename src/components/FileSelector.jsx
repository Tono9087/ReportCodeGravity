import React, { useState, useEffect } from 'react';
import { Folder, File, ChevronRight, ChevronDown, CheckSquare, Square, FileCode2 } from 'lucide-react';

export default function FileSelector({ allFiles, structure, onConfirm, onCancel }) {
  const [selectedPaths, setSelectedPaths] = useState(new Set());
  const [expandedFolders, setExpandedFolders] = useState(new Set());

  // Initialize defaults
  useEffect(() => {
    const defaultSelected = new Set(allFiles.filter(f => f.defaultChecked).map(f => f.path));
    setSelectedPaths(defaultSelected);

    // Auto-expand common folders
    const autoExpand = new Set(['src', 'components', 'pages', 'utils', 'assets', 'src/components']);
    setExpandedFolders(autoExpand);
  }, [allFiles]);

  const toggleFile = (path, checked) => {
    const newSet = new Set(selectedPaths);
    if (checked) newSet.add(path);
    else newSet.delete(path);
    setSelectedPaths(newSet);
  };

  const toggleFolder = (folderPrefix, checked) => {
    const newSet = new Set(selectedPaths);
    allFiles.forEach(f => {
      // Must exactly match the prefix to ensure we don't accidentally match src-files if folder is src
      if (f.path.startsWith(folderPrefix)) {
        if (checked) newSet.add(f.path);
        else newSet.delete(f.path);
      }
    });
    setSelectedPaths(newSet);
  };

  const toggleExpand = (folderPath) => {
    const newSet = new Set(expandedFolders);
    if (newSet.has(folderPath)) newSet.delete(folderPath);
    else newSet.add(folderPath);
    setExpandedFolders(newSet);
  };

  const handleSelectAll = () => {
    setSelectedPaths(new Set(allFiles.map(f => f.path)));
  };
  
  const handleDeselectAll = () => {
    setSelectedPaths(new Set());
  };
  
  const handleSelectSource = () => {
    setSelectedPaths(new Set(allFiles.filter(f => f.isSourceFile).map(f => f.path)));
  };

  const handleSelectJs = () => {
    setSelectedPaths(new Set(allFiles.filter(f => f.path.endsWith('.js') || f.path.endsWith('.jsx')).map(f => f.path)));
  };

  const handleConfirm = () => {
    const selectedFiles = allFiles.filter(f => selectedPaths.has(f.path));
    onConfirm(selectedFiles);
  };

  const renderNode = (nodes, currentPrefix = '') => {
    if (!nodes) return null;

    return (
      <div className="fs-children">
        {Object.entries(nodes).map(([key, value]) => {
          const nodePath = currentPrefix ? `${currentPrefix}/${key}` : key;
          const isDir = value && value._isDir === true;
          
          if (isDir) {
            const isExpanded = expandedFolders.has(nodePath);
            const filesUnder = allFiles.filter(f => f.path.startsWith(nodePath + '/'));
            const selectedCount = filesUnder.filter(f => selectedPaths.has(f.path)).length;
            const isAllSelected = filesUnder.length > 0 && selectedCount === filesUnder.length;
            const isSomeSelected = selectedCount > 0 && selectedCount < filesUnder.length;

            return (
              <div key={nodePath} className="fs-folder-node">
                <div className="fs-row">
                  <button className="fs-expander" onClick={() => toggleExpand(nodePath)}>
                    {isExpanded ? <ChevronDown size={16}/> : <ChevronRight size={16}/>}
                  </button>
                  <label className="fs-label">
                    <input 
                      type="checkbox" 
                      checked={isAllSelected}
                      ref={el => { if(el) el.indeterminate = isSomeSelected }}
                      onChange={(e) => toggleFolder(nodePath + '/', e.target.checked)}
                    />
                    <Folder className="fs-icon folder-icon" size={16}/>
                    <span className="fs-name">{key}/</span>
                  </label>
                </div>
                {isExpanded && renderNode(value.children, nodePath)}
              </div>
            );
          } else {
            const file = value;
            const isChecked = selectedPaths.has(file.path);
            const sizeStr = file.size ? (file.size / 1024).toFixed(1) + ' KB' : '';

            return (
              <div key={file.path} className="fs-file-node fs-row">
                <span className="fs-expander-placeholder" />
                <label className="fs-label">
                  <input 
                    type="checkbox" 
                    checked={isChecked}
                    onChange={(e) => toggleFile(file.path, e.target.checked)}
                  />
                  <File className="fs-icon file-icon" size={16}/>
                  <span className="fs-name" title={file.path}>{file.name}</span>
                  {sizeStr && <span className="fs-size">{sizeStr}</span>}
                </label>
              </div>
            );
          }
        })}
      </div>
    );
  };

  return (
    <div className="file-selector-panel glass">
      <div className="fs-header">
        <h3>Seleccionar Archivos para PDF</h3>
        <p>Elige qué archivos incluir en el reporte generado.</p>
      </div>
      
      <div className="fs-toolbar">
        <button className="fs-tool-btn" onClick={handleSelectAll}>
          <CheckSquare size={16} /> Seleccionar Todo
        </button>
        <button className="fs-tool-btn" onClick={handleDeselectAll}>
          <Square size={16} /> Deseleccionar Todo
        </button>
        <button className="fs-tool-btn primary-outline" onClick={handleSelectSource}>
          <FileCode2 size={16} /> Solo Archivos de Código
        </button>
        <button className="fs-tool-btn primary-outline" onClick={handleSelectJs}>
          <FileCode2 size={16} /> Solo Archivos .js
        </button>
      </div>

      <div className="fs-tree-container">
        {renderNode(structure)}
      </div>

      <div className="fs-footer">
        <span className="fs-count">{selectedPaths.size} archivos seleccionados</span>
        <div className="fs-actions">
          <button className="fs-btn cancel" onClick={onCancel}>Cancelar</button>
          <button className="fs-btn confirm" onClick={handleConfirm} disabled={selectedPaths.size === 0}>
            Vista Previa ({selectedPaths.size})
          </button>
        </div>
      </div>
    </div>
  );
}
