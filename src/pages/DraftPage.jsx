import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DraftInterface from '../components/DraftInterface';

function DraftPage() {
  const { draftId } = useParams();
  const navigate = useNavigate();

  const handleExitDraft = () => {
    // Clean up ALL draft and play-related localStorage
    localStorage.removeItem(`draft_${draftId}_playerId`);
    localStorage.removeItem(`draft_${draftId}_playerName`);

    // Clear play state
    localStorage.removeItem('play_selectedMode');
    localStorage.removeItem('play_draftType');
    localStorage.removeItem('play_showDraftLobby');

    // Clear lobby state (both set and cube)
    localStorage.removeItem('lobby_set_draftId');
    localStorage.removeItem('lobby_set_playerName');
    localStorage.removeItem('lobby_cube_draftId');
    localStorage.removeItem('lobby_cube_playerName');

    // Navigate back to play page
    navigate('/play');
  };

  return (
    <div className="play-page">
      <DraftInterface draftId={draftId} onExit={handleExitDraft} />
    </div>
  );
}

export default DraftPage;
