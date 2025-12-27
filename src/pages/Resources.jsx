import React from 'react';
import './Resources.css';

const Resources = () => {
  return (
    <div className="resources-page">
      <div className="resources-container">
        <h1 className="resources-title">Resources</h1>

        <div className="resources-grid">
          {/* All Cards PDF */}
          <div className="resource-card">
            <div className="resource-icon pdf-icon">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M14 2H6C4.9 2 4 2.9 4 4V20C4 21.1 4.9 22 6 22H18C19.1 22 20 21.1 20 20V8L14 2Z" fill="#EF4444"/>
                <path d="M14 2V8H20" fill="#DC2626"/>
                <path d="M8 12H16M8 16H13" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </div>

            <h2 className="resource-title">All Cards PDF</h2>

            <p className="resource-description">
              Download a complete PDF containing images of all cards in the cube.
            </p>

            <a
              href="/downloads/all-cards.pdf"
              className="resource-button cards-button"
              download
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M14 2H6C4.9 2 4 2.9 4 4V20C4 21.1 4.9 22 6 22H18C19.1 22 20 21.1 20 20V8L14 2Z" fill="currentColor"/>
                <path d="M14 2V8H20" fill="currentColor" opacity="0.7"/>
              </svg>
              Download Cards PDF
            </a>
          </div>

          {/* Printable Archetypes */}
          <div className="resource-card">
            <div className="resource-icon archetypes-icon">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="3" y="5" width="18" height="4" rx="1" fill="#8B5CF6"/>
                <rect x="3" y="10" width="18" height="4" rx="1" fill="#A78BFA"/>
                <rect x="3" y="15" width="18" height="4" rx="1" fill="#C4B5FD"/>
              </svg>
            </div>

            <h2 className="resource-title">Printable Archetypes Printout</h2>

            <p className="resource-description">
              An easy way to reference all the archetypes in the cube.
            </p>

            <a
              href="/archetypes-printout"
              className="resource-button archetypes-button"
              target="_blank"
              rel="noopener noreferrer"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M14 3V7C14 7.6 14.4 8 15 8H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                <path d="M17 21H7C5.9 21 5 20.1 5 19V5C5 3.9 5.9 3 7 3H14L19 8V19C19 20.1 18.1 21 17 21Z" stroke="currentColor" strokeWidth="2"/>
                <path d="M9 15L12 12M12 12L15 9M12 12L9 9M12 12L15 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              View Archetypes Printout
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Resources;
