import React from 'react';
import mapboxgl from 'mapbox-gl';
import db from '../data/db';

const size = 100;
let pulseImg = (map) => {
  return {
    width: size,
    height: size,
    data: new Uint8Array(size * size * 4),
    onAdd: function () {
      var canvas = document.createElement('canvas');
      canvas.width = this.width;
      canvas.height = this.height;
      this.context = canvas.getContext('2d');
    },
    render: function () {
      var duration = 1000;
      var t = (performance.now() % duration) / duration;
      var radius = (size / 2) * 0.3;
      var outerRadius = (size / 2) * 0.7 * t + radius;
      var context = this.context;
      context.clearRect(0, 0, this.width, this.height);
      context.beginPath();
      context.arc(
        this.width / 2,
        this.height / 2,
        outerRadius,
        0,
        Math.PI * 2
      );
      context.fillStyle = 'rgba(255, 200, 200,' + (1 - t) + ')';
      context.fill();
      context.beginPath();
      context.arc(
        this.width / 2,
        this.height / 2,
        radius,
        0,
        Math.PI * 2
      );
      context.fillStyle = 'rgba(255, 100, 100, 1)';
      context.strokeStyle = 'white';
      context.lineWidth = 2 + 4 * (1 - t);
      context.fill();
      context.stroke();
      this.data = context.getImageData(
        0,
        0,
        this.width,
        this.height
      ).data;
      map.triggerRepaint();
      return true;
    }
  }
};

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
      style: 'mapbox://styles/marthacz/ck6kzsm6h0m4g1imnbigf7xlz',
      center: [this.state.lng, this.state.lat],
      zoom: this.state.zoom
    });
    map.on('load', () => {
      let popup = new mapboxgl.Popup({
        closeButton: false,
        closeOnClick: false
      });
      map.addImage('pulsing-dot', pulseImg(map), { pixelRatio: 2 });
      map.addSource('points', {
        'type': 'geojson',
        'data': {
          'type': 'FeatureCollection',
          'features': [
            {
              'type': 'Feature',
              'geometry': {
                'type': 'Point',
                'coordinates': [0, 0]
              }
            }
          ]
        }
      });
      map.addLayer({
        'id': 'points',
        'type': 'symbol',
        'source': 'points',
        'layout': {
          'icon-image': 'pulsing-dot'
        }
      });
    });
    window.addEventListener('resize', () => {
      this.setState({ width: window.innerWidth, height: window.innerHeight });
    });
  }

  render() {
    let { width, height } = this.state;
    return (
      <div>
        <div id="#map" ref={elem => this.mapContainer = elem}
          style={{ width: width + 'px', height: height + 'px' }} />
      </div>
    );
  }

}

export default Map;
