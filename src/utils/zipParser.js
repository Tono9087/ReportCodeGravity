import JSZip from 'jszip';

const SOURCE_EXTENSIONS = ['js', 'ts', 'jsx', 'tsx', 'py', 'html', 'css', 'json', 'md'];
const HEAVY_FOLDERS = ['node_modules', '.git', 'build', 'dist', '.next', 'coverage'];
const ALWAYS_UNCHECKED = ['.gitignore', 'package-lock.json', 'yarn.lock', 'pnpm-lock.yaml', '.env'];

export const loadZipAndGetTree = async (file) => {
  try {
    const zip = await JSZip.loadAsync(file);
    const allFiles = [];

    zip.forEach((relativePath, zipEntry) => {
      if (zipEntry.dir) return;

      const parts = relativePath.split('/');
      const filename = parts[parts.length - 1];
      const extension = filename.split('.').pop()?.toLowerCase() || '';

      const isIgnoredFolder = parts.some((part) => HEAVY_FOLDERS.includes(part));
      if (isIgnoredFolder) return;

      const isSourceFile = SOURCE_EXTENSIONS.includes(extension);
      const isUncheckedByDefault = ALWAYS_UNCHECKED.includes(filename) || !isSourceFile;
      const defaultChecked = !isUncheckedByDefault;

      const size = zipEntry._data && zipEntry._data.uncompressedSize ? zipEntry._data.uncompressedSize : 0;

      allFiles.push({
        path: relativePath,
        name: filename,
        extension,
        parts,
        isSourceFile,
        defaultChecked,
        size,
        entry: zipEntry,
      });
    });

    const structure = generateDetailedTree(allFiles);

    return {
      overview: {
        filename: file.name,
        size: (file.size / 1024).toFixed(2) + ' KB',
        date: new Date().toLocaleDateString(),
      },
      allFiles,
      structure,
      rawZip: zip,
    };
  } catch (error) {
    console.error('Error cargando ZIP:', error);
    throw new Error('Falló al parsear el archivo ZIP subido.');
  }
};

export const processSelectedFiles = async (selectedFiles, overview) => {
  const fileContents = await Promise.all(
    selectedFiles.map(async (f) => {
      const content = await f.entry.async('string');
      return {
        path: f.path,
        name: f.name,
        extension: f.extension,
        content: content,
        category: determineCategory(f.parts),
      };
    })
  );

  const cleanStructure = generateCleanTree(selectedFiles);

  return {
    overview,
    structure: cleanStructure,
    files: groupBy(fileContents, 'category'),
  };
};

function groupBy(array, key) {
  return array.reduce((acc, current) => {
    const groupKey = current[key];
    if (!acc[groupKey]) {
      acc[groupKey] = [];
    }
    acc[groupKey].push(current);
    return acc;
  }, {});
}

function determineCategory(parts) {
  if (parts.length === 1) return 'Código Fuente';

  const commonCategories = ['src', 'components', 'pages', 'store', 'utils', 'assets'];

  for (const part of parts) {
    const lowerPart = part.toLowerCase();
    if (commonCategories.includes(lowerPart)) {
      if (lowerPart === 'src') {
        const nextPart = parts[parts.indexOf(part) + 1];
        if (nextPart && commonCategories.includes(nextPart.toLowerCase())) {
          return nextPart.charAt(0).toUpperCase() + nextPart.slice(1);
        }
      }
      return part.charAt(0).toUpperCase() + part.slice(1);
    }
  }

  return parts[0].charAt(0).toUpperCase() + parts[0].slice(1);
}

// Tree for the selector (includes file metadata in leaves)
function generateDetailedTree(files) {
  const tree = {};

  files.forEach((file) => {
    let currentLevel = tree;
    file.parts.forEach((part, index) => {
      if (index === file.parts.length - 1) {
        currentLevel[part] = file;
      } else {
        if (!currentLevel[part]) {
          currentLevel[part] = { _isDir: true, children: {} };
        }
        currentLevel = currentLevel[part].children;
      }
    });
  });

  return tree;
}

// Tree for the final PDF (just null values for files)
function generateCleanTree(files) {
  const tree = {};

  files.forEach((file) => {
    let currentLevel = tree;
    file.parts.forEach((part, index) => {
      if (index === file.parts.length - 1) {
        currentLevel[part] = null;
      } else {
        if (!currentLevel[part]) {
          currentLevel[part] = {};
        }
        currentLevel = currentLevel[part];
      }
    });
  });

  return tree;
}
