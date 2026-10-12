import { BeeParticle } from '../types';

export interface BeeConfig {
  x: number;
  y: number;
  answer: string;
  isCorrect: boolean;
  minX: number;
  maxX: number;
  sizeMultiplier?: number;
  speedMultiplier?: number;
}

/**
 * Universal cross-browser rounded rectangle drawer
 */
export function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  radius: number
) {
  if (typeof ctx.roundRect === 'function') {
    ctx.roundRect(x, y, w, h, radius);
  } else {
    const r = Math.min(radius, Math.abs(w) / 2, Math.abs(h) / 2);
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }
}

export class BeeCharacter {
  public x: number;
  public y: number;
  public vx: number;
  public vy: number;
  public minX: number;
  public maxX: number;
  public radius: number;
  public answer: string;
  public isCorrect: boolean;

  // Animation states
  public hoverProgress: number = 0;
  public isHovered: boolean = false;
  public isDead: boolean = false;
  public isDizzy: boolean = false;
  public dizzyTimer: number = 0;

  // Visual dynamics
  public scale: number = 1;
  public squashX: number = 1;
  public squashY: number = 1;
  public angle: number = 0;
  public flutterPhase: number;
  public bobPhase: number;
  public blinkTimer: number = 0;
  public isBlinking: boolean = false;

  // Settings multipliers
  public sizeMultiplier: number;
  public speedMultiplier: number;

  // Particle dust trail
  public particles: BeeParticle[] = [];

  constructor(config: BeeConfig, screenWidth: number, screenHeight: number) {
    this.x = config.x;
    this.y = config.y;
    this.minX = config.minX;
    this.maxX = config.maxX;
    this.answer = String(config.answer ?? '');
    this.isCorrect = config.isCorrect;
    this.sizeMultiplier = config.sizeMultiplier || 1.0;
    this.speedMultiplier = config.speedMultiplier || 1.0;

    const baseSize = Math.min(screenWidth, screenHeight);
    const standardRadius = Math.max(45, Math.min(baseSize * 0.08, 65));
    this.radius = standardRadius * this.sizeMultiplier;

    // Initial velocity modulated by speedMultiplier
    const baseSpeed = 45 * this.speedMultiplier;
    const randAngle = Math.random() * Math.PI * 2;
    this.vx = Math.cos(randAngle) * baseSpeed;
    this.vy = Math.sin(randAngle) * baseSpeed;

    this.flutterPhase = Math.random() * 50;
    this.bobPhase = Math.random() * Math.PI * 2;
    this.blinkTimer = Math.random() * 3 + 2;
  }

