import React from 'react';
import mapboxgl from 'mapbox-gl';
import db from '../data/db';
import { Slider } from 'antd';
import { withStyles } from '@material-ui/core/styles';
import FormGroup from '@material-ui/core/FormGroup';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import Checkbox from '@material-ui/core/Checkbox';
import CheckBoxOutlineBlankIcon from '@material-ui/icons/CheckBoxOutlineBlank';
import CheckBoxIcon from '@material-ui/icons/CheckBox';
import Favorite from '@material-ui/icons/Favorite';
import FavoriteBorder from '@material-ui/icons/FavoriteBorder';
import { makeStyles } from '@material-ui/core/styles';
import Accordion from '@material-ui/core/Accordion';
import AccordionSummary from '@material-ui/core/AccordionSummary';
import MuiAccordionSummary from '@material-ui/core/AccordionSummary';
import AccordionDetails from '@material-ui/core/AccordionDetails';
import Typography from '@material-ui/core/Typography';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';

// renderPulse - Function to render dot -regardless if bad/good
function renderPulse(map, context, size, offset, domain, colors) {
  let t = 0.8;
  let radius = (size / 2) * 0.3;
  context.clearRect(0, 0, size, size);
  context.beginPath();
  context.arc(size / 2, size / 2, radius, 0, Math.PI * 2);
  context.fillStyle = `rgba(${colors[1][0]}, ${colors[1][1]}, ${colors[1][2]}, 1)`;
  context.strokeStyle = 'white';
  context.lineWidth = 2 + 4 * (1 - t);
  context.fill();
  context.stroke();
  map.triggerRepaint();
  return true;
}
// renderPulseGood - function for drawing a star
// think of size as the plot, "can only be in this space"
// always need map, context,size,offset
function renderPulseGood(map, context, size, offset, domain, colors, isGood) {
  let alpha = (2 * Math.PI) / 10;
  let radius = size * 0.2;
  let starXY = [size / 2, size / 2];
  context.clearRect(0, 0, size, size);
  context.beginPath();

  // Star Formula
  for (let i = 11; i !== 0; i--) {
    let r = (radius * ((i % 2) + 1.0)) / 2.0;
    let omega = alpha * i;
    context.lineTo(r * Math.sin(omega) + starXY[0], r * Math.cos(omega) + starXY[1]);
  }

  context.closePath();

  // Fills in color of the domain
  context.fillStyle = `rgba(${colors[1][0]}, ${colors[1][1]}, ${colors[1][2]}, 1)`;
  context.strokeStyle = 'white';
  context.fill();
  context.stroke();
  map.triggerRepaint();
  return true;
}

// Define variables
let initialDomainsSelected = ['Society', 'Law Enforcement', 'Business'];

let domains = [...new Set(db.map((item) => item.domain.trim()))];

let initialGoodnessSelected = ['Helpful', 'Harmful'];

let goodness = [...new Set(db.map((item) => item.is_good.trim()))];

// UX DESIGN: if you ever need to change the colors
//Add the hex triplet
let domainColors = [
  [148, 189, 255],
  [4, 236, 217],
  [6, 55, 234],
  [144, 7, 232],
  [221, 101, 20],
  [188, 10, 10],
  //Society
  [139, 236, 4],
  //Vision
  [100, 4, 236],
  [104, 110, 153],
  [255, 97, 105],
];

let domainToColors = {};

for (let dIdx in domains) {
  let [r, g, b] = domainColors[dIdx];
  domainToColors[domains[dIdx]] = [[r, g, b], [r + 50, g + 50, b + 50], `rgba(${r}, ${g}, ${b}, 1)`];
}

let yearMarks = {};
let startYear = 2005;
let endYear = 2020;
for (let yr = startYear; yr <= endYear; yr += 1) {
  yearMarks[yr] = '' + yr;
}

// Clean input data inplace
db.map((item, i) => {
  item.domain = item.domain.trim();
  item.isGood = item.is_good.trim();
  item.year = parseInt(item.year);
  item.yearFormatted = '' + item.year;
  item.id = i;
  return item;
});

