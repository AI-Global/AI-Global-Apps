import React from 'react';
import mapboxgl from 'mapbox-gl';
import db from '../data/db';

function renderPulse(map, context, size, offset) {
  let duration = 1300;
  let t = (offset + performance.now() % duration) / duration;
  let radius = (size / 2) * 0.3;
  let outerRadius = (size / 2) * 0.7 * t + radius;
  context.clearRect(0, 0, size, size);
  context.beginPath();
  context.arc(
    size / 2,
    size / 2,
    outerRadius,
    0,
    Math.PI * 2
  );
  context.fillStyle = 'rgba(255, 200, 200,' + (1 - t) + ')';
  context.fill();
  context.beginPath();
  context.arc(
    size / 2,
    size / 2,
    radius,
    0,
    Math.PI * 2
  );
  context.fillStyle = 'rgba(255, 100, 100, 1)';
  context.strokeStyle = 'white';
  context.lineWidth = 2 + 4 * (1 - t);
  context.fill();
  context.stroke();
  map.triggerRepaint();
  return true;
};

let eventToFeatureJSON = (event) => {
  let {title, desc, lat, lng, link} = event;
  return {
    'type': 'Feature',
    'properties': {
      'title': title,
      'description': desc,
      'link': link
    },
    'geometry': {
      'type': 'Point',
      'coordinates': [lng, lat]
    }
  };
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
      db.map(item => eventToFeatureJSON(item)).forEach((marker, i) => {
        let canvas = document.createElement('canvas');
        canvas.width = 50;
        canvas.height = 50;
        let context = canvas.getContext('2d');
        let offset = Math.random() * 1000;
        let markerRender = () => {
          renderPulse(map, context, 50, offset);
          requestAnimationFrame(markerRender);
        };
        requestAnimationFrame(markerRender);
        let popUpHTML = `<h3>${marker.properties.title}</h3>
          <p>${marker.properties.description}</p>
          <a href="${marker.properties.link}">More Info</a>`;
        new mapboxgl.Marker(canvas)
          .setLngLat(marker.geometry.coordinates)
          .setPopup(new mapboxgl.Popup({ offset: 25 }).setHTML(popUpHTML))
          .addTo(map);
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
