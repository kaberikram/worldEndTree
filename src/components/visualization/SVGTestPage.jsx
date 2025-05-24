import React from 'react'

function SVGTestPage() {
  // All 10 mystical categories
  const categories = [
    'Verdant Canopy',
    'Deeproot Dweller', 
    'Aetherial Bloom',
    'Dawning Spire',
    'Whispering Bark',
    'Celestial Echo',
    'Blighted Thorn',
    'Shadowed Heart',
    'Ancient Sap',
    'Fading Glyph'
  ]

  // Define a mapping from category to background image
  const categoryBackgrounds = {
    'Verdant Canopy': '/1.png',
    'Deeproot Dweller': '/1.png',
    'Aetherial Bloom': '/1.png',
    'Dawning Spire': '/2.png',
    'Whispering Bark': '/2.png',
    'Celestial Echo': '/2.png',
    'Blighted Thorn': '/3.png',
    'Shadowed Heart': '/3.png',
    'Ancient Sap': '/4.png',
    'Fading Glyph': '/4.png',
    // Fallback image if a category is not mapped
    default: '/dweller.png' 
  }

  // Category-specific SVG generator (updated with yellow/white/gold palette)
  const getCategorySVG = (category) => {
    const svgProps = { width: "120", height: "120", viewBox: "0 0 80 80" }
    // Define primary colors
    const yellow = "#fbbf24"; // Main yellow
    const lightYellow = "#fef3c7"; // Lighter yellow/gold
    const white = "#ffffff";

    switch(category) {
      case 'Verdant Canopy':
        return (
          <svg {...svgProps}>
            {/* Tree canopy pattern */}
            <defs>
              <radialGradient id="canopyGradient" cx="50%" cy="50%">
                <stop offset="0%" stopColor={lightYellow} />
                <stop offset="100%" stopColor={yellow} />
              </radialGradient>
            </defs>
            <circle cx="40" cy="40" r="25" fill="url(#canopyGradient)" opacity="0.5" />
            <circle cx="40" cy="30" r="8" fill={yellow} />
            <circle cx="30" cy="45" r="6" fill={lightYellow} />
            <circle cx="50" cy="45" r="6" fill={lightYellow} />
            <circle cx="35" cy="55" r="5" fill={yellow} opacity="0.7"/>
            <circle cx="45" cy="55" r="5" fill={yellow} opacity="0.7"/>
            <line x1="40" y1="60" x2="40" y2="70" stroke={yellow} strokeWidth="3" />
          </svg>
        )
        
      case 'Deeproot Dweller':
        return (
          <svg {...svgProps}>
            {/* Underground root network */}
            <defs>
              <linearGradient id="rootGradient" cx="50%" cy="50%"> 
                <stop offset="0%" stopColor={yellow} />
                <stop offset="100%" stopColor={lightYellow} />
              </linearGradient>
            </defs>
            <circle cx="40" cy="40" r="8" fill="url(#rootGradient)" />
            <line x1="40" y1="40" x2="20" y2="60" stroke={yellow} strokeWidth="3" />
            <line x1="40" y1="40" x2="60" y2="60" stroke={yellow} strokeWidth="3" />
            <line x1="40" y1="40" x2="15" y2="35" stroke={lightYellow} strokeWidth="2" />
            <line x1="40" y1="40" x2="65" y2="35" stroke={lightYellow} strokeWidth="2" />
            <circle cx="20" cy="60" r="4" fill={yellow} opacity="0.8"/>
            <circle cx="60" cy="60" r="4" fill={yellow} opacity="0.8"/>
            <circle cx="15" cy="35" r="3" fill={lightYellow} opacity="0.7"/>
            <circle cx="65" cy="35" r="3" fill={lightYellow} opacity="0.7"/>
          </svg>
        )
        
      case 'Aetherial Bloom':
        return (
          <svg {...svgProps}>
            {/* Ethereal flower petals */}
            <defs>
              <radialGradient id="bloomGradient" cx="50%" cy="50%">
                <stop offset="0%" stopColor={white} />
                <stop offset="100%" stopColor={lightYellow} />
              </radialGradient>
            </defs>
            <circle cx="40" cy="40" r="6" fill={white} />
            <ellipse cx="40" cy="25" rx="8" ry="12" fill="url(#bloomGradient)" opacity="0.8" />
            <ellipse cx="55" cy="40" rx="12" ry="8" fill="url(#bloomGradient)" opacity="0.8" />
            <ellipse cx="40" cy="55" rx="8" ry="12" fill="url(#bloomGradient)" opacity="0.8" />
            <ellipse cx="25" cy="40" rx="12" ry="8" fill="url(#bloomGradient)" opacity="0.8" />
            <circle cx="40" cy="40" r="20" fill="none" stroke={yellow} strokeWidth="1" opacity="0.5" />
          </svg>
        )
        
      case 'Dawning Spire':
        return (
          <svg {...svgProps}>
            {/* Upward pointing spire */}
            <defs>
              <linearGradient id="spireGradient" x1="0%" y1="100%" x2="0%" y2="0%">
                <stop offset="0%" stopColor={yellow} />
                <stop offset="100%" stopColor={white} />
              </linearGradient>
            </defs>
            <polygon points="40,15 50,35 45,35 45,65 35,65 35,35 30,35" fill="url(#spireGradient)" />
            <circle cx="40" cy="15" r="4" fill={white} />
            <line x1="25" y1="25" x2="35" y2="30" stroke={lightYellow} strokeWidth="2" />
            <line x1="55" y1="25" x2="45" y2="30" stroke={lightYellow} strokeWidth="2" />
            <line x1="20" y1="40" x2="30" y2="40" stroke={yellow} strokeWidth="2" />
            <line x1="60" y1="40" x2="50" y2="40" stroke={yellow} strokeWidth="2" />
          </svg>
        )
        
      case 'Whispering Bark':
        return (
          <svg {...svgProps}>
            {/* Tree bark texture with small details */}
            <defs>
              <pattern id="barkPattern" x="0" y="0" width="10" height="10" patternUnits="userSpaceOnUse">
                <rect width="10" height="10" fill={yellow} opacity="0.7"/>
                <line x1="0" y1="5" x2="10" y2="5" stroke={lightYellow} strokeWidth="1" opacity="0.5"/>
              </pattern>
            </defs>
            <rect x="35" y="20" width="10" height="40" fill="url(#barkPattern)" />
            <circle cx="30" cy="25" r="2" fill={lightYellow} />
            <circle cx="50" cy="30" r="2" fill={lightYellow} />
            <circle cx="28" cy="45" r="1.5" fill={white} />
            <circle cx="52" cy="50" r="1.5" fill={white} />
            <line x1="25" y1="35" x2="30" y2="40" stroke={yellow} strokeWidth="1" opacity="0.6"/>
            <line x1="50" y1="40" x2="55" y2="35" stroke={yellow} strokeWidth="1" opacity="0.6"/>
          </svg>
        )
        
      case 'Celestial Echo':
        return (
          <svg {...svgProps}>
            {/* Cosmic spiral pattern */}
            <defs>
              <radialGradient id="cosmicGradient" cx="50%" cy="50%">
                <stop offset="0%" stopColor={white} />
                <stop offset="100%" stopColor={yellow} />
              </radialGradient>
            </defs>
            <circle cx="40" cy="40" r="25" fill="none" stroke={yellow} strokeWidth="1" opacity="0.4" />
            <circle cx="40" cy="40" r="15" fill="none" stroke={lightYellow} strokeWidth="1" opacity="0.6" />
            <circle cx="40" cy="40" r="5" fill="url(#cosmicGradient)" />
            <circle cx="25" cy="25" r="2" fill={white} />
            <circle cx="55" cy="25" r="2" fill={white} />
            <circle cx="25" cy="55" r="2" fill={white} />
            <circle cx="55" cy="55" r="2" fill={white} />
            <path d="M 40 40 Q 30 30 40 20 Q 50 30 40 40 Q 50 50 40 60 Q 30 50 40 40" fill="none" stroke={yellow} strokeWidth="1.5" />
          </svg>
        )
        
      case 'Blighted Thorn':
        return (
          <svg {...svgProps}>
            {/* Thorny vine pattern */}
            <defs>
              <linearGradient id="thornGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor={yellow} />
                <stop offset="100%" stopColor={lightYellow} />
              </linearGradient>
            </defs>
            <path d="M20 20 Q40 35 60 20 Q45 40 60 60 Q40 45 20 60 Q35 40 20 20" fill="none" stroke={yellow} strokeWidth="2" />
            <polygon points="30,25 35,20 30,15" fill="url(#thornGradient)" />
            <polygon points="50,35 55,30 50,25" fill="url(#thornGradient)" />
            <polygon points="50,45 55,50 50,55" fill="url(#thornGradient)" />
            <polygon points="30,55 35,60 30,65" fill="url(#thornGradient)" />
            <circle cx="40" cy="40" r="3" fill={white} />
          </svg>
        )
        
      case 'Shadowed Heart':
        return (
          <svg {...svgProps}>
            {/* Heart shape with golden shadows */}
            <defs>
              <radialGradient id="shadowGradient" cx="50%" cy="50%">
                <stop offset="0%" stopColor={yellow} />
                <stop offset="100%" stopColor={lightYellow} opacity="0.7" />
              </radialGradient>
            </defs>
            <path d="M40,50 C35,40 25,35 25,45 C25,55 40,65 40,65 C40,65 55,55 55,45 C55,35 45,40 40,50 Z" fill="url(#shadowGradient)" />
            <circle cx="35" cy="30" r="8" fill={yellow} opacity="0.5" />
            <circle cx="45" cy="30" r="8" fill={yellow} opacity="0.5" />
            <circle cx="20" cy="40" r="3" fill={white} opacity="0.6" />
            <circle cx="60" cy="40" r="3" fill={white} opacity="0.6" />
          </svg>
        )
        
      case 'Ancient Sap':
        return (
          <svg {...svgProps}>
            {/* Flowing sap pattern */}
            <defs>
              <linearGradient id="sapGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor={white} />
                <stop offset="100%" stopColor={yellow} />
              </linearGradient>
            </defs>
            <ellipse cx="40" cy="35" rx="15" ry="20" fill="url(#sapGradient)" opacity="0.7" />
            <ellipse cx="40" cy="45" rx="12" ry="15" fill={yellow} opacity="0.8" />
            <circle cx="40" cy="50" r="8" fill={lightYellow} />
            <path d="M35 25 Q40 30 45 25 Q40 35 35 30" fill={white} />
            <circle cx="35" cy="55" r="2" fill={yellow} opacity="0.7" />
            <circle cx="45" cy="55" r="2" fill={yellow} opacity="0.7" />
          </svg>
        )
        
      case 'Fading Glyph':
        return (
          <svg {...svgProps}>
            {/* Ancient symbol fading away */}
            <defs>
              <linearGradient id="glyphGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor={yellow} opacity="0.8" />
                <stop offset="100%" stopColor={lightYellow} opacity="0.3" />
              </linearGradient>
            </defs>
            <circle cx="40" cy="40" r="20" fill="none" stroke="url(#glyphGradient)" strokeWidth="2" strokeDasharray="5,5" />
            <polygon points="40,30 45,40 40,50 35,40" fill={yellow} opacity="0.6" />
            <line x1="25" y1="40" x2="35" y2="40" stroke={lightYellow} strokeWidth="2" opacity="0.5" />
            <line x1="45" y1="40" x2="55" y2="40" stroke={lightYellow} strokeWidth="2" opacity="0.5" />
            <circle cx="30" cy="30" r="1" fill={white} opacity="0.4" />
            <circle cx="50" cy="30" r="1" fill={white} opacity="0.4" />
            <circle cx="30" cy="50" r="1" fill={white} opacity="0.4" />
            <circle cx="50" cy="50" r="1" fill={white} opacity="0.4" />
          </svg>
        )
        
      default:
        // Fallback generic network pattern
        return (
          <svg {...svgProps}>
            <defs>
              <radialGradient id="nodeGradient" cx="50%" cy="50%"> 
                <stop offset="0%" stopColor={white} />
                <stop offset="100%" stopColor={yellow} />
              </radialGradient>
            </defs>
            <circle cx="40" cy="40" r="8" fill="url(#nodeGradient)" />
            <circle cx="40" cy="20" r="6" fill={yellow} />
            <circle cx="60" cy="40" r="6" fill={yellow} />
            <circle cx="40" cy="60" r="6" fill={yellow} />
            <circle cx="20" cy="40" r="6" fill={yellow} />
            <line x1="40" y1="40" x2="40" y2="20" stroke={lightYellow} strokeWidth="1.5" opacity="0.8" />
            <line x1="40" y1="40" x2="60" y2="40" stroke={lightYellow} strokeWidth="1.5" opacity="0.8" />
            <line x1="40" y1="40" x2="40" y2="60" stroke={lightYellow} strokeWidth="1.5" opacity="0.8" />
            <line x1="40" y1="40" x2="20" y2="40" stroke={lightYellow} strokeWidth="1.5" opacity="0.8" />
          </svg>
        )
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%)',
      color: 'white',
      padding: '40px'
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto'
      }}>
        {/* Header */}
        <div style={{
          textAlign: 'center',
          marginBottom: '60px'
        }}>
          <h1 style={{
            fontSize: '3rem',
            fontWeight: '700',
            marginBottom: '20px',
            background: 'linear-gradient(45deg, #3b82f6, #8b5cf6, #ec4899)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            color: 'transparent',
            fontFamily: 'system-ui, -apple-system, sans-serif'
          }}>
            Mystical Categories
          </h1>
          <p style={{
            fontSize: '1.2rem',
            color: '#cbd5e1',
            fontStyle: 'italic'
          }}>
            The 10 Branches of the World End Tree
          </p>
        </div>

        {/* SVG Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '30px',
          marginBottom: '40px'
        }}>
          {categories.map((category, index) => {
            const backgroundImage = categoryBackgrounds[category] || categoryBackgrounds.default;
            return (
              <div 
                key={category} 
                style={{
                  border: '1px solid #4b5563',
                  borderRadius: '12px',
                  padding: '20px',
                  textAlign: 'center',
                  backgroundColor: 'rgba(30, 41, 59, 0.5)', // Semi-transparent background for the card
                  boxShadow: '0 4px 15px rgba(0,0,0,0.2)',
                  width: '100%', // Ensure cards take full width of grid cell
                  maxWidth: '350px', // Max width for a card
                  height: '350px', // Fixed height for consistent card size
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  position: 'relative', // For positioning the background
                  overflow: 'hidden' // Ensure background doesn't spill
                }}
              >
                <div style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  backgroundImage: `url(${backgroundImage})`,
                  backgroundSize: 'cover', // Changed to cover for better fit
                  backgroundPosition: 'center',
                  backgroundRepeat: 'no-repeat',
                  opacity: 0.3, // Adjust opacity to make text/SVG readable
                  zIndex: 0
                }} />
                <div style={{ position: 'relative', zIndex: 1, width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <h2 style={{ marginTop: '10px', marginBottom: '15px', fontSize: '1.5rem', fontWeight: '600' }}>{category}</h2>
                  {getCategorySVG(category)}
                </div>
              </div>
            );
          })}
        </div>

        {/* Back to App Button */}
        <div style={{
          textAlign: 'center'
        }}>
          <button
            onClick={() => window.location.href = '/'}
            style={{
              padding: '15px 40px',
              background: 'linear-gradient(45deg, #3b82f6, #8b5cf6)',
              color: 'white',
              border: 'none',
              borderRadius: '50px',
              fontSize: '1rem',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              letterSpacing: '0.5px'
            }}
            onMouseOver={(e) => {
              e.target.style.transform = 'translateY(-2px)'
              e.target.style.boxShadow = '0 10px 25px rgba(59, 130, 246, 0.4)'
            }}
            onMouseOut={(e) => {
              e.target.style.transform = 'translateY(0)'
              e.target.style.boxShadow = 'none'
            }}
          >
            ← Back to World End Tree
          </button>
        </div>
      </div>
    </div>
  )
}

export default SVGTestPage 