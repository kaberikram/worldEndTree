function TracksList({ topTracks, onAnalyzeBranch, analyzing }) {
  if (!topTracks) return null

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
        onClick={onAnalyzeBranch}
        disabled={analyzing}
        style={{
          background: 'transparent',
          padding: '10px 15px',
          marginBottom: '10px',
          fontSize: '0.9em',
          width: '160px',
          color: 'white',
          border: '1px solid white',
          borderRadius: '20px',
          fontFamily: "'system-ui', -apple-system, sans-serif",
          fontWeight: '500',
          letterSpacing: '1px',
          boxShadow: 'none',
          cursor: analyzing ? 'not-allowed' : 'pointer',
          transition: 'background 0.2s, color 0.2s, border-color 0.2s',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '6px',
          ...(analyzing
            ? {
                opacity: 0.6,
              }
            : {})
        }}
      >
        {analyzing && (
          <div style={{
            width: '12px',
            height: '12px',
            border: '2px solid transparent',
            borderTop: '2px solid #777',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }} />
        )}
        {analyzing ? 'Analyzing...' : 'Analyze Branch'}
      </button>

      <div 
        style={{
          maxWidth: '160px',
          width: '160px',
          maxHeight: '120px',
          overflowY: 'auto',
          overflowX: 'hidden',
          background: 'transparent',
          padding: '16px',
          borderRadius: '12px',
          border: '1px solid white',
          boxShadow: '0 6px 18px rgba(0,0,0,0.2)',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          color: 'white',
          transition: 'opacity 0.3s ease-in-out, transform 0.3s ease-in-out',
          opacity: 1,
        }}
        className="tracks-overlay"
      >
        <h3 style={{ marginTop: 0, marginBottom: '10px', borderBottom: '1px solid white', paddingBottom: '6px', fontSize: '1em', color: 'white' }}>
        Deep Rooted Tracks
        </h3>
        
        <ol className="track-list" style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {topTracks.map((track) => (
            <li key={track.id} className="track-item" style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
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
    </div>
  )
}

export default TracksList 