/**
 * Sari3 Default Vector Avatars & System Badges
 * Professional, matching vector illustrations for drivers & customers.
 * Completely replaces public profile picture uploads.
 * 
 * - Driver: Delivery rider wearing a safety helmet with a delivery box in the background.
 * - Customer: Customer holding a smartphone with delivery/shopping elements in the same vector art style.
 */

// Driver Vector Illustration (Helmet + Delivery Box + Dynamic Modern Style)
export const DRIVER_DEFAULT_AVATAR = `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0f172a"/>
      <stop offset="100%" stop-color="#1e293b"/>
    </linearGradient>
    <linearGradient id="helmetGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#10b981"/>
      <stop offset="100%" stop-color="#059669"/>
    </linearGradient>
    <linearGradient id="visorGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0284c7"/>
      <stop offset="100%" stop-color="#0369a1"/>
    </linearGradient>
    <linearGradient id="boxGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#f59e0b"/>
      <stop offset="100%" stop-color="#d97706"/>
    </linearGradient>
    <linearGradient id="jacketGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#10b981"/>
      <stop offset="100%" stop-color="#047857"/>
    </linearGradient>
  </defs>

  <!-- Circular Background -->
  <circle cx="60" cy="60" r="58" fill="url(#bgGrad)" stroke="#10b981" stroke-width="2.5"/>

  <!-- Background Delivery Thermal Box Backpack -->
  <rect x="26" y="38" width="68" height="48" rx="8" fill="url(#boxGrad)" opacity="0.95"/>
  <rect x="30" y="42" width="60" height="8" rx="2" fill="#b45309"/>
  <!-- Sari3 Lightning on Box -->
  <path d="M60 45 L54 58 L62 58 L58 70 L70 55 L62 55 Z" fill="#ffffff" opacity="0.9"/>

  <!-- Delivery Rider Body / Jacket -->
  <path d="M30 114 C30 94 44 82 60 82 C76 82 90 94 90 114 Z" fill="url(#jacketGrad)"/>
  <!-- Safety Reflective Vest Stripes -->
  <path d="M42 88 L36 114 M78 88 L84 114" stroke="#fbbf24" stroke-width="3" stroke-linecap="round"/>

  <!-- Driver Neck -->
  <rect x="53" y="68" width="14" height="18" rx="4" fill="#fcd34d"/>

  <!-- Rider Safety Helmet -->
  <path d="M38 52 C38 32 46 22 60 22 C74 22 82 32 82 52 C82 58 76 66 60 66 C44 66 38 58 38 52 Z" fill="url(#helmetGrad)"/>
  
  <!-- Helmet Aerodynamic Top Stripe -->
  <path d="M57 22 C57 22 58 36 58 44 C58 44 62 44 62 44 C62 36 63 22 63 22 Z" fill="#ffffff" opacity="0.3"/>

  <!-- Helmet Protective Visor (Glass) -->
  <path d="M42 42 C44 38 52 36 60 36 C68 36 76 38 78 42 C80 47 78 54 74 56 C68 58 52 58 46 56 C42 54 40 47 42 42 Z" fill="url(#visorGrad)" stroke="#38bdf8" stroke-width="1.2"/>
  <!-- Visor Reflection Highlight -->
  <path d="M46 42 Q58 39 74 42" stroke="#ffffff" stroke-width="2" stroke-linecap="round" opacity="0.7"/>

  <!-- Chinstrap -->
  <path d="M46 62 Q60 70 74 62" stroke="#047857" stroke-width="2" fill="none"/>
</svg>
`)}`;

// Customer Vector Illustration (Customer holding smartphone with delivery/shopping elements)
export const CUSTOMER_DEFAULT_AVATAR = `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120">
  <defs>
    <linearGradient id="custBg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0f172a"/>
      <stop offset="100%" stop-color="#1e293b"/>
    </linearGradient>
    <linearGradient id="custBody" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#3b82f6"/>
      <stop offset="100%" stop-color="#1d4ed8"/>
    </linearGradient>
    <linearGradient id="phoneGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#334155"/>
      <stop offset="100%" stop-color="#0f172a"/>
    </linearGradient>
    <linearGradient id="phoneScreen" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#10b981"/>
      <stop offset="100%" stop-color="#0284c7"/>
    </linearGradient>
  </defs>

  <!-- Circular Background -->
  <circle cx="60" cy="60" r="58" fill="url(#custBg)" stroke="#3b82f6" stroke-width="2.5"/>

  <!-- Delivery floating badges / Shopping elements in background -->
  <!-- Floating Package icon in background -->
  <g transform="translate(18, 22) scale(0.65)" opacity="0.8">
    <rect x="0" y="6" width="24" height="20" rx="3" fill="#f59e0b"/>
    <path d="M0 12 L24 12 M12 6 L12 26" stroke="#d97706" stroke-width="2"/>
  </g>
  <!-- Floating Location Pin in background -->
  <g transform="translate(86, 22) scale(0.7)" opacity="0.85">
    <path d="M10 0 C4.5 0 0 4.5 0 10 C0 16 10 26 10 26 C10 26 20 16 20 10 C20 4.5 15.5 0 10 0 Z" fill="#ef4444"/>
    <circle cx="10" cy="10" r="4" fill="#ffffff"/>
  </g>

  <!-- Customer Body / Hoodie -->
  <path d="M30 114 C30 92 42 80 58 80 C74 80 88 92 88 114 Z" fill="url(#custBody)"/>

  <!-- Neck -->
  <rect x="52" y="66" width="14" height="16" rx="3" fill="#fcd34d"/>

  <!-- Customer Face -->
  <circle cx="59" cy="48" r="18" fill="#fcd34d"/>

  <!-- Hair / Modern Cut -->
  <path d="M42 46 C40 32 50 24 64 24 C74 24 78 30 78 40 C72 38 66 36 54 39 C46 41 43 45 42 46 Z" fill="#1e293b"/>

  <!-- Friendly Eyes & Smile -->
  <circle cx="53" cy="46" r="2" fill="#0f172a"/>
  <circle cx="65" cy="46" r="2" fill="#0f172a"/>
  <path d="M54 54 Q59 58 64 54" stroke="#0f172a" stroke-width="2" stroke-linecap="round" fill="none"/>

  <!-- Smartphone held in hand with Sari3 delivery app displayed -->
  <g transform="translate(68, 64)">
    <!-- Hand -->
    <circle cx="14" cy="24" r="7" fill="#fcd34d"/>
    <!-- Phone body -->
    <rect x="4" y="8" width="22" height="38" rx="4" fill="url(#phoneGrad)" stroke="#64748b" stroke-width="1.2"/>
    <!-- Phone Screen -->
    <rect x="6" y="12" width="18" height="30" rx="2" fill="url(#phoneScreen)"/>
    <!-- Phone app UI: Delivery route pulse -->
    <circle cx="10" cy="18" r="2" fill="#ffffff"/>
    <circle cx="20" cy="36" r="2.5" fill="#f59e0b"/>
    <path d="M10 18 Q14 26 20 36" stroke="#ffffff" stroke-width="1.5" stroke-dasharray="2,2" fill="none"/>
  </g>
</svg>
`)}`;

/**
 * Returns the matching default avatar illustration depending on user role
 */
export function getDefaultAvatar(role: 'driver' | 'customer' | string | undefined): string {
  if (role === 'driver') {
    return DRIVER_DEFAULT_AVATAR;
  }
  return CUSTOMER_DEFAULT_AVATAR;
}
