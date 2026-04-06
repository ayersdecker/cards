import React, { useState, useRef } from 'react';
import { recognizeCard } from '../../services/openai';
import { getCardByName, getCardImage } from '../../services/scryfall';
import type { ScryfallCard } from '../../types';
import CardDetail from '../Cards/CardDetail';
import { useStorageSettings } from '../../context/StorageSettingsContext';
import { getStorageRec } from '../../services/storageSettings';

type CardRecognitionProps = {
  embedded?: boolean;
};

export default function CardRecognition({ embedded = false }: CardRecognitionProps) {
  const { settings } = useStorageSettings();
  const [preview, setPreview] = useState<string | null>(null);
  const [base64, setBase64] = useState<string>('');
  const [cardName, setCardName] = useState('');
  const [card, setCard] = useState<ScryfallCard | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = ev.target?.result as string;
      setPreview(result);
      setBase64(result.split(',')[1] ?? '');
      setCard(null);
      setCardName('');
      setError('');
    };
    reader.readAsDataURL(file);
  };

  const handleRecognize = async () => {
    if (!base64) return;
    setLoading(true);
    setError('');
    try {
      const name = await recognizeCard(base64);
      setCardName(name);
      const found = await getCardByName(name);
      setCard(found);
      if (!found) setError(`Card "${name}" not found on Scryfall.`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Recognition failed');
    } finally {
      setLoading(false);
    }
  };

  const content = (
    <>
      {!embedded && <h2 className="page-title">AI Card <span className="accent-yellow">Scan</span></h2>}
      <p className="muted">Upload a photo of a Magic card to identify it using AI.</p>

      <div className="recognition-area">
        <div
          className="drop-zone"
          onClick={() => fileRef.current?.click()}
        >
          {preview ? (
            <img src={preview} alt="Preview" className="upload-preview" />
          ) : (
            <div className="drop-placeholder">
              <span>📷</span>
              <span>Click to upload card image</span>
            </div>
          )}
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          onChange={handleFile}
        />
        <button
          className="btn btn-primary"
          onClick={handleRecognize}
          disabled={!base64 || loading}
        >
          {loading ? 'Identifying…' : 'Identify Card'}
        </button>
      </div>

      {error && <div className="error-msg">{error}</div>}

      {cardName && !card && !loading && (
        <p>AI identified: <strong className="accent-cyan">{cardName}</strong></p>
      )}

      {card && (
        <div className="recognized-result">
          <p>Identified: <strong className="accent-cyan">{card.name}</strong></p>
          <div className="card-thumb recognized-card" onClick={() => setShowDetail(true)}>
            {getCardImage(card) && (
              <img src={getCardImage(card)} alt={card.name} />
            )}
            <div className="card-thumb-name">{card.name}</div>
            <div className="card-thumb-price accent-yellow">
              {card.prices.usd ? `$${card.prices.usd}` : 'N/A'}
            </div>
            <div className="muted">{getStorageRec({
              price: card.prices.usd,
              name: card.name,
              set: card.set,
              set_name: card.set_name,
              colors: card.colors ?? [],
              cmc: card.cmc,
              type_line: card.type_line,
              mana_cost: card.mana_cost,
            }, settings)}</div>
          </div>
          {showDetail && (
            <CardDetail card={card} onClose={() => setShowDetail(false)} />
          )}
        </div>
      )}
    </>
  );

  if (embedded) {
    return <section className="bulk-import-card">{content}</section>;
  }

  return (
    <div className="page">
      {content}
    </div>
  );
}
