// Web Audio API Sound Generator & Voice Alert System for Real-Time Dispatch Notifications

export function calculateHaversineDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

class SoundNotifier {
  private ctx: AudioContext | null = null;
  private alertedOrderIds: Set<string> = new Set();
  private lastAlertTime: number = 0;

  private getContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  // Pleasant notification bell/chime for new incoming delivery orders
  playNewOrderSound() {
    try {
      const ctx = this.getContext();
      if (!ctx) return;

      const now = ctx.currentTime;

      // Note 1 (E5 - 659.25 Hz)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(659.25, now);
      gain1.gain.setValueAtTime(0.25, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.5);

      // Note 2 (B5 - 987.77 Hz)
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(987.77, now + 0.12);
      gain2.gain.setValueAtTime(0.3, now + 0.12);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.8);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.12);
      osc2.stop(now + 0.8);
    } catch (e) {
      // Audio autoplay might be blocked before first user gesture
    }
  }

  // Urgent two-tone dispatch alert sound for nearby drivers on motorcycles/bicycles
  playUrgentProximityChime() {
    try {
      const ctx = this.getContext();
      if (!ctx) return;

      const now = ctx.currentTime;

      // Pulse 1: Attention frequency sweep (880 Hz to 1320 Hz)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'triangle';
      osc1.frequency.setValueAtTime(880, now);
      osc1.frequency.exponentialRampToValueAtTime(1320, now + 0.2);
      gain1.gain.setValueAtTime(0.35, now);
      gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.35);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.35);

      // Pulse 2: Resonant alert beacon (1174 Hz)
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(1174.66, now + 0.22);
      gain2.gain.setValueAtTime(0.4, now + 0.22);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.7);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.22);
      osc2.stop(now + 0.7);
    } catch (e) {}
  }

  // Automated Voice Alert via Web Speech Synthesis API:
  // "هناك طلبية قريبة، انتبه!"
  speakVoiceAlert(text: string = 'هناك طلبية قريبة، انتبه!') {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    try {
      window.speechSynthesis.cancel(); // Stop any pending utterance

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'ar-SA';
      utterance.rate = 1.05;
      utterance.pitch = 1.1;
      utterance.volume = 1.0;

      // Select Arabic voice if available on user device
      const voices = window.speechSynthesis.getVoices();
      const arVoice = voices.find((v) => v.lang.startsWith('ar'));
      if (arVoice) {
        utterance.voice = arVoice;
      }

      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn('[AudioNotification] Speech synthesis notice:', e);
    }
  }

  // Proximity-Based Auditory Alert: Distinct Chime followed by Automated Voice Alert
  // Prevents rider from needing to stare at their phone while on the road
  playProximityOrderAlert(orderId?: string, distanceKm?: number, customText?: string) {
    // Prevent duplicate audio alerts for the same order within 10 seconds
    const now = Date.now();
    if (orderId) {
      if (this.alertedOrderIds.has(orderId) && now - this.lastAlertTime < 10000) {
        return;
      }
      this.alertedOrderIds.add(orderId);
      // Keep set bounded
      if (this.alertedOrderIds.size > 100) {
        this.alertedOrderIds.clear();
      }
    }
    this.lastAlertTime = now;

    // 1. Play distinct attention sound
    this.playUrgentProximityChime();

    // 2. Play voice alert 400ms after chime
    setTimeout(() => {
      let voiceMessage = 'هناك طلبية قريبة، انتبه!';
      if (customText) {
        voiceMessage = customText;
      } else if (distanceKm !== undefined && distanceKm > 0) {
        const roundedDist = Math.round(distanceKm * 10) / 10;
        voiceMessage = `هناك طلبية قريبة على بعد ${roundedDist} كيلومتر، انتبه!`;
      }
      this.speakVoiceAlert(voiceMessage);
    }, 450);
  }

  // Pleasant acceptance/bid sound
  playBidSound() {
    try {
      const ctx = this.getContext();
      if (!ctx) return;
      const now = ctx.currentTime;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(523.25, now); // C5
      osc.frequency.exponentialRampToValueAtTime(783.99, now + 0.2); // G5
      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.4);
    } catch (e) {}
  }
}

export const soundNotifier = new SoundNotifier();
