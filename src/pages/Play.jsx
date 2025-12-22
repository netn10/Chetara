import React from 'react';
import ChessBoard from '../components/ChessBoard';
import './Play.css';

function Play() {
    return (
        <div className="play-page">
            <div className="play-header">
                <h1>Chess Magic - Play</h1>
                <p>Link cards to chess pieces and play!</p>
            </div>
            <ChessBoard />
        </div>
    );
}

export default Play;