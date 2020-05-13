import React from 'react';
import mapboxgl from 'mapbox-gl';
import db from '../data/db';

function renderPulse(map, context, size, offset, domain, colors) {
  let duration = 1300;
  let t = (offset + performance.now() % duration) / duration;
  t = 0.8; // TODO remove animation
  let radius = (size / 2) * 0.3;
  let outerRadius = (size / 2) * 0.7 * t + radius;
  context.clearRect(0, 0, size, size);
  if (!domainToVisable[domain]) {
    return;
  }
  context.beginPath();
  context.arc(
    size / 2,
    size / 2,
    outerRadius,
    0,
    Math.PI * 2
  );
  context.fillStyle = `rgba(${colors[0][0]}, ${colors[0][1]}, ${colors[0][2]}, ${1 - t})`;
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

let domains = [...new Set(db.map(item => item.domain))];
let domainColors = [
  [148, 189, 255],
  [4, 236, 217],
  [6, 55, 234],
  [144, 7, 232],
  [221, 101, 20],
  [188, 10, 10],
  [79, 34, 1],
  [0, 86, 31],
  [104, 110, 153],
  [255, 97, 105]
];

let domainToColors = {};
let domainToVisable = {};
for (let dIdx in domains) {
  let [r, g, b] = domainColors[dIdx];
  domainToColors[domains[dIdx]] = [
    [r, g, b],
    [r + 50, g + 50, b + 50],
    `rgba(${r}, ${g}, ${b}, 1)`
  ];
  domainToVisable[domains[dIdx]] = true;
};

let eventToFeatureJSON = (event) => {
  let { title, issue, lat, lng, link, isInternet, domain, city, state, country } = event;
  let loc = "";
  if (city && state && country) {
    loc = `${city} ${state}, ${country}`;
  } else if (city && state) {
    loc = `${city}, ${state}`;
  } else if (state && country) {
    loc = `${state}, ${country}`;
  } else {
    loc = `${country || state || city}`;
  }
  return {
    'type': 'Feature',
    'properties': {
      'category': domain,
      'title': title,
      'description': issue,
      'location': loc,
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
      selected: ['Society', 'Law Enforcement', 'Business'],
      lng: 5,
      lat: 34,
      zoom: 1.7
    };
  }

  componentDidMount() {
    const map = new mapboxgl.Map({
      container: this.mapContainer,
      style: 'mapbox://styles/marthacz/ck6kzsm6h0m4g1imnbigf7xlz',
      center: [this.state.lng, this.state.lat],
      zoom: this.state.zoom
    });
    map.addControl(new mapboxgl.NavigationControl());
    map.on('move', () => {
      this.setState({
        lng: map.getCenter().lng.toFixed(4),
        lat: map.getCenter().lat.toFixed(4),
        zoom: map.getZoom().toFixed(2)
      });
    });
    map.on('load', () => {
      db.map(item => eventToFeatureJSON(item)).forEach((marker, i) => {
        let item = db[i];
        let canvas = document.createElement('canvas');
        canvas.width = 50;
        canvas.height = 50;
        let context = canvas.getContext('2d');
        let offset = Math.random() * 1000;
        let colors = domainToColors[item.domain];
        let popUpHTML = `<h3>${marker.properties.title}</h3>
          <p><i>${marker.properties.category}</i><br/>${marker.properties.location}</p>
          <p>${marker.properties.description}</p>`;
        if (marker.properties.link) {
          popUpHTML += `<a target="_blank" href="${marker.properties.link}">More Info</a>`;
        }
        let [x, y] = marker.geometry.coordinates;
        x += Math.random() * 0.5 - 0.25;
        y += Math.random() * 0.5 - 0.25;
        let mkr = new mapboxgl.Marker(canvas)
          .setLngLat([x, y])
          .setPopup(new mapboxgl.Popup({ offset: 25 }).setHTML(popUpHTML))
          .addTo(map);
        let markerRender = () => {
          renderPulse(map, context, 50, offset, item.domain, colors);
          requestAnimationFrame(markerRender);
        };
        requestAnimationFrame(markerRender);
      });
    });
    window.addEventListener('resize', () => {
      this.setState({ width: window.innerWidth, height: window.innerHeight });
    });
  }

  onClickDomain(domain) {
    this.setState(state => {
      if (state.selected.includes(domain)) {
        domainToVisable[domain] = false;
        state.selected = state.selected.filter(x => x != domain);
      } else {
        domainToVisable[domain] = true;
        state.selected.push(domain);
      }
      return state;
    });
  }

  render() {
    let { width, height, zoom, selected } = this.state;
    return (
      <div>
        <div className="logo-box">
          <img src="/transparent-rect-logo.png" />
        </div>
        <div className="legend-box">
          <p>Domains</p>
          {domains.map(domain =>
            <div>
              <input type="checkbox" checked={selected.includes(domain)} onClick={() => this.onClickDomain(domain)} />
              <div style={{ backgroundColor: domainToColors[domain][2] }} className="color-block"></div> {domain}</div>)}
          <br />
          <div style={{textAlign: 'center'}}>
            <a target="_blank" href="https://portal.ai-global.org/dataset/ai-violation-use-cases">View Dataset</a>
            <br/>
            <a target="_blank" href="https://docs.google.com/forms/d/e/1FAIpQLSeo4ZcT48qYDA3Z4GgRF8TjNLVuHpAvt9I1rVDX87usskLoVQ/viewform">Submit a use case</a>
          </div>
        </div>
        <div className="title-box">
          <h1 style={{ margin: 'auto', width: '40%', marginBottom: '20px' }}>Where AI Has Gone Wrong</h1>
          {zoom < 3.55 && <h5 style={{ margin: 'auto', width: '40%' }}>Where AI Has Gone Wrong represents historical instances of where AI has adversely impacted society in a specific domain. Click on a dot for a brief description and a link for more information! If a dot is traveling, it means the case impacts society across country borders on the Internet.</h5>}
        </div> 
        <div id="#map" ref={elem => this.mapContainer = elem}
          style={{ width: width + 'px', height: height + 'px' }} />
      </div>
    );
  }

}

export default Map;
