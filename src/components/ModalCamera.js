import { useRef, useState, useCallback } from "react";
import Webcam from "react-webcam";

export function ModalCamera({ onCaptura, onFechar }) {
  const webcamRef = useRef(null);
  const [preview, setPreview] = useState(null); // base64 da foto tirada
  const [blob, setBlob] = useState(null);        // blob para enviar ao back

  const tirarFoto = useCallback(() => {
    const imagemBase64 = webcamRef.current.getScreenshot();
    setPreview(imagemBase64);

    // Converte base64 → Blob
    fetch(imagemBase64)
      .then((res) => res.blob())
      .then((b) => setBlob(b));
  }, []);

  const confirmar = () => {
    const timestamp = new Date().toISOString(); // momento exato da captura
    onCaptura(blob, timestamp);
    onFechar();
  };

  const repetir = () => {
    setPreview(null);
    setBlob(null);
  };

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        {!preview ? (
          <>
            <Webcam
              ref={webcamRef}
              screenshotFormat="image/jpeg"
              videoConstraints={{ facingMode: "environment" }} // câmera traseira no mobile
              style={{ width: "100%", borderRadius: 8 }}
            />
            <button onClick={tirarFoto} style={styles.btnPrimario}>
              Tirar foto
            </button>
          </>
        ) : (
          <>
            <img src={preview} alt="preview" style={{ width: "100%", borderRadius: 8 }} />
            <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
              <button onClick={repetir} style={styles.btnSecundario}>Repetir</button>
              <button onClick={confirmar} style={styles.btnPrimario}>Usar esta foto</button>
            </div>
          </>
        )}
        <button onClick={onFechar} style={styles.btnFechar}>✕ Cancelar</button>
      </div>
    </div>
  );
}

const styles = {
  overlay: {
    position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)",
    display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50,
  },
  modal: {
    background: "#fff", borderRadius: 12, padding: 16,
    width: "min(420px, 95vw)", display: "flex", flexDirection: "column", gap: 8,
  },
  btnPrimario: {
    background: "#C41E2A", color: "#fff", border: "none",
    borderRadius: 6, padding: "10px 16px", fontWeight: "bold",
    cursor: "pointer", width: "100%",
  },
  btnSecundario: {
    background: "#e5e7eb", color: "#374151", border: "none",
    borderRadius: 6, padding: "10px 16px", fontWeight: "bold",
    cursor: "pointer", flex: 1,
  },
  btnFechar: {
    background: "transparent", color: "#6b7280", border: "1px solid #d1d5db",
    borderRadius: 6, padding: "8px 16px", cursor: "pointer", marginTop: 4,
  },
};