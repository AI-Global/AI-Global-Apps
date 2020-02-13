import React from 'react';
import mapboxgl from 'mapbox-gl';
import db from '../data/db';

class Map extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      width: window.innerWidth,
      height: window.innerHeight,
      lng: 5,
      lat: 34,
      zoom: 2
    };
  }

  componentDidMount() {
    const map = new mapboxgl.Map({
      container: this.mapContainer,
      style: 'mapbox://styles/mapbox/streets-v11', // todo update w/cool style
      center: [this.state.lng, this.state.lat],
      zoom: this.state.zoom
    });
    window.addEventListener('resize', () => {
      this.setState({ width: window.innerWidth, height: window.innerHeight});
    });
  }

  render() {
    let {width, height} = this.state;
    return (
      <div>
        <div id="#map" ref={elem => this.mapContainer = elem} 
          style={{width: width + 'px', height: height + 'px'}} />
      </div>
    );
  }

}

export default Map;
