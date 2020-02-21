import React from 'react';
import mapboxgl from 'mapbox-gl';
import db from '../data/db';

function renderPulse(map, context, size, offset, colors) {
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
  context.fillStyle = `rgba(${colors[0][0]}, ${colors[0][1]}, ${colors[0][2]}, ${1-t})`;
  context.fill();
  context.beginPath();
  context.arc(
    size / 2,
    size / 2,
    radius,
    0,
    Math.PI * 2
  );
  context.fillStyle = `rgba(${colors[1][0]}, ${colors[1][1]}, ${colors[1][2]}, 1)`;
  context.strokeStyle = 'white';
  context.lineWidth = 2 + 4 * (1 - t);
  context.fill();
  context.stroke();
  map.triggerRepaint();
  return true;
};

let eventToFeatureJSON = (event) => {
  let { title, issue, lat, lng, link, isInternet, domain } = event;
  if(isInternet) {
    lat = Math.random();
    lng = Math.random();
  }
  return {
    'type': 'Feature',
    'properties': {
      'category': domain,
      'title': title,
      'description': issue,
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
    map.on('move', () => {
      this.setState({
        lng: map.getCenter().lng.toFixed(4),
        lat: map.getCenter().lat.toFixed(4),
        zoom: map.getZoom().toFixed(2)
      });
    });
    map.on('load', () => {
      let domains = [...new Set(db.map(item => item.domain))];
      let domainToColors = domains.reduce((acc, domain) => {
        let r = Math.floor(Math.random() * 155);
        let g = Math.floor(Math.random() * 155);
        let b = Math.floor(Math.random() * 155);
        acc[domain] = [[r + 200, g + 200, b + 200], [r + 100, g + 100, b + 100]];
        return acc;
      }, {});
      
      db.map(item => eventToFeatureJSON(item)).forEach((marker, i) => {
        let item = db[i];
        let canvas = document.createElement('canvas');
        canvas.width = 50;
        canvas.height = 50;
        let context = canvas.getContext('2d');
        let offset = Math.random() * 1000;
        let colors = domainToColors[item.domain];
        let markerRender = () => {
          renderPulse(map, context, 50, offset, colors);
          requestAnimationFrame(markerRender);
        };
        requestAnimationFrame(markerRender);
        let popUpHTML = `<h3>${marker.properties.title}</h3>
          <p><i>${marker.properties.category}</i></p>
          <p>${marker.properties.description}</p>
          <a target="_blank" href="${marker.properties.link}">More Info</a>`;
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
        <div className="overlap-box">
          <a target="_blank" href="https://google.com">View Dataset</a>
        </div>
        <div id="#map" ref={elem => this.mapContainer = elem}
          style={{ width: width + 'px', height: height + 'px' }} />
      </div>
    );
  }

}

export default Map;
