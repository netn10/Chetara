import React, { useState, useEffect, useRef, useMemo } from 'react';
import { flushSync } from 'react-dom';
import './DraftInterface.css';
import API_BASE_URL from '../config/api';

function DraftInterface({ draftId, onExit }) {
  const [draft, setDraft] = useState(null);
  const [playerId, setPlayerId] = useState(null);
  const [currentBooster, setCurrentBooster] = useState([]);
  const [pickedCards, setPickedCards] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false); // Start with false to use cache first
  const [isPicking, setIsPicking] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(null);
  const [picksThisRound, setPicksThisRound] = useState(0);
  const [lastBoosterLength, setLastBoosterLength] = useState(0);
  const currentBoosterRef = useRef([]);
  const skipNextUpdateRef = useRef(false);
  const abortControllerRef = useRef(null);
  const draftRef = useRef(null);

  // Deck builder state
  const [deck, setDeck] = useState([]);
  const [sideboard, setSideboard] = useState([]);
  const [sideboardPage, setSideboardPage] = useState(1);
  const [deckPage, setDeckPage] = useState(1);
  const [lastSaved, setLastSaved] = useState(null);
  const cardsPerPage = 20;

  useEffect(() => {
    // Get player ID from localStorage or draft data
    const storedPlayerId = localStorage.getItem(`draft_${draftId}_playerId`);
    if (storedPlayerId) {
      setPlayerId(storedPlayerId);
    }

    fetchDraftStatus();

    // Adaptive polling based on draft state for better performance
    const getPollingInterval = () => {
      // Fast polling when player has cards to pick
      if (currentBooster.length > 0 && !isPicking) return 200;
      // Medium polling when waiting for bots
      if (draft && draft.status === 'active') return 500;
      // Slow polling for other states
      return 1000;
    };

    const interval = setInterval(() => {
      // Poll only when not actively picking
      if (!isPicking) {
        fetchDraftStatus();
      }
    }, getPollingInterval());

    return () => clearInterval(interval);
  }, [draftId, isPicking, currentBooster.length, draft?.status]);

  useEffect(() => {
    console.log('⚡ [useEffect] Triggered', {
      hasDraft: !!draft,
      hasPlayerId: !!playerId,
      isPicking,
      skipNext: skipNextUpdateRef.current,
      currentBoosterLength: currentBooster.length
    });

    // Skip if we just manually updated (prevents duplicate update from causing flicker)
    if (skipNextUpdateRef.current) {
      console.log('⏭️ [useEffect] SKIPPED - manual update flag set');
      skipNextUpdateRef.current = false;
      return;
    }
    // Skip auto-update during picks to prevent flicker (handleCardPick updates manually)
    if (draft && playerId && !isPicking) {
      console.log('✅ [useEffect] Calling updatePlayerView');
      updatePlayerView();
    } else {
      console.log('⏭️ [useEffect] SKIPPED - isPicking or missing data');
    }
  }, [draft, playerId, isPicking]);

  // Keep ref in sync with current booster
  useEffect(() => {
    console.log('🎴 [currentBooster CHANGED]', {
      length: currentBooster.length,
      cardNames: currentBooster.map(c => c.name).slice(0, 5).join(', ') || 'EMPTY',
      isPicking
    });
    currentBoosterRef.current = currentBooster;
  }, [currentBooster]);

  // Calculate time limit based on picks made this round (memoized)
  const getTimeLimit = useMemo(() => (pickCount) => {
    if (pickCount < 5) return 60; // First 5 picks: 60 seconds
    if (pickCount < 10) return 30; // Picks 6-10: 30 seconds
    return 15; // Picks 11-15: 15 seconds
  }, []);

  // Memoize current player data for performance
  const currentPlayer = useMemo(() => {
    if (!draft || !playerId) return null;
    return draft.players.find(p => p.id === playerId);
  }, [draft, playerId]);

  // Memoize player index for booster calculations
  const playerIndex = useMemo(() => {
    if (!draft || !playerId) return -1;
    return draft.players.findIndex(p => p.id === playerId);
  }, [draft, playerId]);

  // Auto-pick when timer hits 0
  useEffect(() => {
    if (timeRemaining === 0 && currentBooster.length > 0 && !isPicking) {
      const randomCard = currentBooster[Math.floor(Math.random() * currentBooster.length)];
      handleCardPick(randomCard._id);
    }
  }, [timeRemaining]);

  // Keep draftRef in sync with draft state
  useEffect(() => {
    draftRef.current = draft;
  }, [draft]);

  // Timer countdown effect - always calculate from server's pickDeadline in real-time
  useEffect(() => {
    if (!playerId || isPicking) {
      return;
    }

    const timer = setInterval(() => {
      const currentDraft = draftRef.current;
      if (!currentDraft) {
        setTimeRemaining(null);
        return;
      }

      const player = currentDraft.players.find(p => p.id === playerId);
      if (player && player.pickDeadline) {
        const deadline = new Date(player.pickDeadline);
        const now = new Date();
        const secondsRemaining = Math.max(0, Math.ceil((deadline - now) / 1000));
        setTimeRemaining(secondsRemaining);
      } else {
        setTimeRemaining(null);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [playerId, isPicking]);

  // Start timer when new pack arrives (only when length actually changes)
  useEffect(() => {
    if (currentBooster.length > 0 && !isPicking && currentBooster.length !== lastBoosterLength) {
      // Calculate time remaining from server's pickDeadline if it exists
      if (draft && playerId) {
        const player = draft.players.find(p => p.id === playerId);
        if (player && player.pickDeadline) {
          // Use server's deadline to calculate actual time remaining
          const deadline = new Date(player.pickDeadline);
          const now = new Date();
          const secondsRemaining = Math.max(0, Math.ceil((deadline - now) / 1000));
          setTimeRemaining(secondsRemaining);
        } else {
          // No deadline set yet, use full time limit
          const timeLimit = getTimeLimit(picksThisRound);
          setTimeRemaining(timeLimit);
        }
      } else {
        // Fallback to time limit if no draft data
        const timeLimit = getTimeLimit(picksThisRound);
        setTimeRemaining(timeLimit);
      }
      setLastBoosterLength(currentBooster.length);
    } else if (currentBooster.length === 0) {
      setLastBoosterLength(0);
      setTimeRemaining(null);
    }
  }, [currentBooster.length, isPicking, lastBoosterLength, picksThisRound, draft, playerId]);

  // Track picks per round
  useEffect(() => {
    if (draft && playerId) {
      const player = draft.players.find(p => p.id === playerId);
      if (player) {
        // Calculate picks made this round (total picks % 15)
        const totalPicks = player.pickedCards?.length || 0;
        const picksInCurrentRound = totalPicks % 15;
        setPicksThisRound(picksInCurrentRound);
      }
    }
  }, [draft, playerId]);

  // Initialize deck builder when draft completes
  useEffect(() => {
    if (draft && draft.status === 'completed' && pickedCards.length > 0 && sideboard.length === 0 && deck.length === 0) {
      console.log('🏁 Draft completed, initializing deck builder');
      setSideboard([...pickedCards]);
    }
  }, [draft, pickedCards, sideboard.length, deck.length]);

  const fetchDraftStatus = async () => {
    console.log('🔄 [POLL] Fetching draft status');

    // Try to load from cache first for instant display
    const cachedDraft = localStorage.getItem(`draft_${draftId}_data`);
    const cacheTimestamp = localStorage.getItem(`draft_${draftId}_timestamp`);
    const cacheAge = cacheTimestamp ? Date.now() - parseInt(cacheTimestamp) : Infinity;
    const CACHE_DURATION = 2000; // 2 seconds cache for draft (shorter than cards because it changes frequently)

    // If cache exists and is fresh, use it immediately
    if (cachedDraft && cacheAge < CACHE_DURATION && !draft) {
      try {
        const parsedCache = JSON.parse(cachedDraft);
        console.log('⚡ [CACHE] Using cached draft data');
        setDraft(parsedCache);
        setLoading(false);
      } catch (e) {
        console.error('Error parsing cached draft:', e);
      }
    } else if (cachedDraft && !draft) {
      // Cache exists but is stale, still show it while fetching fresh data
      try {
        const parsedCache = JSON.parse(cachedDraft);
        console.log('⚡ [CACHE] Using stale cached draft data');
        setDraft(parsedCache);
        setLoading(false);
      } catch (e) {
        console.error('Error parsing cached draft:', e);
        setLoading(true);
      }
    } else if (!draft && !cachedDraft) {
      // No cache at all, show loading
      setLoading(true);
    }

    // Cancel previous fetch if still running (but not during initial load)
    if (abortControllerRef.current && !loading) {
      console.log('🚫 [POLL] Cancelling previous fetch');
      abortControllerRef.current.abort();
    }

    // Create new AbortController for this fetch
    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const response = await fetch(`${API_BASE_URL}/drafts/${draftId}`, {
        signal: controller.signal
      });

      console.log('📡 [POLL] Response received, status:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('📥 [POLL] Draft data received', {
          status: data.status,
          currentRound: data.currentRound,
          boostersCount: data.boosters?.length || 0
        });

        // Update cache
        localStorage.setItem(`draft_${draftId}_data`, JSON.stringify(data));
        localStorage.setItem(`draft_${draftId}_timestamp`, Date.now().toString());

        setDraft(data);
        setLoading(false);

        // If draft is completed, could show final deck
        if (data.status === 'completed') {
          console.log('🏁 [POLL] Draft completed');
          // Handle completion
        }
      } else {
        console.error('❌ [POLL] Bad response:', response.status);
        setLoading(false);
      }
    } catch (err) {
      if (err.name === 'AbortError') {
        console.log('🚫 [POLL] Fetch cancelled');
      } else {
        console.error('❌ [POLL] Error fetching draft:', err);
        // Only show error if we don't have cached data
        if (!cachedDraft) {
          setError('Connection error');
        }
        setLoading(false);
      }
    }
  };

  const updatePlayerView = () => {
    console.log('🔄 [updatePlayerView] Called', {
      hasDraft: !!draft,
      hasPlayerId: !!playerId,
      isPicking,
      currentBoosterLength: currentBooster.length
    });

    if (!draft || !playerId) return;

    // Find current player
    const player = draft.players.find(p => p.id === playerId);
    if (!player) {
      // Try to find by name in localStorage
      const playerName = localStorage.getItem(`draft_${draftId}_playerName`);
      const foundPlayer = draft.players.find(p => p.name === playerName);
      if (foundPlayer) {
        setPlayerId(foundPlayer.id);
        localStorage.setItem(`draft_${draftId}_playerId`, foundPlayer.id);
        setPickedCards(foundPlayer.pickedCards || []);
        return;
      }
      setError('Player not found in this draft');
      return;
    }

    setPickedCards(player.pickedCards || []);

    // Find player's current booster
    const playerIndex = draft.players.findIndex(p => p.id === playerId);
    const booster = findPlayerBooster(draft, playerIndex);

    console.log('📦 [updatePlayerView] Booster found:', {
      playerIndex,
      boosterCards: booster ? booster.cards.length : 0,
      cardNames: booster ? booster.cards.map(c => c.name).join(', ') : 'none',
      isPicking
    });

    if (booster) {
      console.log('✅ [updatePlayerView] Setting booster with', booster.cards.length, 'cards');
      setCurrentBooster(booster.cards || []);
    } else if (!isPicking) {
      console.log('⚠️ [updatePlayerView] No booster found, clearing');
      // Only clear booster if we're not currently picking (prevents flicker)
      setCurrentBooster([]);
    }
  };

  const findPlayerBooster = (draft, playerIndex) => {
    const totalPlayers = draft.players.length;
    const direction = draft.direction === 'left' ? 1 : -1;

    for (let i = 0; i < draft.boosters.length; i++) {
      const booster = draft.boosters[i];
      const boosterOwner = (i + draft.currentRound - 1) % totalPlayers;
      // Use proper modulo to handle negative numbers
      const currentPosition = ((boosterOwner + direction * (booster.currentPlayerIndex || 0)) % totalPlayers + totalPlayers) % totalPlayers;

      if (currentPosition === playerIndex) {
        return booster;
      }
    }

    return null;
  };

  const handleCardPick = async (cardId) => {
    const pickedCardName = currentBooster.find(c => c._id === cardId)?.name;
    console.log('👆 [PICK START]', pickedCardName, {
      cardId,
      currentBoosterLength: currentBooster.length,
      isPicking
    });

    if (!playerId || !cardId || isPicking) {
      console.log('❌ [PICK BLOCKED] Already picking or invalid');
      return;
    }

    // Cancel any in-flight polling to prevent stale data from overwriting
    if (abortControllerRef.current) {
      console.log('🚫 [PICK] Cancelling in-flight polls');
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }

    // Immediately hide booster (via isPicking) to prevent clicks on old cards
    console.log('🚫 [PICK] Setting isPicking=true, hiding booster');
    flushSync(() => {
      setIsPicking(true);
      setError('');
      setTimeRemaining(null);
    });
    console.log('✅ [PICK] Booster hidden, sending request');

    try {
      const response = await fetch(`${API_BASE_URL}/drafts/${draftId}/pick`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerId, cardId })
      });

      console.log('📨 [PICK] Server response received');

      if (response.ok) {
        const data = await response.json();
        const player = data.players.find(p => p.id === playerId);

        if (player) {
          const playerIndex = data.players.findIndex(p => p.id === playerId);
          const booster = findPlayerBooster(data, playerIndex);

          console.log('📦 [PICK] New booster found:', {
            newBoosterCards: booster ? booster.cards.length : 0,
            newCardNames: booster ? booster.cards.map(c => c.name).slice(0, 5).join(', ') : 'none',
            totalPicked: player.pickedCards.length
          });

          // Skip the next useEffect update to prevent duplicate render
          skipNextUpdateRef.current = true;

          console.log('🔄 [PICK] Updating states with flushSync');
          // Force synchronous update to show new booster immediately
          flushSync(() => {
            setPickedCards(player.pickedCards || []);
            setCurrentBooster(booster ? booster.cards || [] : []);
            setDraft(data);
            setIsPicking(false);
          });
          console.log('✅ [PICK COMPLETE] New booster set, isPicking=false');
        }
      } else {
        const data = await response.json();
        console.error('❌ [PICK ERROR]', data.message);
        setError(data.message || 'Failed to pick card');
        setIsPicking(false);
      }
    } catch (err) {
      console.error('❌ [PICK EXCEPTION]', err);
      setError('Connection error');
      setIsPicking(false);
    }
  };

  const autoPickCard = () => {
    if (currentBooster.length === 0 || isPicking) return;

    // Pick a random card from the current booster
    const randomCard = currentBooster[Math.floor(Math.random() * currentBooster.length)];
    handleCardPick(randomCard._id);
  };

  // Deck builder functions
  const groupCardsByName = (cards) => {
    const groups = {};
    cards.forEach((card, index) => {
      const key = card.name || card._id;
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push({ ...card, originalIndex: index });
    });
    return Object.values(groups);
  };

  const updateDeck = async (newDeck, newSideboard) => {
    try {
      await fetch(`${API_BASE_URL}/drafts/${draftId}/update-deck`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          playerId,
          deck: newDeck.map(c => c._id),
          sideboard: newSideboard.map(c => c._id)
        })
      });
      setLastSaved(new Date());
      console.log('💾 Deck saved automatically');
    } catch (err) {
      console.error('Error saving deck:', err);
      setError('Failed to save deck');
    }
  };

  const moveToDeck = (cardIndex) => {
    if (cardIndex < 0 || cardIndex >= sideboard.length) return;

    const sideboardCard = sideboard[cardIndex];
    const newSideboard = [
      ...sideboard.slice(0, cardIndex),
      ...sideboard.slice(cardIndex + 1)
    ];
    const newDeck = [...deck, sideboardCard];

    setSideboard(newSideboard);
    setDeck(newDeck);
    updateDeck(newDeck, newSideboard);
  };

  const moveToSideboard = (cardIndex) => {
    if (cardIndex < 0 || cardIndex >= deck.length) return;

    const deckCard = deck[cardIndex];
    const newDeck = [
      ...deck.slice(0, cardIndex),
      ...deck.slice(cardIndex + 1)
    ];
    const newSideboard = [...sideboard, deckCard];

    setDeck(newDeck);
    setSideboard(newSideboard);
    updateDeck(newDeck, newSideboard);
  };

  const exportDeckAsTxt = () => {
    // Count cards by name
    const countCards = (cards) => {
      const counts = {};
      cards.forEach(card => {
        const name = card.name || 'Unknown Card';
        counts[name] = (counts[name] || 0) + 1;
      });
      return counts;
    };

    const deckCounts = countCards(deck);
    const sideboardCounts = countCards(sideboard);

    // Format deck list
    let txtContent = '=== Chess Magic Draft Deck ===\n\n';

    // Player info
    const player = draft?.players?.find(p => p.id === playerId);
    if (player) {
      txtContent += `Player: ${player.name}\n`;
    }
    txtContent += `Date: ${new Date().toLocaleDateString()}\n`;
    txtContent += `Draft Type: ${draft?.draftType === 'set' ? 'Set Draft' : 'Cube Draft'}\n\n`;

    // Main deck
    txtContent += `DECK (${deck.length} cards):\n`;
    txtContent += '─'.repeat(40) + '\n';
    Object.entries(deckCounts).sort().forEach(([name, count]) => {
      txtContent += `${count}x ${name}\n`;
    });

    // Sideboard
    txtContent += `\n\nSIDEBOARD (${sideboard.length} cards):\n`;
    txtContent += '─'.repeat(40) + '\n';
    Object.entries(sideboardCounts).sort().forEach(([name, count]) => {
      txtContent += `${count}x ${name}\n`;
    });

    txtContent += `\n\nTotal Cards: ${deck.length + sideboard.length}\n`;

    // Create download
    const blob = new Blob([txtContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `chess-magic-draft-${player?.name || 'deck'}-${Date.now()}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleDebugPick45 = async () => {
    if (!playerId || isPicking) return;

    const confirmed = window.confirm('DEBUG: Pick 45 random cards and complete draft?');
    if (!confirmed) return;

    console.log('🔧 [DEBUG] Picking 45 cards instantly');
    setIsPicking(true);
    setError('');

    try {
      const response = await fetch(`${API_BASE_URL}/drafts/${draftId}/debug-pick-45`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerId })
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ [DEBUG] Got 45 cards, draft completed');

        // Update draft state
        setDraft(data);
        setPickedCards(data.players.find(p => p.id === playerId)?.pickedCards || []);
        setCurrentBooster([]);
        setIsPicking(false);
      } else {
        const data = await response.json();
        console.error('❌ [DEBUG ERROR]', data.message);
        setError(data.message || 'Debug pick failed');
        setIsPicking(false);
      }
    } catch (err) {
      console.error('❌ [DEBUG EXCEPTION]', err);
      setError('Connection error');
      setIsPicking(false);
    }
  };

  const renderManaCost = (manaCost) => {
    if (!manaCost) return null;

    const symbols = manaCost.match(/\{[^}]+\}/g) || [];
    return (
      <div className="mana-cost">
        {symbols.map((symbol, index) => {
          const cleaned = symbol.replace(/[{}]/g, '');
          return (
            <span key={index} className={`mana-symbol mana-${cleaned.toLowerCase()}`}>
              {cleaned}
            </span>
          );
        })}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="draft-interface loading-screen">
        <div className="loading-spinner"></div>
        <p>Loading draft...</p>
      </div>
    );
  }

  if (!draft) {
    return (
      <div className="draft-interface error-screen">
        <p>Draft not found</p>
        <button onClick={onExit}>Exit</button>
      </div>
    );
  }

  if (draft.status === 'completed') {
    const sideboardGroups = groupCardsByName(sideboard);
    const deckGroups = groupCardsByName(deck);

    return (
      <div className="draft-interface deck-builder-screen">
        <div className="deck-builder-header">
          <h2>Build Your Deck</h2>
          <div className="deck-stats">
            <span>Deck: {deck.length}/40</span>
            <span>•</span>
            <span>Sideboard: {sideboard.length}</span>
            <span>•</span>
            <span>Total: {pickedCards.length} cards</span>
          </div>
        </div>

        <div className="deck-zones">
          <div className="deck-zone">
            <h3>Sideboard ({sideboard.length})</h3>
            {sideboardGroups.length > cardsPerPage && (
              <div className="zone-pagination zone-pagination-top">
                <button
                  className="page-btn"
                  onClick={() => setSideboardPage(prev => Math.max(1, prev - 1))}
                  disabled={sideboardPage === 1}
                >
                  ← Previous
                </button>
                <span className="page-info">
                  Page {sideboardPage} of {Math.ceil(sideboardGroups.length / cardsPerPage)}
                </span>
                <button
                  className="page-btn"
                  onClick={() => setSideboardPage(prev => Math.min(Math.ceil(sideboardGroups.length / cardsPerPage), prev + 1))}
                  disabled={sideboardPage === Math.ceil(sideboardGroups.length / cardsPerPage)}
                >
                  Next →
                </button>
              </div>
            )}
            <div className="zone-cards-grid">
              {sideboardGroups
                .slice((sideboardPage - 1) * cardsPerPage, sideboardPage * cardsPerPage)
                .map((cardGroup, groupIndex) => (
                  <div
                    key={`sb-group-${groupIndex}-${cardGroup[0]._id}`}
                    className="card-stack"
                    onClick={() => moveToDeck(cardGroup[cardGroup.length - 1].originalIndex)}
                  >
                    {cardGroup.map((card, index) => (
                      <div
                        key={`${card._id}-${index}`}
                        className="stacked-card"
                        style={{
                          position: index > 0 ? 'relative' : 'static',
                          top: index > 0 ? `${index * 4}px` : '0',
                          marginTop: index > 0 ? '-96%' : '0',
                          zIndex: index,
                          pointerEvents: 'none'
                        }}
                      >
                        {card.imageUrl ? (
                          <img src={card.imageUrl} alt={card.name} loading="lazy" decoding="async" />
                        ) : (
                          <div className="card-placeholder-small">{card.name}</div>
                        )}
                      </div>
                    ))}
                    {cardGroup.length > 1 && (
                      <div className="card-count-badge">{cardGroup.length}</div>
                    )}
                  </div>
                ))}
            </div>
          </div>

          <div className="deck-zone main-deck">
            <h3>Deck ({deck.length})</h3>
            {deckGroups.length > cardsPerPage && (
              <div className="zone-pagination zone-pagination-top">
                <button
                  className="page-btn"
                  onClick={() => setDeckPage(prev => Math.max(1, prev - 1))}
                  disabled={deckPage === 1}
                >
                  ← Previous
                </button>
                <span className="page-info">
                  Page {deckPage} of {Math.ceil(deckGroups.length / cardsPerPage)}
                </span>
                <button
                  className="page-btn"
                  onClick={() => setDeckPage(prev => Math.min(Math.ceil(deckGroups.length / cardsPerPage), prev + 1))}
                  disabled={deckPage === Math.ceil(deckGroups.length / cardsPerPage)}
                >
                  Next →
                </button>
              </div>
            )}
            <div className="zone-cards-grid">
              {deckGroups
                .slice((deckPage - 1) * cardsPerPage, deckPage * cardsPerPage)
                .map((cardGroup, groupIndex) => (
                  <div
                    key={`deck-group-${groupIndex}-${cardGroup[0]._id}`}
                    className="card-stack"
                    onClick={() => moveToSideboard(cardGroup[cardGroup.length - 1].originalIndex)}
                  >
                    {cardGroup.map((card, index) => (
                      <div
                        key={`${card._id}-${index}`}
                        className="stacked-card"
                        style={{
                          position: index > 0 ? 'relative' : 'static',
                          top: index > 0 ? `${index * 4}px` : '0',
                          marginTop: index > 0 ? '-96%' : '0',
                          zIndex: index,
                          pointerEvents: 'none'
                        }}
                      >
                        {card.imageUrl ? (
                          <img src={card.imageUrl} alt={card.name} loading="lazy" decoding="async" />
                        ) : (
                          <div className="card-placeholder-small">{card.name}</div>
                        )}
                      </div>
                    ))}
                    {cardGroup.length > 1 && (
                      <div className="card-count-badge">{cardGroup.length}</div>
                    )}
                  </div>
                ))}
            </div>
          </div>
        </div>

        <div className="deck-builder-controls">
          <div className="deck-status-row">
            {deck.length >= 40 && (
              <div className="deck-ready-message">✓ Deck ready ({deck.length} cards)</div>
            )}
            {deck.length < 40 && (
              <div className="deck-warning-message">Need {40 - deck.length} more cards for minimum deck size</div>
            )}
            {lastSaved && (
              <div className="deck-saved-message">
                💾 Saved {new Date(lastSaved).toLocaleTimeString()}
              </div>
            )}
          </div>
          <div className="deck-action-buttons">
            <button className="save-txt-btn" onClick={exportDeckAsTxt}>
              📄 Save as TXT
            </button>
            <button className="exit-btn" onClick={onExit}>
              Exit Draft
            </button>
          </div>
        </div>

        {error && <div className="error-banner">{error}</div>}
      </div>
    );
  }

  return (
    <div className="draft-interface">
      <div className="draft-header">
        <div className="draft-info">
          <h2>{draft.draftType === 'set' ? 'Set' : 'Cube'} Draft</h2>
          <div className="draft-stats">
            <span>Round {draft.currentRound}/{draft.totalRounds}</span>
            <span>•</span>
            <span>Picked: {pickedCards.length}</span>
            <span>•</span>
            <span className="direction-indicator">
              Passing {draft.direction === 'left' ? '←' : '→'}
            </span>
            <span>•</span>
            <span>Current Pack ({currentBooster.length} cards)</span>
          </div>
        </div>
        {(timeRemaining !== null || isPicking) && (
          <div className={`timer-display ${timeRemaining <= 10 ? 'timer-display-urgent' : timeRemaining <= 30 ? 'timer-display-warning' : ''}`}>
            <div className="timer-circle">
              <svg className="timer-svg" viewBox="0 0 100 100">
                <circle
                  className="timer-circle-bg"
                  cx="50"
                  cy="50"
                  r="45"
                />
                {!isPicking && (
                  <circle
                    className="timer-circle-progress"
                    cx="50"
                    cy="50"
                    r="45"
                    style={{
                      strokeDasharray: `${2 * Math.PI * 45}`,
                      strokeDashoffset: `${2 * Math.PI * 45 * (1 - timeRemaining / getTimeLimit(picksThisRound))}`
                    }}
                  />
                )}
              </svg>
              <div className="timer-text">
                {isPicking ? (
                  <span className="timer-number">...</span>
                ) : (
                  <>
                    <span className="timer-number">{timeRemaining}</span>
                    <span className="timer-label">sec</span>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
        {/* Debug button - only show for admin (seat 0) in development */}
        {process.env.NODE_ENV === 'development' && currentPlayer && currentPlayer.seatNumber === 0 && (
          <button
            className="exit-btn-small"
            onClick={handleDebugPick45}
            disabled={isPicking}
            style={{
              marginRight: '10px',
              backgroundColor: '#ff6b35',
              opacity: isPicking ? 0.5 : 1
            }}
          >
            🔧 Pick 45
          </button>
        )}
        <button className="exit-btn-small" onClick={onExit}>Exit</button>
      </div>

      {error && <div className="error-banner">{error}</div>}

      {/* Debug: Show bot picks - only in development */}
      {process.env.NODE_ENV === 'development' && draft && draft.players && (
        <div style={{ padding: '10px', background: '#1a1a1a', margin: '10px', borderRadius: '4px', fontSize: '12px', fontFamily: 'monospace' }}>
          <div style={{ marginBottom: '5px', fontWeight: 'bold', color: '#888' }}>Recent Picks (Debug):</div>
          {draft.players.map((player, idx) => {
            const lastPick = player.pickedCards && player.pickedCards.length > 0
              ? player.pickedCards[player.pickedCards.length - 1]
              : null;
            return (
              <div key={player.id} style={{ color: player.isBot ? '#4a9eff' : '#4eff4a', marginBottom: '2px' }}>
                {player.name}: {lastPick ? lastPick.name : 'No picks yet'} ({player.pickedCards?.length || 0} total)
              </div>
            );
          })}
        </div>
      )}

      <div className="draft-main">
        <div className="booster-section">
          {currentBooster.length > 0 && !isPicking ? (
            <div className="booster-grid">
              {currentBooster.map((card) => (
                <div
                  key={card._id}
                  className="draft-card"
                  onClick={() => handleCardPick(card._id)}
                  style={{ cursor: 'pointer' }}
                >
                  {card.imageUrl ? (
                    <img src={card.imageUrl} alt={card.name} loading="eager" decoding="async" />
                  ) : (
                    <div className="card-placeholder">
                      <p>{card.name}</p>
                      {renderManaCost(card.manaCost)}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="waiting-message">
              <p>⏳ Waiting for next pack...</p>
              <p className="waiting-subtext">Bots are making their picks</p>
            </div>
          )}
        </div>
      </div>

      <div className="picked-section">
        <h3>Your Picks ({pickedCards.length})</h3>
        <div className="picked-cards">
          {pickedCards.length > 0 ? (
            pickedCards.map((card, index) => (
              <div key={index} className="picked-card-mini">
                {card.imageUrl ? (
                  <img src={card.imageUrl} alt={card.name} loading="lazy" decoding="async" />
                ) : (
                  <div className="mini-placeholder">{card.name}</div>
                )}
              </div>
            ))
          ) : (
            <p className="no-picks">No cards picked yet</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default DraftInterface;
