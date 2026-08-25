import { useEffect, useState } from 'react';

function kind(file) {
  const ext = file?.name?.toLowerCase().split('.').pop();
  if (ext === 'pdf') return 'pdf';
  if (['txt', 'html', 'htm', 'xml', 'jats'].includes(ext)) return 'text';
  return 'office';
}

export default function EvidenceDocumentViewer({ file }) {
  const [url, setUrl] = useState(null);
  const [text, setText] = useState('');
  const [textError, setTextError] = useState('');

  useEffect(() => {
    if (!file) {
      setUrl(null);
      setText('');
      setTextError('');
      return undefined;
    }

    const objectUrl = URL.createObjectURL(file);
    setUrl(objectUrl);
    setText('');
    setTextError('');

    if (kind(file) === 'text') {
      file.text().then(setText).catch(() => setTextError('Filen kunne ikke forhåndsvises som tekst.'));
    }
    return () => URL.revokeObjectURL(objectUrl);
  }, [file]);

  if (!file) {
    return <div className="document-viewer-empty">Last opp et forskningsdokument for å lese kilden mens du arbeider.</div>;
  }

  const type = kind(file);
  return <section className="document-viewer" aria-label="Forskningsdokument">
    <div className="document-viewer-header">
      <strong>{file.name}</strong>
      {url && <a href={url} download={file.name}>Åpne/last ned</a>}
    </div>
    {type === 'pdf' && url && <iframe title={`Forskningsdokument: ${file.name}`} src={url} className="document-viewer-frame" />}
    {type === 'text' && (textError ? <p className="notice notice-error">{textError}</p> : <pre className="document-viewer-text">{text}</pre>)}
    {type === 'office' && <div className="document-viewer-empty"><h4>Dokumentet er lastet opp</h4><p>Nettleseren kan ikke vise DOCX direkte uten en ekstern dokumentviser. Dokumentet er likevel tilgjengelig for analyse i verktøyet.</p>{url && <a href={url} download={file.name}>Åpne/last ned dokumentet</a>}</div>}
  </section>;
}
