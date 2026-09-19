import { useEffect, useMemo, useState } from 'react';

const TEXT_EXTENSIONS = new Set([
  'txt',
  'html',
  'htm',
  'xml',
  'jats',
]);

function getFileKind(file) {
  const extension = file?.name?.toLowerCase().split('.').pop();

  if (extension === 'pdf') return 'pdf';
  if (TEXT_EXTENSIONS.has(extension)) return 'text';
  return 'office';
}

export default function EvidenceDocumentViewer({ file }) {
  const [text, setText] = useState('');
  const [textError, setTextError] = useState('');
  const [loadedFile, setLoadedFile] = useState(null);

  const url = useMemo(
    () => (file ? URL.createObjectURL(file) : null),
    [file]
  );

  useEffect(() => {
    if (!file || getFileKind(file) !== 'text') {
      return undefined;
    }

    let active = true;

    file.text()
      .then((value) => {
        if (active) {
          setText(value);
          setTextError('');
          setLoadedFile(file);
        }
      })
      .catch(() => {
        if (active) {
          setText('');
          setTextError(
            'Filen kunne ikke forhåndsvises som tekst.'
          );
          setLoadedFile(file);
        }
      });

    return () => {
      active = false;
    };
  }, [file]);

  useEffect(() => {
    return () => {
      if (url) {
        URL.revokeObjectURL(url);
      }
    };
  }, [url]);

  if (!file) {
    return (
      <div className="document-viewer-empty">
        Last opp et forskningsdokument for å lese kilden mens du arbeider.
      </div>
    );
  }

  const type = getFileKind(file);

  return (
    <section
      className="document-viewer"
      aria-label="Forskningsdokument"
    >
      <div className="document-viewer-header">
        <strong>{file.name}</strong>

        {url && (
          <a
            href={url}
            download={file.name}
            aria-label="Åpne/last ned"
          >
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

      {type === 'text' &&
        loadedFile === file &&
        (textError ? (
          <p className="notice notice-error">
            {textError}
          </p>
        ) : (
          <pre className="document-viewer-text">
            {text}
          </pre>
        ))}

      {type === 'office' && (
        <div className="document-viewer-empty">
          <h4>Dokumentet er lastet opp</h4>

          <p>
            Nettleseren kan ikke vise DOCX direkte uten en
            ekstern dokumentviser. Dokumentet er likevel
            tilgjengelig for analyse i verktøyet.
          </p>

          {url && (
            <a
              href={url}
              download={file.name}
              aria-label="Åpne/last ned dokumentet"
            >
              Åpne/last ned dokumentet
            </a>
          )}
        </div>
      )}
    </section>
  );
}
