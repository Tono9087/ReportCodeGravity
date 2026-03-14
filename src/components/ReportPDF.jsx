import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image, Link } from '@react-pdf/renderer';
import Prism from 'prismjs';

// Load Prism languages
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-jsx';
import 'prismjs/components/prism-tsx';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-css';
import 'prismjs/components/prism-json';
import 'prismjs/components/prism-markdown';

// We use Courier for monospace, which is a standard internal PDF font.
const styles = StyleSheet.create({
  page: { 
    padding: 30, 
    backgroundColor: '#ffffff', 
    fontFamily: 'Helvetica',
  },
  cover: { 
    display: 'flex', 
    flexDirection: 'column', 
    alignItems: 'center', 
    justifyContent: 'center', 
    height: '100%' 
  },
  title: { fontSize: 32, marginBottom: 10, color: '#0F172A', textAlign: 'center' },
  subtitle: { fontSize: 20, color: '#4F46E5', marginBottom: 20, textAlign: 'center' },
  details: { fontSize: 14, color: '#475569', textAlign: 'center', marginVertical: 4 },
  snackLabel: { fontSize: 16, color: '#0F172A', marginTop: 30, marginBottom: 5, textAlign: 'center', fontWeight: 'bold' },
  snackLink: { fontSize: 14, color: '#2563EB', textDecoration: 'underline', textAlign: 'center', marginBottom: 30 },
  sectionTitle: { fontSize: 18, color: '#0F172A', marginBottom: 15, borderBottomWidth: 1, borderBottomColor: '#E2E8F0', paddingBottom: 5, marginTop: 10 },
  treeContainer: { marginLeft: 10, marginTop: 10 },
  treeFolder: { fontSize: 12, fontFamily: 'Courier', color: '#2563EB', marginVertical: 2 },
  treeFile: { fontSize: 12, fontFamily: 'Courier', color: '#475569', marginVertical: 2 },
  categorySection: { marginTop: 20 },
  categoryTitle: { fontSize: 20, color: '#0F172A', marginBottom: 15, paddingBottom: 5, borderBottomWidth: 2, borderBottomColor: '#E2E8F0' },
  fileBlock: { marginBottom: 20, marginTop: 15 },
  fileHeader: { backgroundColor: '#F8FAFC', padding: 10, borderTopLeftRadius: 4, borderTopRightRadius: 4, borderWidth: 1, borderColor: '#E2E8F0', borderBottomWidth: 0 },
  fileName: { fontSize: 12, fontFamily: 'Courier', color: '#0F172A', fontWeight: 'bold', marginBottom: 4 },
  filePath: { fontSize: 10, fontFamily: 'Courier', color: '#64748B' },
  codeContainer: { backgroundColor: '#1E293B', padding: 15, borderBottomLeftRadius: 4, borderBottomRightRadius: 4, borderWidth: 1, borderColor: '#1E293B' },
  codeText: { fontFamily: 'Courier', fontSize: 10, color: '#F8FAFC', lineHeight: 1.5 },
  screenshotItem: { marginBottom: 30, alignItems: 'center', width: '100%' },
  screenshotImg: { maxWidth: '100%', height: 'auto', objectFit: 'contain' },
  caption: { fontSize: 10, fontStyle: 'italic', color: '#475569', marginTop: 10 }
});

const getTokenColor = (type) => {
  switch(type) {
    case 'comment': case 'prolog': case 'doctype': case 'cdata': return '#999999';
    case 'punctuation': return '#cccccc';
    case 'namespace': return '#e2777a';
    case 'property': case 'tag': case 'boolean': case 'number': case 'constant': case 'symbol': case 'deleted': return '#f08d49';
    case 'selector': case 'attr-name': case 'string': case 'char': case 'builtin': case 'inserted': return '#7ec699';
    case 'operator': case 'entity': case 'url': return '#67cdcc';
    case 'atrule': case 'attr-value': case 'keyword': return '#cc99cd';
    case 'function': case 'class-name': return '#f8c555';
    case 'regex': case 'important': case 'variable': return '#e90';
    default: return '#F8FAFC';
  }
};

const getGrammar = (ext) => {
  switch(ext) {
    case 'js': case 'jsx': return Prism.languages.javascript;
    case 'ts': case 'tsx': return Prism.languages.typescript;
    case 'py': return Prism.languages.python;
    case 'html': return Prism.languages.html;
    case 'css': return Prism.languages.css;
    case 'json': return Prism.languages.json;
    case 'md': return Prism.languages.markdown;
    default: return null;
  }
};

const flattenTokens = (tokens, baseType = '') => {
  let result = [];
  for (const t of tokens) {
    if (typeof t === 'string') {
      result.push({ text: t, type: baseType });
    } else {
      let type = t.type;
      if (typeof t.content === 'string') {
        result.push({ text: t.content, type });
      } else if (Array.isArray(t.content)) {
        result.push(...flattenTokens(t.content, type));
      } else if (t.content && t.content.content) {
        result.push({ text: String(t.content.content), type });
      } else {
        result.push({ text: String(t.content || ''), type: type });
      }
    }
  }
  return result;
};

