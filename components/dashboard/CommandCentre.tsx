/* Fixed version - stray CSS removed from JSX */
'use client';

import React from 'react';

export default function CommandCentre() {
  return (
    <div className="command-centre">
      <h1>Command Centre</h1>
      <p>Dashboard is loading...</p>
      <style jsx>{`
        .command-centre {
          padding: 20px;
          color: white;
          background: #111;
        }
      `}</style>
    </div>
  );
}
