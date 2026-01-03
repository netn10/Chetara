const fs = require('fs');

const mtgPackCSS = `
/* AUTHENTIC MTG BOOSTER PACK - 200% REAL */

.booster-pack {
  width: 280px !important;
  height: 440px !important;
  border-radius: 6px !important;
  background: radial-gradient(ellipse at 30% 40%, rgba(139, 90, 60, 0.15) 0%, transparent 50%),
              radial-gradient(ellipse at 70% 60%, rgba(90, 125, 107, 0.12) 0%, transparent 50%),
              linear-gradient(180deg, #0a0a0a 0%, #121212 50%, #0a0a0a 100%) !important;
  border: 1px solid rgba(40, 40, 40, 0.9) !important;
  box-shadow: 0 30px 60px rgba(0, 0, 0, 0.9),
              inset 1px 1px 0 rgba(255, 255, 255, 0.08),
              inset -1px -1px 0 rgba(0, 0, 0, 0.8),
              0 0 40px rgba(201, 169, 97, 0.1) !important;
}

.booster-pack::before {
  background-image: repeating-linear-gradient(45deg, transparent 0px, rgba(255, 100, 150, 0.12) 1px, transparent 2px, transparent 6px, rgba(100, 200, 255, 0.15) 7px, transparent 8px, transparent 12px, rgba(255, 220, 100, 0.13) 13px, transparent 14px, transparent 18px, rgba(150, 100, 255, 0.11) 19px, transparent 20px),
                    repeating-linear-gradient(-45deg, transparent 0px, rgba(100, 255, 200, 0.11) 1px, transparent 2px, transparent 6px, rgba(255, 150, 100, 0.14) 7px, transparent 8px, transparent 12px, rgba(200, 100, 255, 0.12) 13px, transparent 14px, transparent 18px, rgba(255, 255, 100, 0.10) 19px, transparent 20px),
                    linear-gradient(125deg, transparent 0%, transparent 20%, rgba(255, 50, 100, 0.08) 25%, rgba(100, 150, 255, 0.12) 35%, rgba(255, 200, 50, 0.15) 45%, rgba(150, 50, 255, 0.11) 50%, rgba(50, 255, 150, 0.09) 60%, rgba(255, 100, 200, 0.13) 70%, transparent 75%, transparent 100%) !important;
  animation: mtgFoilShift 6s ease-in-out infinite !important;
  opacity: 0.85 !important;
}

@keyframes mtgFoilShift {
  0% { background-position: 0% 0%, 0% 0%, -100% 0%; }
  50% { background-position: 100% 100%, -100% -100%, 200% 100%; }
  100% { background-position: 0% 0%, 0% 0%, -100% 0%; }
}

.pack-content::before {
  height: 28px !important;
  background: repeating-linear-gradient(90deg, #1a1a1a 0px, #2a2a2a 2px, #1a1a1a 4px),
              linear-gradient(180deg, rgba(201, 169, 97, 0.3) 0%, rgba(60, 60, 60, 0.8) 30%, rgba(40, 40, 40, 0.9) 70%, rgba(20, 20, 20, 0.95) 100%) !important;
  background-size: 4px 100%, 100% 100% !important;
}

.pack-shine {
  display: block !important;
  position: absolute !important;
  bottom: -3px !important;
  left: -3px !important;
  right: -3px !important;
  height: 28px !important;
  background: repeating-linear-gradient(90deg, #1a1a1a 0px, #2a2a2a 2px, #1a1a1a 4px),
              linear-gradient(0deg, rgba(201, 169, 97, 0.3) 0%, rgba(60, 60, 60, 0.8) 30%, rgba(40, 40, 40, 0.9) 70%, rgba(20, 20, 20, 0.95) 100%) !important;
  box-shadow: 0 -2px 4px rgba(0, 0, 0, 0.8),
              inset 0 -1px 0 rgba(255, 255, 255, 0.1),
              inset 0 1px 0 rgba(0, 0, 0, 0.6) !important;
  border-top: 1px solid rgba(0, 0, 0, 0.5) !important;
  z-index: 15 !important;
  background-size: 4px 100%, 100% 100% !important;
}

.pack-title {
  font-size: 2rem !important;
  background: linear-gradient(180deg, #ffffff 0%, #e8e8e8 30%, #d0d0d0 70%, #c0c0c0 100%) !important;
  -webkit-background-clip: text !important;
  -webkit-text-fill-color: transparent !important;
  background-clip: text !important;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.9)) !important;
  -webkit-text-stroke: 0.5px rgba(201, 169, 97, 0.3) !important;
}

.pack-count {
  background: linear-gradient(135deg, #d4a574 0%, #f0d9b5 25%, #d4a574 50%, #c9a961 75%, #d4a574 100%) !important;
  border-radius: 4px !important;
}

.pack-glint {
  display: block !important;
  position: absolute !important;
  top: -100% !important;
  left: -100% !important;
  width: 300% !important;
  height: 300% !important;
  background: linear-gradient(135deg, transparent 30%, rgba(255, 255, 255, 0.1) 45%, rgba(255, 255, 255, 0.2) 50%, rgba(255, 255, 255, 0.1) 55%, transparent 70%) !important;
  pointer-events: none !important;
  z-index: 20 !important;
}

.booster-pack:hover .pack-glint {
  animation: glintSweep 2s ease-in-out infinite !important;
}

@keyframes glintSweep {
  0% { opacity: 0; transform: translateX(-50%) translateY(-50%) rotate(-45deg); }
  10% { opacity: 1; }
  90% { opacity: 1; }
  100% { opacity: 0; transform: translateX(50%) translateY(50%) rotate(-45deg); }
}

.booster-pack:hover {
  transform: translateY(-20px) rotateX(12deg) rotateY(-8deg) scale(1.02) !important;
}
`;

fs.appendFileSync('src/pages/Home.css', mtgPackCSS);
console.log('✓ Applied 200% authentic MTG booster pack styling');
