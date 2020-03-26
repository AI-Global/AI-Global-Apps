import React from 'react';
import './App.css';

import Chart from './components/Chart'

function App() {
  return (
    <div className="App" style={{height: (window.innerHeight - 10) + 'px'}}>
      <Chart />
    </div>
  );
}

export default App;