let eventToFeatureJSON = (event) => {
  let { title, issue, lat, lng, link, domain, city, state, country, isGood } = event;
  let loc = '';
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
    type: 'Feature',
    properties: {
      category: domain,
      title: title,
      description: issue,
      location: loc,
      link: link,
      isGood: isGood,
    },
    geometry: {
      type: 'Point',
      coordinates: [lng, lat],
    },
  };
};

class Map extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      width: window.innerWidth,
      height: window.innerHeight,
      selected: initialDomainsSelected,
      selectedGood: initialGoodnessSelected,
      selectedYears: Object.keys(yearMarks).map((yr) => parseInt(yr)),
      lng: 5,
      lat: 34,
      zoom: 1.7,
    };
  }

  componentDidMount() {
    window.gtag('send', 'mapview');
    const map = new mapboxgl.Map({
      container: this.mapContainer,
      style: 'mapbox://styles/marthacz/ck6kzsm6h0m4g1imnbigf7xlz',
      center: [this.state.lng, this.state.lat],
      zoom: this.state.zoom,
    });
    window.map = map;
    map.addControl(new mapboxgl.NavigationControl());
    map.on('move', () => {
      this.setState({
        lng: map.getCenter().lng.toFixed(4),
        lat: map.getCenter().lat.toFixed(4),
        zoom: map.getZoom().toFixed(2),
      });
    });
    map.on('load', () => {
      db.map((item) => eventToFeatureJSON(item)).forEach((marker, i) => {
        let item = db[i];
        let canvas = document.createElement('canvas');
        canvas.width = 50;
        canvas.height = 50;
        canvas.addEventListener('click', () => {
          window.gtag('send', 'click', {
            event_category: 'marker',
            event_label: item.title,
          });
        });
        let context = canvas.getContext('2d');
        let offset = Math.random() * 1000;
        let colors = domainToColors[item.domain];
        let popUpHTML = `<h3>${marker.properties.title}</h3>
          <p><i>${marker.properties.category}</i><p><i>${marker.properties.isGood}</i><br/>${marker.properties.location}</p>
          <p>${marker.properties.description}</p>`;
        if (marker.properties.link) {
          popUpHTML += `<a target="_blank" href="${marker.properties.link}">More Info</a>`;
        }
        let [x, y] = marker.geometry.coordinates;
        if (!item.dontShift) {
          x = parseFloat(x);
          y = parseFloat(y);
          x += Math.random() * 0.25 - 0.12;
          y += Math.random() * 0.25 - 0.12;
        }
        let mrkr = new mapboxgl.Marker(canvas)
          .setLngLat([x, y])
          .setPopup(new mapboxgl.Popup({ offset: 25 }).setHTML(popUpHTML));
        item.mrkr = mrkr;
        // For filter to work! (Functionality on legend)
        if (initialGoodnessSelected.includes(item.isGood) && initialDomainsSelected.includes(item.domain)) {
          mrkr.addTo(map);
        }
        let markerRender = () => {
          requestAnimationFrame(markerRender);
          // If the value in isGood ever changes, need to edit here
          if (item.isGood === 'Helpful') {
            renderPulseGood(map, context, 50, offset, item.domain, colors, item.isGood);
          } else {
            renderPulse(map, context, 50, offset, item.domain, colors);
          }
        };
        requestAnimationFrame(markerRender);
      });
    });
    window.addEventListener('resize', () => {
      this.setState({ width: window.innerWidth, height: window.innerHeight });
    });
  }

  updateMarkersShown(selected, selectedGood, selectedYears) {
    for (let item of db) {
      if (selectedGood.includes(item.isGood) && selected.includes(item.domain) && selectedYears.includes(item.year)) {
        item.mrkr.addTo(window.map);
      } else {
        item.mrkr.remove();
      }
    }
  }

  onClickDomain(domain) {
    window.gtag('send', 'click', {
      event_category: 'domain',
      event_label: domain,
    });
    this.setState((state) => {
      if (state.selected.includes(domain)) {
        state.selected = state.selected.filter((x) => x !== domain);
      } else {
        state.selected.push(domain);
      }
      this.updateMarkersShown(state.selected, state.selectedGood, state.selectedYears);
      return state;
    });
  }

  //onClickGoodness - Function to get legend filtering to work
  onClickGoodness(isGood) {
    window.gtag('send', 'click', {
      event_category: 'goodness',
      event_label: isGood,
    });
    this.setState((state) => {
      if (state.selectedGood.includes(isGood)) {
        state.selectedGood = state.selectedGood.filter((x) => x !== isGood);
      } else {
        state.selectedGood.push(isGood);
      }
      this.updateMarkersShown(state.selected, state.selectedGood, state.selectedYears);
      return state;
    });
  }

  onYearSliderChange(newRange) {
    let yearSelection = [];
    for (let i = newRange[0]; i <= newRange[1]; i++) {
      yearSelection.push(i);
    }
    this.setState((state) => {
      state.selectedYears = yearSelection;
      this.updateMarkersShown(state.selected, state.selectedGood, state.selectedYears);
      return state;
    });
  }

  render() {
    let { width, height, zoom, selected, selectedGood } = this.state;
    return (
      <div>
        <div className="logo-box">
          <a target="_blank" rel="noopener noreferrer" href="https://ai-global.org/">
            <img alt="AI Global Logo" src="/transparent-rect-logo.png" />
          </a>
          <License />
        </div>
        {/* <Legend
          selected={selected}
          selectedGood={selectedGood}
          onClickDomain={this.onClickDomain.bind(this)}
          onClickGoodness={this.onClickGoodness.bind(this)} 
        /> */}

        <CheckboxLabels
          selected={selected}
          selectedGood={selectedGood}
          onClickDomain={this.onClickDomain.bind(this)}
          onClickGoodness={this.onClickGoodness.bind(this)}
        />
        <TitleBox zoom={zoom} />
        <InfoBox />
        <div className="slider-box">
          <Slider
            onChange={(v) => this.onYearSliderChange(v)}
            range
            marks={yearMarks}
            min={startYear}
            max={endYear}
            step={null}
            defaultValue={[startYear, endYear]}
          />
        </div>
        <div
          id="#map"
          ref={(elem) => (this.mapContainer = elem)}
          style={{ width: width + 'px', height: height + 'px' }}
        />
      </div>
    );
  }
}