  public update(dt: number, screenHeight: number) {
    if (this.isDead) return;

    // Handle Dizzy State
    if (this.isDizzy) {
      this.dizzyTimer -= dt;
      if (this.dizzyTimer <= 0) {
        this.isDizzy = false;
      }
    }

    // Blinking eye loop
    this.blinkTimer -= dt;
    if (this.blinkTimer <= 0) {
      this.isBlinking = !this.isBlinking;
      this.blinkTimer = this.isBlinking ? 0.14 : (Math.random() * 3.5 + 2.5);
    }

    // Organic floating, bobbing & wing flapping
    this.bobPhase += dt * 3.2;
    const wingSpeed = this.isHovered ? 42 : (this.isDizzy ? 8 : (24 * Math.max(0.7, this.speedMultiplier)));
    this.flutterPhase += dt * wingSpeed;

    // Organic gentle swaying
    const swayFactor = Math.max(0.6, this.speedMultiplier);
    const bobX = Math.sin(this.bobPhase * 1.5) * (18 * swayFactor) * dt;
    const bobY = Math.cos(this.bobPhase * 2.2) * (22 * swayFactor) * dt;

    if (!this.isDizzy) {
      this.x += (this.vx * dt) + bobX;
      this.y += (this.vy * dt) + bobY;
    } else {
      // Shiver in place when dizzy
      this.x += (Math.random() - 0.5) * 5;
      this.y += (Math.random() - 0.5) * 5;
    }

    // Gentle banking tilt according to horizontal velocity
    const targetAngle = (this.vx * 0.003) + Math.sin(this.bobPhase) * 0.08;
    this.angle += (targetAngle - this.angle) * 0.12;

    // Bounce off walls with margin
    const margin = this.radius * 1.2;
    if (this.x < this.minX + margin) {
      this.x = this.minX + margin;
      this.vx = Math.abs(this.vx);
    } else if (this.x > this.maxX - margin) {
      this.x = this.maxX - margin;
      this.vx = -Math.abs(this.vx);
    }

    // Keep below HUD question bar and above bottom
    const topMargin = Math.max(130, screenHeight * 0.2);
    const bottomMargin = screenHeight - margin - 40;

    if (this.y < topMargin) {
      this.y = topMargin;
      this.vy = Math.abs(this.vy);
    } else if (this.y > bottomMargin) {
      this.y = bottomMargin;
      this.vy = -Math.abs(this.vy);
    }

    // Emit gentle glowing pollen & golden dust trails
    if (Math.random() < 0.4 && !this.isDizzy) {
      this.particles.push({
        x: this.x + (Math.random() - 0.5) * (this.radius * 0.4),
        y: this.y + (Math.random() - 0.5) * (this.radius * 0.3) + (this.radius * 0.2),
        vx: (Math.random() - 0.5) * 16,
        vy: Math.random() * 18 + 6,
        size: Math.random() * 4 + 2,
        alpha: 0.85,
        life: 0.55,
        maxLife: 0.55,
        color: Math.random() > 0.4 ? '#FDE047' : '#F59E0B',
      });
    }

    // Update trail particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.alpha = Math.max(0, p.life / p.maxLife);
      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }
  }

  public draw(ctx: CanvasRenderingContext2D) {
    if (this.isDead) return;

    // 1. Draw particle dust trail behind bee
    for (const p of this.particles) {
      ctx.save();
      ctx.globalAlpha = p.alpha;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // ROOT TRANSFORM FOR BEE CHARACTER
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.scale(this.scale * this.squashX, this.scale * this.squashY);
    ctx.rotate(this.angle);

    const r = this.radius;

    // 2. CIRCULAR HOVER CHARGE NECTAR RING
    if (this.hoverProgress > 0) {
      ctx.save();
      const progress = Math.min(1, this.hoverProgress);

      // Outer glow circle
      ctx.beginPath();
      ctx.arc(0, 0, r * 1.55, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(251, 191, 36, 0.35)';
      ctx.lineWidth = 10;
      ctx.stroke();

      // Active charging ring
      ctx.beginPath();
      const startAngle = -Math.PI / 2;
      const endAngle = startAngle + Math.PI * 2 * progress;
      ctx.arc(0, 0, r * 1.55, startAngle, endAngle);
      ctx.strokeStyle = '#FBBF24';
      ctx.lineWidth = 12;
      ctx.lineCap = 'round';
      ctx.shadowColor = '#F59E0B';
      ctx.shadowBlur = 15;
      ctx.stroke();

      // Sparkler tip
      const tipX = Math.cos(endAngle) * (r * 1.55);
      const tipY = Math.sin(endAngle) * (r * 1.55);
      ctx.beginPath();
      ctx.arc(tipX, tipY, 7, 0, Math.PI * 2);
      ctx.fillStyle = '#FFFFFF';
      ctx.shadowColor = '#FFFFFF';
      ctx.shadowBlur = 12;
      ctx.fill();

      ctx.restore();
    }

    // 3. SOFT SHADOW UNDER BEE
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(0, r * 1.25, r * 0.75, r * 0.2, 0, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(15, 23, 42, 0.22)';
    ctx.fill();
    ctx.restore();

    // 4. FAIRY TRANSLUCENT WINGS WITH DELICATE VEINS
    const wingFlap = Math.sin(this.flutterPhase) * 0.45;
    const wingPairs = [
      { isLeft: true, isTop: true },
      { isLeft: false, isTop: true },
      { isLeft: true, isTop: false },
      { isLeft: false, isTop: false },
    ];

    for (const { isLeft, isTop } of wingPairs) {
      ctx.save();
      const sideMult = isLeft ? -1 : 1;
      const rootX = sideMult * (r * 0.28);
      const rootY = isTop ? -r * 0.22 : -r * 0.05;

      ctx.translate(rootX, rootY);
      const baseAngle = isTop ? (sideMult * -0.35) : (sideMult * 0.3);
      const dynamicFlap = isLeft ? -wingFlap : wingFlap;
      ctx.rotate(baseAngle + dynamicFlap);

      const wingWidth = isTop ? r * 0.95 : r * 0.75;
      const wingHeight = isTop ? r * 0.45 : r * 0.35;

      // Wing body gradient (iridescent fairy blue/gold)
      const wingGrad = ctx.createLinearGradient(0, 0, sideMult * wingWidth, 0);
      wingGrad.addColorStop(0, 'rgba(255, 255, 255, 0.95)');
      wingGrad.addColorStop(0.5, 'rgba(186, 230, 253, 0.75)');
      wingGrad.addColorStop(1, 'rgba(253, 230, 138, 0.5)');

      ctx.beginPath();
      ctx.ellipse(sideMult * wingWidth * 0.55, 0, wingWidth * 0.55, wingHeight * 0.5, 0, 0, Math.PI * 2);
      ctx.fillStyle = wingGrad;
      ctx.fill();

      ctx.strokeStyle = 'rgba(255, 255, 255, 0.95)';
      ctx.lineWidth = 2.5;
      ctx.stroke();

      // Wing veins
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.quadraticCurveTo(sideMult * wingWidth * 0.35, -wingHeight * 0.2, sideMult * wingWidth * 0.8, -wingHeight * 0.1);
      ctx.moveTo(0, 0);
      ctx.quadraticCurveTo(sideMult * wingWidth * 0.4, wingHeight * 0.15, sideMult * wingWidth * 0.75, wingHeight * 0.1);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
      ctx.lineWidth = 1.3;
      ctx.stroke();

      ctx.restore();
    }

    // 5. CUTE WIGGLING TAIL STINGER
    ctx.save();
    const stingerWiggle = Math.sin(this.bobPhase * 4) * 0.14;
    ctx.translate(0, r * 0.85);
    ctx.rotate(stingerWiggle);
    ctx.beginPath();
    ctx.moveTo(-r * 0.1, 0);
    ctx.lineTo(r * 0.1, 0);
    ctx.lineTo(0, r * 0.28);
    ctx.closePath();
    ctx.fillStyle = '#1E293B';
    ctx.fill();
    ctx.restore();

    // 6. CHUBBY PLUMP HONEY BODY WITH GRADIENT
    ctx.save();
    const bodyGrad = ctx.createLinearGradient(0, -r * 0.8, 0, r * 0.9);
    bodyGrad.addColorStop(0, '#FDE047'); // Warm radiant yellow
    bodyGrad.addColorStop(0.4, '#FBBF24'); // Honey amber
    bodyGrad.addColorStop(1, '#D97706'); // Deep golden amber

    ctx.beginPath();
    ctx.ellipse(0, r * 0.08, r * 0.68, r * 0.82, 0, 0, Math.PI * 2);
    ctx.fillStyle = bodyGrad;
    ctx.fill();
    ctx.strokeStyle = '#78350F';
    ctx.lineWidth = 3.5;
    ctx.stroke();
    ctx.restore();

    // 7. VELVETY CURVED ESPRESSO STRIPES
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(0, r * 0.08, r * 0.68, r * 0.82, 0, 0, Math.PI * 2);
    ctx.clip();

    ctx.fillStyle = '#291804'; // Deep velvety espresso brown

    // Stripe 1 (Middle-top)
    ctx.beginPath();
    ctx.ellipse(0, -r * 0.05, r * 0.85, r * 0.22, 0, 0, Math.PI * 2);
    ctx.fill();

    // Stripe 2 (Lower)
    ctx.beginPath();
    ctx.ellipse(0, r * 0.38, r * 0.8, r * 0.22, 0, 0, Math.PI * 2);
    ctx.fill();

    // Glossy rim highlight
    const glossGrad = ctx.createLinearGradient(0, -r * 0.8, 0, -r * 0.2);
    glossGrad.addColorStop(0, 'rgba(255, 255, 255, 0.7)');
    glossGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.beginPath();
    ctx.ellipse(-r * 0.15, -r * 0.45, r * 0.42, r * 0.2, -0.2, 0, Math.PI * 2);
    ctx.fillStyle = glossGrad;
    ctx.fill();

    ctx.restore(); // End stripes clip

    // 8. FLUFFY FLEECE NECK COLLAR
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(0, -r * 0.35, r * 0.52, r * 0.14, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#FEF08A';
    ctx.fill();
    ctx.strokeStyle = '#F59E0B';
    ctx.lineWidth = 2.2;
    ctx.stroke();
    ctx.restore();

    // 9. CUTE BOUNCY ANTENNAE WITH GOLDEN ORBS
    const drawAntenna = (isLeft: boolean) => {
      ctx.save();
      const mult = isLeft ? -1 : 1;
      const rootX = mult * (r * 0.2);
      const rootY = -r * 0.65;
      const sway = Math.sin(this.bobPhase * 2 + (isLeft ? 0 : 0.5)) * 0.16;

      ctx.beginPath();
      ctx.moveTo(rootX, rootY);
      ctx.bezierCurveTo(
        rootX + mult * (r * 0.15),
        rootY - r * 0.25,
        rootX + mult * (r * 0.35 + sway * 15),
        rootY - r * 0.4,
        rootX + mult * (r * 0.32 + sway * 20),
        rootY - r * 0.48
      );
      ctx.strokeStyle = '#1E293B';
      ctx.lineWidth = 3.5;
      ctx.lineCap = 'round';
      ctx.stroke();

      // Golden bulb
      const tipX = rootX + mult * (r * 0.32 + sway * 20);
      const tipY = rootY - r * 0.48;
      ctx.beginPath();
      ctx.arc(tipX, tipY, r * 0.11, 0, Math.PI * 2);
      ctx.fillStyle = '#F59E0B';
      ctx.fill();
      ctx.strokeStyle = '#78350F';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Shiny highlight
      ctx.beginPath();
      ctx.arc(tipX - 1.5, tipY - 1.5, r * 0.035, 0, Math.PI * 2);
      ctx.fillStyle = '#FFFFFF';
      ctx.fill();

      ctx.restore();
    };

    drawAntenna(true);
    drawAntenna(false);

    // 10. ADORABLE CHIBI FACE
    const faceCenterY = -r * 0.42;

    // Rosy Blush Cheeks with sparkle dots
    ctx.save();
    const blushY = faceCenterY + r * 0.12;
    const blushRadius = r * 0.14;
    const blushOpacity = this.isHovered ? 0.8 : 0.48;

    ctx.fillStyle = `rgba(244, 63, 94, ${blushOpacity})`;
    ctx.beginPath();
    ctx.arc(-r * 0.34, blushY, blushRadius, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.arc(r * 0.34, blushY, blushRadius, 0, Math.PI * 2);
    ctx.fill();

    // Cheek star shine
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.beginPath();
    ctx.arc(-r * 0.34, blushY - 1, 2, 0, Math.PI * 2);
    ctx.arc(r * 0.34, blushY - 1, 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Eyes (Expressive)
    const eyeY = faceCenterY;
    const eyeSpacing = r * 0.22;

    if (this.isDizzy) {
      // Dizzy Spiral Eyes (@_@)
      const drawSpiral = (cx: number) => {
        ctx.save();
        ctx.beginPath();
        const rot = this.dizzyTimer * 10;
        for (let a = 0; a < Math.PI * 4; a += 0.2) {
          const radius = (a / (Math.PI * 4)) * (r * 0.14);
          const px = cx + Math.cos(a + rot) * radius;
          const py = eyeY + Math.sin(a + rot) * radius;
          if (a === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.strokeStyle = '#1E293B';
        ctx.lineWidth = 2.5;
        ctx.stroke();
        ctx.restore();
      };
      drawSpiral(-eyeSpacing);
      drawSpiral(eyeSpacing);
    } else if (this.isBlinking) {
      // Happy Closed Eye Arches (^_^)
      ctx.save();
      ctx.strokeStyle = '#1E293B';
      ctx.lineWidth = 3.5;
      ctx.lineCap = 'round';

      ctx.beginPath();
      ctx.arc(-eyeSpacing, eyeY, r * 0.1, Math.PI * 1.15, Math.PI * 1.85);
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(eyeSpacing, eyeY, r * 0.1, Math.PI * 1.15, Math.PI * 1.85);
      ctx.stroke();
      ctx.restore();
    } else {
      // Sparkling Anime Eyes
      const drawAnimeEye = (cx: number) => {
        ctx.save();
        const eyeRadius = this.isHovered ? r * 0.16 : r * 0.14;

        // Dark pupil
        ctx.beginPath();
        ctx.arc(cx, eyeY, eyeRadius, 0, Math.PI * 2);
        ctx.fillStyle = '#0F172A';
        ctx.fill();

        // Primary reflection highlight
        ctx.beginPath();
        ctx.arc(cx - eyeRadius * 0.35, eyeY - eyeRadius * 0.35, eyeRadius * 0.45, 0, Math.PI * 2);
        ctx.fillStyle = '#FFFFFF';
        ctx.fill();

        // Secondary small sparkle highlight
        ctx.beginPath();
        ctx.arc(cx + eyeRadius * 0.35, eyeY + eyeRadius * 0.25, eyeRadius * 0.2, 0, Math.PI * 2);
        ctx.fillStyle = '#FFFFFF';
        ctx.fill();

        ctx.restore();
      };

      drawAnimeEye(-eyeSpacing);
      drawAnimeEye(eyeSpacing);
    }

    // Cute Cheerful Mouth
    ctx.save();
    const mouthY = faceCenterY + r * 0.16;
    ctx.strokeStyle = '#1E293B';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';

    if (this.isHovered) {
      // Wide open happy smile with pink tongue
      ctx.beginPath();
      ctx.arc(0, mouthY, r * 0.14, 0.1, Math.PI - 0.1);
      ctx.closePath();
      ctx.fillStyle = '#BE123C';
      ctx.fill();
      ctx.stroke();

      // Tongue
      ctx.save();
      ctx.beginPath();
      ctx.arc(0, mouthY, r * 0.14, 0.1, Math.PI - 0.1);
      ctx.clip();
      ctx.beginPath();
      ctx.arc(0, mouthY + r * 0.08, r * 0.1, 0, Math.PI * 2);
      ctx.fillStyle = '#FB7185';
      ctx.fill();
      ctx.restore();
    } else {
      // Sweet curved smile
      ctx.beginPath();
      ctx.arc(0, mouthY - r * 0.04, r * 0.11, 0.2, Math.PI - 0.2);
      ctx.stroke();
    }
    ctx.restore();

    // 11. ANSWER PLAQUE CARRIED DIRECTLY BENEATH BEE
    this.drawAnswerSignLocal(ctx, r);

    // RESTORE ROOT TRANSFORM
    ctx.restore();
  }

  private drawAnswerSignLocal(ctx: CanvasRenderingContext2D, r: number) {
    const signY = r * 1.35;
    const textStr = String(this.answer ?? '');

    // Font sizing based on text length
    let fontSize = Math.max(18, r * 0.48);
    if (textStr.length > 8) fontSize = r * 0.32;
    else if (textStr.length > 5) fontSize = r * 0.38;

    ctx.font = `900 ${fontSize}px 'Fredoka', 'Nunito', sans-serif`;
    const textWidth = ctx.measureText(textStr).width;
    const badgeW = Math.max(r * 1.3, textWidth + 32);
    const badgeH = Math.max(34, fontSize * 1.85);

    // Hanging ropes
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(-r * 0.32, r * 0.6);
    ctx.lineTo(-badgeW * 0.35, signY - badgeH / 2);
    ctx.moveTo(r * 0.32, r * 0.6);
    ctx.lineTo(badgeW * 0.35, signY - badgeH / 2);
    ctx.strokeStyle = '#B45309';
    ctx.lineWidth = 2.5;
    ctx.stroke();
    ctx.restore();

    // Wooden plaque with drop shadow
    ctx.save();
    ctx.translate(0, signY);

    // Shadow
    ctx.beginPath();
    drawRoundedRect(ctx, -badgeW / 2, -badgeH / 2 + 3, badgeW, badgeH, 12);
    ctx.fillStyle = '#92400E';
    ctx.fill();

    // Plaque background gradient
    ctx.beginPath();
    drawRoundedRect(ctx, -badgeW / 2, -badgeH / 2, badgeW, badgeH, 12);
    const plaqueGrad = ctx.createLinearGradient(0, -badgeH / 2, 0, badgeH / 2);
    plaqueGrad.addColorStop(0, '#FEF3C7');
    plaqueGrad.addColorStop(1, '#FDE68A');
    ctx.fillStyle = plaqueGrad;
    ctx.fill();

    // Plaque border
    ctx.strokeStyle = '#D97706';
    ctx.lineWidth = 3;
    ctx.stroke();

    // Honey drop decoration
    ctx.beginPath();
    ctx.arc(-badgeW / 2 + 10, -badgeH / 2 + 3, 5, 0, Math.PI * 2);
    ctx.fillStyle = '#F59E0B';
    ctx.fill();

    // Answer Text
    ctx.font = `900 ${fontSize}px 'Fredoka', 'Nunito', sans-serif`;
    ctx.fillStyle = '#1E293B';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(textStr, 0, 1);

    ctx.restore();
  }
}
