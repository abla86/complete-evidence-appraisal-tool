import { useEffect, useState } from 'react';

const TEXT_EXTENSIONS = new Set(['txt', 'html', 'htm', 'xml', 'jats']);

function getFileKind(file) {
  const extension = file?.name?.toLowerCase().split('.').pop();

  if (extension === 'pdf') return 'pdf';
  if (TEXT_EXTENSIONS.has(extension)) return 'text';
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
    let active = true;

    setUrl(objectUrl);
    setText('');
    setTextError('');

    if (getFileKind(file) === 'text') {
      file.text()
        .then((value) => {
          if (active) setText(value);
        })
        .catch(() => {
          if (active) {
            setTextError('Filen kunne ikke forhåndsvises som tekst.');
          }
        });
    }

    return () => {
      active = false;
      URL.revokeObjectURL(objectUrl);
    };
  }, [file]);

  if (!file) {
    return (
      <div className="document-viewer-empty">
        Last opp et forskningsdokument for å lese kilden mens du arbeider.
      </div>
    );
  }

  const type = getFileKind(file);

  return (
    <section className="document-viewer" aria-label="Forskningsdokument">
      <div className="document-viewer-header">
        <strong>{file.name}</strong>
        {url && (
          <a href={url} download={file.name}>
            Åpne/last ned
          </a>
        )}
      </div>

      {type === 'pdf' && url && (
        <iframe
          title={`Forskningsdokument: ${file.name}`}
          src={url}
          className="document-viewer-frame"
        />
      )}

      {type === 'text' && (
        textError ? (
          <p className="notice notice-error">{textError}</p>
        ) : (
          <pre className="document-viewer-text">{text}</pre>
        )
      )}

      {type === 'office' && (
        <div className="document-viewer-empty">
          <h4>Dokumentet er lastet opp</h4>
          <p>
            Nettleseren kan ikke vise DOCX direkte uten en ekstern dokumentviser.
            Dokumentet er likevel tilgjengelig for analyse i verktøyet.
          </p>
          {url && (
            <a href={url} download={file.name}>
              Åpne/last ned dokumentet
            </a>
          )}
        </div>
      )}
    </section>
  );
}
