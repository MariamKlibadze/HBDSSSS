import { Component, signal, AfterViewInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { RouterOutlet } from '@angular/router';

interface Particle {
  x: number; y: number;
  vx: number; vy: number;
  alpha: number;
  color: string;
  radius: number;
  gravity: number;
  decay: number;
}

interface Rocket {
  x: number; y: number;
  vy: number;
  targetY: number;
  color: string;
  trail: { x: number; y: number }[];
}

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements AfterViewInit, OnDestroy {
  protected readonly title = signal('HBDSAN');
  showVideo = false;
  showMessage = false;
  showNoClick = false;
  showNoClick2 = false;
  showLips = false;
  showBabyFrog = false;

  @ViewChild('fireworksCanvas') canvasRef!: ElementRef<HTMLCanvasElement>;
  private animId = 0;
  private rockets: Rocket[] = [];
  private particles: Particle[] = [];
  private launchTimer = 0;

  private readonly colors = [
    '#ff6b6b', '#ffd93d', '#6bcb77', '#4d96ff',
    '#ff922b', '#f783ac', '#cc5de8', '#74c0fc',
    '#a9e34b', '#ff8787', '#ffe066'
  ];

  openVideo(): void { this.showVideo = true; }
  closeVideo(): void { this.showVideo = false; }
  toggleMessage(): void { this.showMessage = !this.showMessage; }
  toggleNoClick(): void { this.showNoClick = !this.showNoClick; }
  toggleNoClick2(): void { this.showNoClick2 = !this.showNoClick2; }
  toggleLips(): void { this.showLips = !this.showLips; }
  toggleBabyFrog(): void { this.showBabyFrog = !this.showBabyFrog; }

  ngAfterViewInit(): void {
    const canvas = this.canvasRef.nativeElement;
    const ctx = canvas.getContext('2d')!;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const rand = (min: number, max: number) => Math.random() * (max - min) + min;

    const explode = (x: number, y: number, color: string) => {
      const count = Math.floor(rand(80, 130));
      for (let i = 0; i < count; i++) {
        const angle = (Math.PI * 2 / count) * i + rand(-0.2, 0.2);
        const speed = rand(1.5, 5.5);
        this.particles.push({
          x, y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          alpha: 1,
          color: Math.random() > 0.3 ? color : this.colors[Math.floor(Math.random() * this.colors.length)],
          radius: rand(2, 4),
          gravity: 0.07,
          decay: rand(0.012, 0.022)
        });
      }
    };

    const launchRocket = () => {
      const color = this.colors[Math.floor(Math.random() * this.colors.length)];
      this.rockets.push({
        x: rand(canvas.width * 0.15, canvas.width * 0.85),
        y: canvas.height,
        vy: rand(-14, -10),
        targetY: rand(canvas.height * 0.1, canvas.height * 0.45),
        color,
        trail: []
      });
    };

    const loop = () => {
      this.animId = requestAnimationFrame(loop);

      // Clear canvas each frame (keeps canvas transparent over page)
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Auto-launch
      this.launchTimer++;
      if (this.launchTimer >= 40) {
        this.launchTimer = 0;
        const burst = Math.floor(rand(1, 3));
        for (let i = 0; i < burst; i++) setTimeout(launchRocket, i * 200);
      }

      // Update & draw rockets
      this.rockets = this.rockets.filter(r => {
        r.trail.push({ x: r.x, y: r.y });
        if (r.trail.length > 14) r.trail.shift();

        // Draw rocket trail as a tapered line
        for (let i = 1; i < r.trail.length; i++) {
          const t = i / r.trail.length;
          ctx.beginPath();
          ctx.moveTo(r.trail[i - 1].x, r.trail[i - 1].y);
          ctx.lineTo(r.trail[i].x, r.trail[i].y);
          ctx.strokeStyle = r.color;
          ctx.lineWidth = t * 2.5;
          ctx.globalAlpha = t * 0.8;
          ctx.stroke();
        }
        ctx.globalAlpha = 1;

        r.y += r.vy;
        if (r.y <= r.targetY) {
          explode(r.x, r.y, r.color);
          return false;
        }
        return true;
      });

      // Update & draw particles
      this.particles = this.particles.filter(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += p.gravity;
        p.vx *= 0.98;
        p.alpha -= p.decay;

        if (p.alpha <= 0) return false;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius * p.alpha, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.alpha;
        ctx.fill();
        ctx.globalAlpha = 1;
        return true;
      });
    };

    loop();
  }

  ngOnDestroy(): void {
    cancelAnimationFrame(this.animId);
  }
}
