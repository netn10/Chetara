import { useState } from 'react';
import './AddCard.css';

function AddCard() {
  const [formData, setFormData] = useState({
    name: '',
    manaCost: '',
    type: 'Creature',
    subtype: '',
    power: '',
    toughness: '',
    loyalty: '',
    text: '',
    colors: [],
    rarity: 'Common',
    imageUrl: '',
    flavorText: '',
    artist: '',
    set: 'Set 1',
    notes: '',
    chessPiece: 'none',
    archetypes: []
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [inputMode, setInputMode] = useState('form'); // 'form' or 'json'
  const [jsonInput, setJsonInput] = useState('');

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleColorToggle = (color) => {
    setFormData(prev => ({
      ...prev,
      colors: prev.colors.includes(color)
        ? prev.colors.filter(c => c !== color)
        : [...prev.colors, color]
    }));
  };

  const handleArchetypeChange = (e) => {
    const value = e.target.value;
    const archetypes = value.split(',').map(a => a.trim()).filter(a => a);
    setFormData(prev => ({
      ...prev,
      archetypes
    }));
  };

  const handleJsonInputChange = (e) => {
    setJsonInput(e.target.value);
  };

  const loadFromJson = () => {
    try {
      const parsed = JSON.parse(jsonInput);
      setFormData({
        name: parsed.name || '',
        manaCost: parsed.manaCost || '',
        type: parsed.type || 'Creature',
        subtype: parsed.subtype || '',
        power: parsed.power?.toString() || '',
        toughness: parsed.toughness?.toString() || '',
        loyalty: parsed.loyalty?.toString() || '',
        text: parsed.text || '',
        colors: parsed.colors || [],
        rarity: parsed.rarity || 'Common',
        imageUrl: parsed.imageUrl || '',
        flavorText: parsed.flavorText || '',
        artist: parsed.artist || '',
        set: parsed.set || 'Set 1',
        notes: parsed.notes || '',
        chessPiece: parsed.chessPiece || 'none',
        archetypes: parsed.archetypes || []
      });
      setInputMode('form');
      setMessage({ type: 'success', text: 'JSON loaded successfully! You can now edit or submit.' });
    } catch (error) {
      setMessage({ type: 'error', text: `Invalid JSON: ${error.message}` });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      let cardData;

      // If in JSON mode, parse JSON directly
      if (inputMode === 'json') {
        try {
          cardData = JSON.parse(jsonInput);
          cardData.custom = true; // Ensure custom flag is set
        } catch (parseError) {
          throw new Error(`Invalid JSON: ${parseError.message}`);
        }
      } else {
        // Prepare card data from form
        cardData = {
          name: formData.name,
          manaCost: formData.manaCost,
          type: formData.type,
          text: formData.text,
          colors: formData.colors,
          rarity: formData.rarity,
          custom: true,
          imageUrl: formData.imageUrl || undefined,
          artist: formData.artist || undefined,
          set: formData.set || 'Set 1',
          chessPiece: formData.chessPiece || 'none',
          archetypes: formData.archetypes
        };

        // Add optional fields
        if (formData.subtype) cardData.subtype = formData.subtype;
        if (formData.flavorText) cardData.flavorText = formData.flavorText;
        if (formData.notes) cardData.notes = formData.notes;

        // Add creature-specific fields
        if (formData.type.includes('Creature') || formData.type.includes('creature')) {
          cardData.power = formData.power ? parseInt(formData.power) : null;
          cardData.toughness = formData.toughness ? parseInt(formData.toughness) : null;
        }

        // Add planeswalker-specific fields
        if (formData.type.includes('Planeswalker') || formData.type.includes('planeswalker')) {
          cardData.loyalty = formData.loyalty ? parseInt(formData.loyalty) : null;
        }
      }

      const response = await fetch('http://localhost:5000/api/cards', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(cardData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create card');
      }

      const newCard = await response.json();
      setMessage({ type: 'success', text: `Card "${newCard.name}" created successfully!` });

      // Reset form and JSON input
      setFormData({
        name: '',
        manaCost: '',
        type: 'Creature',
        subtype: '',
        power: '',
        toughness: '',
        loyalty: '',
        text: '',
        colors: [],
        rarity: 'Common',
        imageUrl: '',
        flavorText: '',
        artist: '',
        set: 'Set 1',
        notes: '',
        chessPiece: 'none',
        archetypes: []
      });
      setJsonInput('');

    } catch (error) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setLoading(false);
    }
  };

  const isCreature = formData.type.toLowerCase().includes('creature');
  const isPlaneswalker = formData.type.toLowerCase().includes('planeswalker');

  return (
    <div className="add-card-page">
      <div className="add-card-container">
        <h1>Add a New Card</h1>
        <p className="subtitle">Create a custom Chess Magic card</p>

        {message.text && (
          <div className={`message ${message.type}`}>
            {message.text}
          </div>
        )}

        {/* Input Mode Toggle */}
        <div className="input-mode-toggle">
          <button
            type="button"
            className={`mode-btn ${inputMode === 'form' ? 'active' : ''}`}
            onClick={() => setInputMode('form')}
          >
            Form Input
          </button>
          <button
            type="button"
            className={`mode-btn ${inputMode === 'json' ? 'active' : ''}`}
            onClick={() => setInputMode('json')}
          >
            JSON Input
          </button>
        </div>

        <form onSubmit={handleSubmit} className="add-card-form">
          {/* JSON Input Mode */}
          {inputMode === 'json' && (
            <div className="json-input-section">
              <div className="form-group">
                <label htmlFor="jsonInput">Card Data (JSON Format)</label>
                <textarea
                  id="jsonInput"
                  value={jsonInput}
                  onChange={handleJsonInputChange}
                  rows="20"
                  className="json-textarea"
                  placeholder={`{
  "name": "Ambitious Contender",
  "manaCost": "{0}",
  "type": "Artifact Creature",
  "subtype": "Pawn",
  "power": 2,
  "toughness": 1,
  "text": "Card abilities...",
  "colors": [],
  "rarity": "Rare",
  "imageUrl": "https://i.imgur.com/example.jpg",
  "artist": "Artist Name",
  "set": "2025 MTG",
  "chessPiece": "pawn",
  "archetypes": ["Chess", "Artifacts"]
}`}
                />
              </div>
              <div className="json-actions">
                <button
                  type="button"
                  className="load-json-btn"
                  onClick={loadFromJson}
                >
                  Load to Form
                </button>
              </div>
            </div>
          )}

          {/* Form Input Mode */}
          {inputMode === 'form' && (
            <>
          {/* Basic Information */}
          <div className="form-section">
            <h2>Basic Information</h2>

            <div className="form-group">
              <label htmlFor="name">Card Name *</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
                placeholder="e.g., Ambitious Contender"
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="manaCost">Mana Cost *</label>
                <input
                  type="text"
                  id="manaCost"
                  name="manaCost"
                  value={formData.manaCost}
                  onChange={handleInputChange}
                  required
                  placeholder="e.g., {2}{W}{U}"
                />
                <small>Use format: {'{2}{W}{U}'} or {'{0}'} for free</small>
              </div>

              <div className="form-group">
                <label htmlFor="rarity">Rarity *</label>
                <select
                  id="rarity"
                  name="rarity"
                  value={formData.rarity}
                  onChange={handleInputChange}
                  required
                >
                  <option value="Common">Common</option>
                  <option value="Uncommon">Uncommon</option>
                  <option value="Rare">Rare</option>
                  <option value="Mythic">Mythic</option>
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="type">Card Type *</label>
                <input
                  type="text"
                  id="type"
                  name="type"
                  value={formData.type}
                  onChange={handleInputChange}
                  required
                  placeholder="e.g., Creature, Instant, Sorcery"
                />
              </div>

              <div className="form-group">
                <label htmlFor="subtype">Subtype</label>
                <input
                  type="text"
                  id="subtype"
                  name="subtype"
                  value={formData.subtype}
                  onChange={handleInputChange}
                  placeholder="e.g., Pawn, Knight"
                />
              </div>
            </div>

            {/* Colors */}
            <div className="form-group">
              <label>Colors</label>
              <div className="color-toggles">
                {[
                  { code: 'W', name: 'White', color: '#F0E6D2' },
                  { code: 'U', name: 'Blue', color: '#0E68AB' },
                  { code: 'B', name: 'Black', color: '#150B00' },
                  { code: 'R', name: 'Red', color: '#D3202A' },
                  { code: 'G', name: 'Green', color: '#00733E' }
                ].map(({ code, name, color }) => (
                  <button
                    key={code}
                    type="button"
                    className={`color-toggle ${formData.colors.includes(code) ? 'active' : ''}`}
                    onClick={() => handleColorToggle(code)}
                    style={{
                      backgroundColor: formData.colors.includes(code) ? color : 'transparent',
                      borderColor: color
                    }}
                  >
                    {name}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Stats */}
          {(isCreature || isPlaneswalker) && (
            <div className="form-section">
              <h2>Stats</h2>

              {isCreature && (
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="power">Power</label>
                    <input
                      type="number"
                      id="power"
                      name="power"
                      value={formData.power}
                      onChange={handleInputChange}
                      placeholder="e.g., 2"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="toughness">Toughness</label>
                    <input
                      type="number"
                      id="toughness"
                      name="toughness"
                      value={formData.toughness}
                      onChange={handleInputChange}
                      placeholder="e.g., 1"
                    />
                  </div>
                </div>
              )}

              {isPlaneswalker && (
                <div className="form-group">
                  <label htmlFor="loyalty">Loyalty</label>
                  <input
                    type="number"
                    id="loyalty"
                    name="loyalty"
                    value={formData.loyalty}
                    onChange={handleInputChange}
                    placeholder="e.g., 3"
                  />
                </div>
              )}
            </div>
          )}

          {/* Card Text */}
          <div className="form-section">
            <h2>Card Text</h2>

            <div className="form-group">
              <label htmlFor="text">Ability Text *</label>
              <textarea
                id="text"
                name="text"
                value={formData.text}
                onChange={handleInputChange}
                required
                rows="5"
                placeholder="Enter the card's abilities and effects..."
              />
            </div>

            <div className="form-group">
              <label htmlFor="flavorText">Flavor Text</label>
              <textarea
                id="flavorText"
                name="flavorText"
                value={formData.flavorText}
                onChange={handleInputChange}
                rows="2"
                placeholder="Optional flavor text..."
              />
            </div>
          </div>

          {/* Chess Integration */}
          <div className="form-section">
            <h2>Chess Integration</h2>

            <div className="form-group">
              <label htmlFor="chessPiece">Linked Chess Piece</label>
              <select
                id="chessPiece"
                name="chessPiece"
                value={formData.chessPiece}
                onChange={handleInputChange}
              >
                <option value="none">None</option>
                <option value="pawn">Pawn</option>
                <option value="knight">Knight</option>
                <option value="bishop">Bishop</option>
                <option value="rook">Rook</option>
                <option value="queen">Queen</option>
                <option value="king">King</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="archetypes">Archetypes</label>
              <input
                type="text"
                id="archetypes"
                name="archetypes"
                value={formData.archetypes.join(', ')}
                onChange={handleArchetypeChange}
                placeholder="e.g., Chess, Artifacts, Counters (comma-separated)"
              />
            </div>
          </div>

          {/* Additional Information */}
          <div className="form-section">
            <h2>Additional Information</h2>

            <div className="form-group">
              <label htmlFor="imageUrl">Image URL</label>
              <input
                type="url"
                id="imageUrl"
                name="imageUrl"
                value={formData.imageUrl}
                onChange={handleInputChange}
                placeholder="https://i.imgur.com/example.jpg"
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="artist">Artist</label>
                <input
                  type="text"
                  id="artist"
                  name="artist"
                  value={formData.artist}
                  onChange={handleInputChange}
                  placeholder="Artist name"
                />
              </div>

              <div className="form-group">
                <label htmlFor="set">Set</label>
                <input
                  type="text"
                  id="set"
                  name="set"
                  value={formData.set}
                  onChange={handleInputChange}
                  placeholder="e.g., 2025 MTG"
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="notes">Notes</label>
              <textarea
                id="notes"
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                rows="3"
                placeholder="Optional notes about the card..."
              />
            </div>
          </div>
            </>
          )}

          {/* Submit Button */}
          <div className="form-actions">
            <button type="submit" className="submit-btn" disabled={loading}>
              {loading ? (inputMode === 'json' ? 'Creating from JSON...' : 'Creating Card...') : 'Create Card'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AddCard;
