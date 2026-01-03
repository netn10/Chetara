// 3D Card Mouse Tracking Effect
export const add3DCardEffect = () => {
  const cards = document.querySelectorAll('.floating-card');

  const handleMouseMove = (e, card) => {
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotateX = ((y - centerY) / centerY) * -15;
    const rotateY = ((x - centerX) / centerX) * 15;

    card.style.transform = `perspective(1500px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateZ(30px)`;
  };

  const handleMouseLeave = (card) => {
    card.style.transform = '';
  };

  cards.forEach(card => {
    const moveHandler = (e) => handleMouseMove(e, card);
    const leaveHandler = () => handleMouseLeave(card);

    card.addEventListener('mousemove', moveHandler);
    card.addEventListener('mouseleave', leaveHandler);

    card._moveHandler = moveHandler;
    card._leaveHandler = leaveHandler;
  });

  return () => {
    cards.forEach(card => {
      if (card._moveHandler) card.removeEventListener('mousemove', card._moveHandler);
      if (card._leaveHandler) card.removeEventListener('mouseleave', card._leaveHandler);
    });
  };
};
