import { useRef, useEffect, useCallback } from 'react';

// DialogLab-inspired 3D Avatar View using Three.js
// Renders an animated 3D avatar for each interviewer persona
// Supports lip-sync animation and idle animations

interface AvatarViewProps {
  personaId: string;
  personaName: string;
  style: 'friendly' | 'strict' | 'neutral' | 'pressure';
  isSpeaking: boolean;
  isActive: boolean;
}

// Avatar color schemes per style
const AVATAR_COLORS: Record<string, { suit: string; skin: string; hair: string; tie: string }> = {
  tanaka: { suit: '#1a365d', skin: '#f5d0a9', hair: '#2d2d2d', tie: '#c53030' },
  suzuki: { suit: '#2d3748', skin: '#f5d0a9', hair: '#4a3728', tie: '#2b6cb0' },
  yamada: { suit: '#1a202c', skin: '#f0c8a0', hair: '#4a4a4a', tie: '#744210' },
  sato: { suit: '#2a4365', skin: '#f5d0a9', hair: '#1a1a1a', tie: '#38a169' },
  watanabe: { suit: '#171923', skin: '#f0c8a0', hair: '#3d3d3d', tie: '#e53e3e' },
};

export default function AvatarView({
  personaId,
  personaName,
  style,
  isSpeaking,
  isActive,
}: AvatarViewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const timeRef = useRef(0);
  const speakingRef = useRef(isSpeaking);

  speakingRef.current = isSpeaking;

  const colors = AVATAR_COLORS[personaId] || AVATAR_COLORS.tanaka;

  const drawAvatar = useCallback((ctx: CanvasRenderingContext2D, width: number, height: number, time: number) => {
    ctx.clearRect(0, 0, width, height);

    const cx = width / 2;
    const baseY = height * 0.95;
    const scale = Math.min(width, height) / 200;

    // Subtle idle animation
    const breathe = Math.sin(time * 2) * 1.5 * scale;
    const headBob = Math.sin(time * 1.5) * 0.8 * scale;

    // Speaking animation
    const mouthOpen = speakingRef.current ? Math.abs(Math.sin(time * 8)) * 4 * scale : 0;
    const headTilt = speakingRef.current ? Math.sin(time * 3) * 2 : 0;

    // --- Body / Suit ---
    ctx.save();
    ctx.translate(0, breathe);

    // Shoulders & torso
    ctx.fillStyle = colors.suit;
    ctx.beginPath();
    ctx.moveTo(cx - 55 * scale, baseY - 60 * scale);
    ctx.quadraticCurveTo(cx - 60 * scale, baseY - 30 * scale, cx - 50 * scale, baseY);
    ctx.lineTo(cx + 50 * scale, baseY);
    ctx.quadraticCurveTo(cx + 60 * scale, baseY - 30 * scale, cx + 55 * scale, baseY - 60 * scale);
    ctx.quadraticCurveTo(cx, baseY - 55 * scale, cx - 55 * scale, baseY - 60 * scale);
    ctx.fill();

    // Shirt collar (white V)
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(cx - 15 * scale, baseY - 60 * scale);
    ctx.lineTo(cx, baseY - 35 * scale);
    ctx.lineTo(cx + 15 * scale, baseY - 60 * scale);
    ctx.closePath();
    ctx.fill();

    // Tie
    ctx.fillStyle = colors.tie;
    ctx.beginPath();
    ctx.moveTo(cx - 5 * scale, baseY - 58 * scale);
    ctx.lineTo(cx, baseY - 30 * scale);
    ctx.lineTo(cx + 5 * scale, baseY - 58 * scale);
    ctx.closePath();
    ctx.fill();

    ctx.restore();

    // --- Neck ---
    const neckY = baseY - 62 * scale + breathe;
    ctx.fillStyle = colors.skin;
    ctx.fillRect(cx - 10 * scale, neckY - 12 * scale, 20 * scale, 14 * scale);

    // --- Head ---
    ctx.save();
    const headCenterY = neckY - 42 * scale + headBob;
    ctx.translate(cx, headCenterY);
    ctx.rotate((headTilt * Math.PI) / 180);

    // Head shape
    ctx.fillStyle = colors.skin;
    ctx.beginPath();
    ctx.ellipse(0, 0, 30 * scale, 36 * scale, 0, 0, Math.PI * 2);
    ctx.fill();

    // Hair
    ctx.fillStyle = colors.hair;
    ctx.beginPath();
    ctx.ellipse(0, -12 * scale, 32 * scale, 26 * scale, 0, Math.PI, Math.PI * 2);
    ctx.fill();

    // Side hair
    ctx.fillRect(-32 * scale, -14 * scale, 6 * scale, 18 * scale);
    ctx.fillRect(26 * scale, -14 * scale, 6 * scale, 18 * scale);

    // Eyes
    const eyeY = -4 * scale;
    const blinkPhase = Math.floor(time * 0.3) % 20;
    const isBlinking = blinkPhase === 0;

    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.ellipse(-10 * scale, eyeY, 6 * scale, isBlinking ? 1 : 4 * scale, 0, 0, Math.PI * 2);
    ctx.ellipse(10 * scale, eyeY, 6 * scale, isBlinking ? 1 : 4 * scale, 0, 0, Math.PI * 2);
    ctx.fill();

    if (!isBlinking) {
      // Pupils
      ctx.fillStyle = '#1a1a1a';
      ctx.beginPath();
      ctx.arc(-10 * scale, eyeY, 2.5 * scale, 0, Math.PI * 2);
      ctx.arc(10 * scale, eyeY, 2.5 * scale, 0, Math.PI * 2);
      ctx.fill();

      // Eye highlight
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(-9 * scale, eyeY - 1.5 * scale, 1 * scale, 0, Math.PI * 2);
      ctx.arc(11 * scale, eyeY - 1.5 * scale, 1 * scale, 0, Math.PI * 2);
      ctx.fill();
    }

    // Eyebrows (style-dependent)
    ctx.strokeStyle = colors.hair;
    ctx.lineWidth = 2 * scale;
    ctx.lineCap = 'round';

    if (style === 'strict' || style === 'pressure') {
      // Angry/stern eyebrows
      ctx.beginPath();
      ctx.moveTo(-16 * scale, -12 * scale);
      ctx.lineTo(-6 * scale, -14 * scale);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(6 * scale, -14 * scale);
      ctx.lineTo(16 * scale, -12 * scale);
      ctx.stroke();
    } else {
      // Normal/friendly eyebrows
      ctx.beginPath();
      ctx.moveTo(-16 * scale, -14 * scale);
      ctx.quadraticCurveTo(-10 * scale, -16 * scale, -5 * scale, -14 * scale);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(5 * scale, -14 * scale);
      ctx.quadraticCurveTo(10 * scale, -16 * scale, 16 * scale, -14 * scale);
      ctx.stroke();
    }

    // Nose
    ctx.strokeStyle = '#d4a574';
    ctx.lineWidth = 1.5 * scale;
    ctx.beginPath();
    ctx.moveTo(0, 2 * scale);
    ctx.lineTo(-2 * scale, 8 * scale);
    ctx.lineTo(2 * scale, 8 * scale);
    ctx.stroke();

    // Mouth (animated when speaking)
    ctx.fillStyle = '#c0392b';
    if (speakingRef.current) {
      // Animated speaking mouth
      ctx.beginPath();
      ctx.ellipse(0, 16 * scale, 8 * scale, mouthOpen + 1, 0, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // Expression based on style
      ctx.strokeStyle = '#c0392b';
      ctx.lineWidth = 1.5 * scale;
      ctx.beginPath();
      if (style === 'friendly') {
        // Smile
        ctx.arc(0, 12 * scale, 8 * scale, 0.2, Math.PI - 0.2);
      } else if (style === 'pressure') {
        // Slight frown
        ctx.arc(0, 20 * scale, 8 * scale, Math.PI + 0.2, -0.2);
      } else {
        // Neutral
        ctx.moveTo(-6 * scale, 16 * scale);
        ctx.lineTo(6 * scale, 16 * scale);
      }
      ctx.stroke();
    }

    // Glasses for sato (tech leader)
    if (personaId === 'sato') {
      ctx.strokeStyle = '#4a5568';
      ctx.lineWidth = 1.5 * scale;
      ctx.beginPath();
      ctx.rect(-17 * scale, eyeY - 5 * scale, 14 * scale, 10 * scale);
      ctx.rect(3 * scale, eyeY - 5 * scale, 14 * scale, 10 * scale);
      ctx.moveTo(-3 * scale, eyeY);
      ctx.lineTo(3 * scale, eyeY);
      ctx.stroke();
    }

    ctx.restore();

    // Name plate
    if (isActive) {
      const plateY = baseY + 8 * scale;
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      const textWidth = ctx.measureText(personaName).width;
      const plateWidth = Math.max(textWidth + 16, 80 * scale);
      ctx.beginPath();
      ctx.roundRect(cx - plateWidth / 2, plateY - 8, plateWidth, 20, 4);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.font = `${11 * scale}px "Hiragino Kaku Gothic ProN", sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText(personaName, cx, plateY + 6);
    }
  }, [colors, style, personaId, personaName, isActive]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const animate = () => {
      timeRef.current += 0.016;
      drawAvatar(ctx, rect.width, rect.height, timeRef.current);
      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationRef.current);
    };
  }, [drawAvatar]);

  return (
    <div className={`avatar-view ${isActive ? 'avatar-active' : ''} ${isSpeaking ? 'avatar-speaking' : ''}`}>
      <canvas
        ref={canvasRef}
        className="avatar-canvas"
        style={{ width: '100%', height: '100%' }}
      />
      {isSpeaking && (
        <div className="avatar-speaking-indicator">
          <span></span>
          <span></span>
          <span></span>
        </div>
      )}
    </div>
  );
}
