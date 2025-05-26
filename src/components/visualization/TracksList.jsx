import { useEffect, useState, useRef } from 'react'
import { playButton, playSelect, playSuccess } from '../../utils/sfx'

function TracksList({ topTracks, onAnalyzeBranch, analyzing, analysisComplete, analysisResult, onTrackSelect }) {
  if (!topTracks) return null

  const expanded = analyzing || analysisComplete;
  const buttonText = analysisComplete ? 'Back to Branch' : (analyzing ? 'Analyzing...' : 'Analyze Branch');
  const fadeOutContents = analyzing || analysisComplete;

  // Fade-in/out state for loading orb
  const [showLoadingOrb, setShowLoadingOrb] = useState(false);
  const [orbVisible, setOrbVisible] = useState(false);
  const [shouldRenderOrb, setShouldRenderOrb] = useState(false);
  // Fade-in state for summary
  const [showSummary, setShowSummary] = useState(false);

  // Ref for the scrollable container
  const containerRef = useRef(null);

  // Button text fade state
  const [buttonTextFade, setButtonTextFade] = useState(1); // 1 = visible, 0 = hidden
  const [buttonTextState, setButtonTextState] = useState('analyzing'); // 'analyzing' | 'back'

  // Animated ellipsis for analyzing
  const [ellipsis, setEllipsis] = useState('');
  useEffect(() => {
    if (analyzing && !analysisComplete) {
      let i = 0;
      const interval = setInterval(() => {
        setEllipsis('.'.repeat((i % 3) + 1));
        i++;
      }, 400);
      return () => clearInterval(interval);
    } else {
      setEllipsis('');
    }
  }, [analyzing, analysisComplete]);

  // Delayed expansion state for width
  const [delayedExpanded, setDelayedExpanded] = useState(false);

  // Handle delayed width expansion
  useEffect(() => {
    let expandTimeout;
    if (analyzing && !analysisComplete) {
      // Wait for fade out (400ms), then expand
      expandTimeout = setTimeout(() => setDelayedExpanded(true), 400);
    } else {
      setDelayedExpanded(false);
    }
    return () => clearTimeout(expandTimeout);
  }, [analyzing, analysisComplete]);

  // Orb fade-in/out logic
  useEffect(() => {
    let fadeInTimeout, fadeOutTimeout;
    if (analyzing && !analysisComplete) {
      // Fade in orb after tracklist fades out
      fadeInTimeout = setTimeout(() => setShowLoadingOrb(true), 400);
    } else if (analysisComplete) {
      // Fade out orb before summary fades in
      fadeOutTimeout = setTimeout(() => setShowLoadingOrb(false), 300);
    } else {
      setShowLoadingOrb(false);
    }
    return () => {
      clearTimeout(fadeInTimeout);
      clearTimeout(fadeOutTimeout);
    };
  }, [analyzing, analysisComplete]);

  // Control orb opacity for fade-in
  useEffect(() => {
    let visibleTimeout;
    if (showLoadingOrb) {
      setShouldRenderOrb(true);
      setOrbVisible(false); // Start hidden
      visibleTimeout = setTimeout(() => setOrbVisible(true), 10); // Fade in after mount
    } else if (shouldRenderOrb) {
      setOrbVisible(false); // Fade out
      visibleTimeout = setTimeout(() => setShouldRenderOrb(false), 400); // Unmount after fade-out
    } else {
      setOrbVisible(false);
      setShouldRenderOrb(false);
    }
    return () => clearTimeout(visibleTimeout);
  }, [showLoadingOrb]);

  // Fade-in state for summary, only after orb is fully faded out
  useEffect(() => {
    let summaryTimeout;
    if (analysisComplete) {
      if (!orbVisible && !shouldRenderOrb) {
        // Wait for orb fade-out before showing summary
        summaryTimeout = setTimeout(() => setShowSummary(true), 10);
      } else {
        setShowSummary(false);
      }
    } else {
      setShowSummary(false);
    }
    return () => clearTimeout(summaryTimeout);
  }, [analysisComplete, orbVisible, shouldRenderOrb]);

  // When summary is shown, scroll container to top
  useEffect(() => {
    if (showSummary && containerRef.current) {
      containerRef.current.scrollTop = 0;
    }
  }, [showSummary]);

  // Handle button text fade transition
  useEffect(() => {
    if (analyzing && !analysisComplete) {
      setButtonTextState('analyzing');
      setButtonTextFade(1);
    } else if (analysisComplete) {
      // Fade out 'Analyzing...' first
      setButtonTextFade(0);
      const timeout = setTimeout(() => {
        setButtonTextState('back');
        setButtonTextFade(1);
      }, 300); // match transition duration
      return () => clearTimeout(timeout);
    } else {
      setButtonTextState('analyze');
      setButtonTextFade(1);
    }
  }, [analyzing, analysisComplete]);

  const prevAnalysisComplete = useRef(analysisComplete)
  useEffect(() => {
    if (!prevAnalysisComplete.current && analysisComplete) {
      playSuccess();
    }
    prevAnalysisComplete.current = analysisComplete;
  }, [analysisComplete]);

  return (
    <div style={{
      position: 'fixed',
      bottom: '30px',
      right: '30px',
      zIndex: 10,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center'
    }}>
      <button
        onClick={e => {
          if (!(analyzing && !analysisComplete)) playButton();
          onAnalyzeBranch(e);
        }}
        disabled={analyzing && !analysisComplete}
        style={{
          background: 'transparent',
          padding: '10px 15px',
          marginBottom: '10px',
          fontSize: '0.9em',
          width: expanded ? '250px' : '160px',
          color: 'white',
          border: '1px solid white',
          borderRadius: '20px',
          fontFamily: "'system-ui', -apple-system, sans-serif",
          fontWeight: '500',
          letterSpacing: '1px',
          boxShadow: 'none',
          cursor: (analyzing && !analysisComplete) ? 'not-allowed' : 'pointer',
          transition: 'width 0.4s cubic-bezier(0.4,0,0.2,1), background 0.2s, color 0.2s, border-color 0.2s',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '6px',
        }}
      >
        {analyzing && !analysisComplete && (
          <div style={{
            width: '12px',
            height: '12px',
            border: '2px solid transparent',
            borderTop: '2px solid #777',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }} />
        )}
        <span
          style={{
            display: 'inline-block',
            opacity: buttonTextFade,
            transition: 'opacity 0.3s cubic-bezier(0.4,0,0.2,1)',
            minWidth: '90px',
            textAlign: 'center',
          }}
        >
          {buttonTextState === 'back'
            ? 'Back to Branch'
            : buttonTextState === 'analyzing'
              ? `Analyzing${ellipsis}`
              : 'Analyze Branch'}
        </span>
      </button>

      <div 
        ref={containerRef}
        style={{
          maxWidth: expanded ? '250px' : '160px',
          width: expanded ? '250px' : '160px',
          maxHeight: '120px',
          overflowY: showSummary ? 'hidden' : 'auto',
          overflowX: 'hidden',
          background: 'transparent',
          padding: '16px',
          borderRadius: '12px',
          border: '1px solid white',
          boxShadow: '0 6px 18px rgba(0,0,0,0.2)',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          color: 'white',
          transition: 'width 0.4s cubic-bezier(0.4,0,0.2,1), max-width 0.4s cubic-bezier(0.4,0,0.2,1), opacity 0.3s ease-in-out, transform 0.3s ease-in-out',
          opacity: 1,
          position: 'relative',
        }}
        className="tracks-overlay"
      >
        {/* Tracklist contents fade out */}
        <div style={{
          opacity: fadeOutContents ? 0 : 1,
          pointerEvents: fadeOutContents ? 'none' : 'auto',
          transition: 'opacity 0.4s cubic-bezier(0.4,0,0.2,1)'
        }}>
          <h3 style={{
            marginTop: 0,
            marginBottom: '10px',
            borderBottom: '1px solid white',
            paddingBottom: '6px',
            fontSize: '0.9em',
            color: 'white',
            fontFamily: "system-ui, -apple-system, sans-serif",
            fontWeight: 500,
            letterSpacing: '1px',
            textAlign: 'center',
          }}>
            Deep Rooted Tracks
          </h3>
          <ol className="track-list" style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {topTracks.map((track) => (
              <li
                key={track.id}
                className="track-item"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  marginBottom: '10px',
                  cursor: onTrackSelect ? 'pointer' : 'default',
                  borderRadius: '8px',
                  transition: 'background 0.18s',
                }}
                onClick={onTrackSelect ? () => {
                  playSelect();
                  onTrackSelect(track.id)
                } : undefined}
                onKeyDown={onTrackSelect ? (e) => { if (e.key === 'Enter') onTrackSelect(track.id) } : undefined}
                tabIndex={onTrackSelect ? 0 : undefined}
                aria-label={onTrackSelect ? `Focus on ${track.name}` : undefined}
              >
                {track.album && track.album.images && track.album.images.length > 0 && (
                  <img 
                    src={track.album.images[0].url} 
                    alt={track.name} 
                    style={{ width: '40px', height: '40px', marginRight: '10px', borderRadius: '6px', objectFit: 'cover' }}
                  />
                )}
                <div style={{ display: 'flex', flexDirection: 'column', flexGrow: 1, minWidth: 0 }}>
                  <span style={{ fontWeight: '600', fontSize: '0.85em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: 'white' }}>
                    {track.name}
                  </span>
                  <span style={{ fontSize: '0.7em', color: 'white', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {track.artists.map(artist => artist.name).join(', ')}
                  </span>
                </div>
              </li>
            ))}
          </ol>
        </div>
        {/* Loading orb during analyzing, with fade-in and fade-out, filled style */}
        {shouldRenderOrb && (
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            opacity: orbVisible ? 1 : 0,
            pointerEvents: orbVisible ? 'auto' : 'none',
            transition: 'opacity 0.4s cubic-bezier(0.4,0,0.2,1)',
            zIndex: 2,
          }}>
            <div style={{
              width: '49.4px',
              height: '49.4px',
              borderRadius: '50%',
              background: 'radial-gradient(circle at 60% 40%, #ffe082 70%, #fbbf24 100%)',
              boxShadow: '0 0 16px 4px #fbbf24, 0 0 32px 8px #ffe08244',
              border: 'none',
              animation: 'pulseGlow 1.8s infinite ease-in-out',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              boxSizing: 'border-box',
            }}>
              {/* Optional: a smaller, static inner orb or icon if desired */}
            </div>
          </div>
        )}
        {/* Summary analysis title and description fade in */}
        {analysisComplete && analysisResult && (
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            opacity: showSummary ? 1 : 0,
            pointerEvents: showSummary ? 'auto' : 'none',
            transition: 'opacity 0.4s cubic-bezier(0.4,0,0.2,1)',
            padding: '18px 10px',
            boxSizing: 'border-box',
            overflow: 'hidden',
          }}>
            <h3 style={{
              margin: 0,
              marginBottom: '6px',
              fontSize: '1em',
              color: '#fff',
              fontWeight: 700,
              letterSpacing: '0.5px',
              textAlign: 'center',
              textShadow: '0 2px 8px rgba(0,0,0,0.18)'
            }}>
              {analysisResult.determined_category}
            </h3>
            <p style={{
              margin: 0,
              fontSize: '0.85em',
              color: '#e0e0e0',
              fontWeight: 400,
              textAlign: 'center',
              lineHeight: 1.5,
              textShadow: '0 1px 4px rgba(0,0,0,0.12)',
              letterSpacing: '0.01em',
              padding: 0,
            }}>
              {analysisResult.category_description}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default TracksList 