function License() {
  return (
    <div>
      <a rel="license" href="http://creativecommons.org/licenses/by/4.0/" target="_blank">
        <img
          title={
            'Where in the World is AI? AI Global is licensed under a Creative Commons Attribution 4.0 International License'
          }
          alt="Creative Commons License"
          style={{ borderWidth: 0 }}
          src="https://i.creativecommons.org/l/by/4.0/88x31.png"
        />
      </a>
    </div>
  );
}

// Custom Checkbox with AI Global Colors
const CustomCheckbox = withStyles({
  root: {
    color: '#00ADEE',
    '&$checked': {
      color: '#00ADEE',
    },
  },
  checked: {},
})((props) => <Checkbox color="#00ADEE" {...props} />);

// Alternative Legend
function CheckboxLabels({ selected, selectedGood, onClickDomain, onClickGoodness }) {
  return (
    <FormGroup className="legend-box custom-legend" style={{ width: '15%'}}>
      <Accordion className="legend-box" style={{paddingLeft: '10px', paddingRight: '10px'}} defaultExpanded>
        <AccordionSummary expandIcon={<ExpandMoreIcon />} aria-controls="panel1a-content" id="panel1a-header" style={{margin: '0', padding: '0'}}>
            <strong style={{margin: '0'}}>Filters</strong>
        </AccordionSummary>
        <AccordionDetails style={{ display: 'flex', flexDirection: 'column', margin: '0', padding: '0'}}>
          <p style={{margin: "0"}}><strong><em>Domains</em></strong></p>
          {domains.map((domain) => (
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <FormControlLabel
                style={{ marginRight: '0', padding: '0' }}
                control={<CustomCheckbox checked={selected.includes(domain)} onChange={() => onClickDomain(domain)} />}
              />
              <p>
                <div style={{ backgroundColor: domainToColors[domain][2] }} className="color-block"></div>
                &nbsp;{domain}
              </p>
            </div>
          ))}
          <p style={{margin: "0", paddingTop: '15px', borderTop: 'solid lightgrey 1px'}}><strong><em>Where AI has Gone...</em></strong></p>
          {goodness.map((isGood) => (
            <FormControlLabel
              style={{ fontSize: '0.6rem', marginRight: '0', padding: '0' }}
              control={
                <CustomCheckbox checked={selectedGood.includes(isGood)} onChange={() => onClickGoodness(isGood)} />
              }
              label={isGood}
            />
          ))}
        </AccordionDetails>
      </Accordion>
      {/* <Accordion className="legend-box custom-legend" style={{paddingLeft: '10px', paddingRight: '10px', marginTop: '0'}}>
        <AccordionSummary expandIcon={<ExpandMoreIcon style={{padding: '0'}}/>} aria-controls="panel1a-content" id="panel1a-header" style={{ margin: '0'}}>
          <Typography style={{margin: '0'}}>
            <strong style={{margin: '0', fontSize: '0.85em'}}>Where AI has Gone...</strong>
          </Typography>
        </AccordionSummary>
        <AccordionDetails style={{ display: 'flex', flexDirection: 'column', margin: '0', padding: '0' }}>
          {goodness.map((isGood) => (
            <FormControlLabel
              style={{ fontSize: '0.6rem', marginRight: '0', padding: '0' }}
              control={
                <CustomCheckbox checked={selectedGood.includes(isGood)} onChange={() => onClickGoodness(isGood)} />
              }
              label={isGood}
            />
          ))}
        </AccordionDetails>
      </Accordion> */}
    </FormGroup>
  );
}

