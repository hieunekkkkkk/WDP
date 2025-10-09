import React from 'react'
import { PuffLoader } from 'react-spinners';

function LoadingScreen() {
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh',
      flexDirection: 'column'
    }}>
      <PuffLoader size={90} />
      <p style={{ marginTop: '16px', fontSize: '18px', color: '#333' }}></p>
    </div>
  )
}

export default LoadingScreen