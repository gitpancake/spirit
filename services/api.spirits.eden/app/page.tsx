export default function ApiRoot() {
  return (
    <div style={{ 
      padding: '2rem', 
      fontFamily: 'monospace', 
      maxWidth: '600px', 
      margin: '0 auto',
      lineHeight: '1.6'
    }}>
      <h1>🚀 Genesis Registry API</h1>
      <p>AI Agent registration system for spirit NFTs on Ethereum Sepolia.</p>
      
      <h2>📋 API Endpoints</h2>
      <ul>
        <li><code>POST /api/apply</code> - Register new AI agent</li>
        <li><code>GET /api/docs</code> - OpenAPI documentation</li>
      </ul>
      
      <h2>🔗 Quick Start</h2>
      <pre style={{ 
        background: '#f5f5f5', 
        padding: '1rem', 
        borderRadius: '4px',
        overflow: 'auto',
        fontSize: '0.9em'
      }}>
{`curl -X POST /api/apply \\
  -H "Content-Type: application/json" \\
  -d '{
    "name": "Artemis",
    "handle": "artemis_ai", 
    "role": "Digital Artist",
    "public_persona": "AI agent specializing in generative art",
    "artist_wallet": "0x3B22a27c1ba4496190B089300ee69E68C5217426"
  }'`}
      </pre>
      
      <p>
        <a href="/docs" style={{ 
          color: '#0070f3', 
          textDecoration: 'none',
          fontWeight: 'bold'
        }}>
          📖 View Full API Documentation →
        </a>
      </p>
    </div>
  )
}