const CodeBlock = ({ content, extension }) => {
  // Strip control characters that commonly break PDF text rendering (except standard line breaks/tabs)
  const safeContent = (content || '').replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');

  const grammar = getGrammar(extension);
  if (!grammar) {
    return (
      <View style={styles.codeContainer}>
        <Text style={styles.codeText}>{safeContent}</Text>
      </View>
    );
  }

  const tokens = Prism.tokenize(safeContent, grammar);
  const flatTokens = flattenTokens(tokens);

  return (
    <View style={styles.codeContainer}>
      <Text style={styles.codeText}>
        {flatTokens.map((token, idx) => (
          <Text key={idx} style={{ color: getTokenColor(token.type) }}>
            {token.text}
          </Text>
        ))}
      </Text>
    </View>
  );
};

export const ReportDocument = ({ projectData, screenshots, isSqaEnabled, sqaData, snackUrl }) => {
  if (!projectData) return null;
  const { overview, structure, files } = projectData;

  const renderTree = (nodes, level = 0) => {
    return Object.entries(nodes).map(([key, value], index) => {
      const isFile = value === null;
      const indentStyle = { marginLeft: level * 15, marginVertical: 2 };
      return (
        <View key={`${level}-${index}`} style={indentStyle}>
          <Text style={isFile ? styles.treeFile : styles.treeFolder}>
            {isFile ? '  |-- ' : '[Dir] '}
            {key}
          </Text>
          {!isFile && renderTree(value, level + 1)}
        </View>
      );
    });
  };

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.cover}>
          <Text style={styles.title}>Reporte de Documentación del Proyecto</Text>
          <Text style={styles.subtitle}>{overview.filename}</Text>
          
          {snackUrl ? (
            <View style={{ width: '100%', alignItems: 'center' }}>
              <Text style={styles.snackLabel}>URL de Snack:</Text>
              <Link src={snackUrl} style={styles.snackLink}>
                {snackUrl}
              </Link>
            </View>
          ) : null}
        </View>
      </Page>

      <Page size="A4" style={styles.page} wrap>
        <Text style={styles.sectionTitle}>Estructura del Proyecto</Text>
        <View style={styles.treeContainer}>
          {renderTree(structure)}
        </View>
      </Page>

      {Object.entries(files).map(([category, categoryFiles]) => (
        <React.Fragment key={category}>
          {categoryFiles.map((file, idx) => (
            <Page key={`${file.path}-${idx}`} size="A4" style={styles.page} wrap>
              {idx === 0 && <Text style={styles.categoryTitle}>{category}</Text>}
              <View style={styles.fileBlock} wrap>
                <View style={styles.fileHeader} wrap={false}>
                  <Text style={styles.fileName}>{file.name}</Text>
                  <Text style={styles.filePath}>{file.path}</Text>
                </View>
                <CodeBlock content={file.content} extension={file.extension} />
              </View>
            </Page>
          ))}
        </React.Fragment>
      ))}

      {screenshots && screenshots.length > 0 && (
        <Page size="A4" style={styles.page} wrap>
          <Text style={styles.sectionTitle}>Capturas de Pantalla del Proyecto</Text>
          {screenshots.map((img, idx) => (
            <View key={img.id} style={styles.screenshotItem} wrap={false}>
              <Image src={img.url} style={styles.screenshotImg} />
              <Text style={styles.caption}>Captura {idx + 1}: {img.name}</Text>
            </View>
          ))}
        </Page>
      )}

      {isSqaEnabled && (
        <Page size="A4" style={styles.page} wrap>
          <Text style={styles.sectionTitle}>Reflexión SQA</Text>
          <Text style={{ fontSize: 12, color: '#475569', marginBottom: 20 }}>Responde estas tres breves preguntas:</Text>
          
          <View style={{ marginBottom: 15 }} wrap={false}>
            <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#0F172A', marginBottom: 5 }}>S (Lo que Sabía):</Text>
            <Text style={{ fontSize: 12, color: '#334155', lineHeight: 1.5 }}>
              {sqaData?.s || 'Sin respuesta.'}
            </Text>
          </View>
          
          <View style={{ marginBottom: 15 }} wrap={false}>
            <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#0F172A', marginBottom: 5 }}>Q (Lo que Quería saber):</Text>
            <Text style={{ fontSize: 12, color: '#334155', lineHeight: 1.5 }}>
              {sqaData?.q || 'Sin respuesta.'}
            </Text>
          </View>
          
          <View style={{ marginBottom: 15 }} wrap={false}>
            <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#0F172A', marginBottom: 5 }}>A (Lo que Aprendí):</Text>
            <Text style={{ fontSize: 12, color: '#334155', lineHeight: 1.5 }}>
              {sqaData?.a || 'Sin respuesta.'}
            </Text>
          </View>
        </Page>
      )}
    </Document>
  );
};
export default ReportDocument;
