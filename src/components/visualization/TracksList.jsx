function TracksList({ topTracks, onAnalyzeBranch, analyzing }) {
  if (!topTracks) return null

  return (
    <div 
      style={{
        position: 'fixed',
        bottom: '20px',
        right: '30px',
        width: 'calc(100% - 60px)',
        maxWidth: '175px',
        maxHeight: '200px',
        overflowY: 'auto',
        background: 'rgba(255, 255, 255, 0.85)',
        padding: '12px',
        borderRadius: '12px',
        boxShadow: '0 6px 18px rgba(0,0,0,0.2)',
        zIndex: 10,
        fontFamily: '"Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
        color: '#333',
        transition: 'opacity 0.3s ease-in-out, transform 0.3s ease-in-out',
        opacity: 1,
      }}
      className="tracks-overlay"
    >
      <h3 style={{ marginTop: 0, marginBottom: '10px', borderBottom: '1px solid #ccc', paddingBottom: '6px', fontSize: '1em' }}>
        Your Top Tracks
      </h3>
      
      <button
        onClick={onAnalyzeBranch}
        disabled={analyzing}
        style={{
          width: '100%',
          padding: '8px 12px',
          marginBottom: '12px',
          background: analyzing 
            ? 'linear-gradient(135deg, #888, #aaa)' 
            : 'linear-gradient(135deg, #1db954, #1ed760)',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          fontSize: '0.85em',
          fontWeight: '600',
          cursor: analyzing ? 'not-allowed' : 'pointer',
          transition: 'all 0.2s ease',
          boxShadow: analyzing 
            ? '0 2px 8px rgba(136, 136, 136, 0.3)' 
            : '0 2px 8px rgba(29, 185, 84, 0.3)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '6px'
        }}
        onMouseOver={(e) => {
          if (!analyzing) {
            e.target.style.transform = 'translateY(-1px)'
            e.target.style.boxShadow = '0 4px 12px rgba(29, 185, 84, 0.4)'
          }
        }}
        onMouseOut={(e) => {
          if (!analyzing) {
            e.target.style.transform = 'translateY(0)'
            e.target.style.boxShadow = '0 2px 8px rgba(29, 185, 84, 0.3)'
          }
        }}
      >
        {analyzing && (
          <div style={{
            width: '12px',
            height: '12px',
            border: '2px solid transparent',
            borderTop: '2px solid white',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }} />
        )}
        {analyzing ? 'Analyzing...' : 'Analyze Branch'}
      </button>

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
              <span style={{ fontWeight: '600', fontSize: '0.85em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {track.name}
              </span>
              <span style={{ fontSize: '0.7em', color: '#555', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {track.artists.map(artist => artist.name).join(', ')}
              </span>
            </div>
          </li>
        ))}
      </ol>
    </div>
  )
}

export default TracksList 