function Legend({ selected, selectedGood, onClickDomain, onClickGoodness }) {
  return (
    <div className="legend-box">
      <p>Domains</p>
      {domains.map((domain) => (
        <div>
          <input type="checkbox" checked={selected.includes(domain)} onClick={() => onClickDomain(domain)} />
          <div style={{ backgroundColor: domainToColors[domain][2] }} className="color-block"></div> &nbsp; &nbsp;{' '}
          {domain}
        </div>
      ))}
      <br />
      <p> Where AI Has Gone...</p>
      {goodness.map((isGood) => (
        <div>
          <input type="checkbox" checked={selectedGood.includes(isGood)} onClick={() => onClickGoodness(isGood)} />
          {isGood}
        </div>
      ))}
      <br />
      <div style={{ textAlign: 'center' }}>
        <a
          target="_blank"
          rel="noopener noreferrer"
          href="https://docs.google.com/spreadsheets/d/1hUAGsMGT-tbcboF6zzbtFHowT9k0yKjjy7K8hfbEuG8/edit#gid=0"
        >
          View Dataset & Stats
        </a>
        <br />
        <a
          target="_blank"
          rel="noopener noreferrer"
          href="https://docs.google.com/forms/d/e/1FAIpQLSeo4ZcT48qYDA3Z4GgRF8TjNLVuHpAvt9I1rVDX87usskLoVQ/viewform"
        >
          Submit a case
        </a>
      </div>
    </div>
  );
}

function TitleBox({ zoom }) {
  return (
    <div className="title-box">
      <h1 style={{ margin: 'auto', width: '45%', marginBottom: '20px' }}>Where in the World is AI?</h1>
      {zoom < 3.55 && (
        <h5 style={{ margin: 'auto', width: '40%' }}>
          Everyone is talking about AI, but how and where is it actually being used? Since our mission is to ensure AI
          is protecting us instead of harming us, we’ve mapped out some cases where AI is being used well, and times
          where it has gone wrong. Cases are aggregated by AI Global, Awful AI, and Charlie Pownall/CPC & Associates{' '}
          <a href="https://docs.google.com/spreadsheets/d/1Bn55B4xz21-_Rgdr8BBb2lt0n_4rzLGxFADMlVW0PYI/edit#gid=364376814">
            (AI & Algorithmic Controversy Repository)
          </a>
        </h5>
      )}
    </div>
  );
}

function InfoBox() {
  return (
    <a target="_blank" rel="noopener noreferrer" href="https://oproma.github.io/rai-trustindex/">
      <button className="call-to-action-button" type="submit">
        The negative consequences of AI can be prevented by focusing on a responsible design, development and
        implementation of AI.
        <br />
        <br />
        Check your AI with our <em>Design Assistant</em>
      </button>
    </a>
  );
}

export default Map;
