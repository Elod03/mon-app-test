import { useState } from 'react'

function App() {
  const [count, setCount] = useState(0)

  return (
    <div style={{ 
      padding: '50px', 
      textAlign: 'center',
      fontFamily: 'Arial, sans-serif'
    }}>
      <h1>🚀 Webhook React App</h1>
      <p>Cette application a été déployée automatiquement via webhook GitHub !</p>
    </div>
  )
}

export default App