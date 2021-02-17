import React from 'react';
import mapboxgl from 'mapbox-gl';
import db from '../data/db';
import { Slider } from 'antd';
import { withStyles } from '@material-ui/core/styles';
import FormGroup from '@material-ui/core/FormGroup';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import Checkbox from '@material-ui/core/Checkbox';
import { makeStyles } from '@material-ui/core/styles';
import clsx from 'clsx';
import Drawer from '@material-ui/core/Drawer';
import Fab from '@material-ui/core/Fab';
import AddIcon from '@material-ui/icons/Add';
import BeenhereIcon from '@material-ui/icons/Beenhere';
import Tooltip from '@material-ui/core/Tooltip';
import ClickAwayListener from '@material-ui/core/ClickAwayListener';
import StorageIcon from '@material-ui/icons/Storage';
import FilterListIcon from '@material-ui/icons/FilterList';
import TitleBox from '../components/TitleBox';

// Clean input data inplace
const dataset = db
  .filter(({ lat, lng }) => lat && lng)
  .map((item, i) => {
    item.domain = item.domain.trim();
    item.isGood = item.is_good.trim();
    item.year = parseInt(item.year);
    item.yearFormatted = '' + item.year;
    item.id = i;
    return item;
  });

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

let initialDomainsSelected = ['Society', 'Law Enforcement', 'Business'];

let domains = [...new Set(dataset.map((item) => item.domain.trim()))];

let initialGoodnessSelected = ['Helpful', 'Harmful'];

let goodness = [...new Set(dataset.map((item) => item.is_good.trim()))];

// UX DESIGN: if you ever need to change the colors
// Add the hex triplet
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
let endYear = 2021;
for (let yr = startYear; yr <= endYear; yr += 1) {
  yearMarks[yr] = {
    style: {
      fontSize: '1.3em',
    },
    label: <strong>{yr}</strong>,
  };
}

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

let rgbToHex = (r, g, b) => {
  return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
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
      dataset
        .map((item) => eventToFeatureJSON(item))
        .forEach((marker, i) => {
          let item = dataset[i];
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
          <hr/>
          <p><em><strong>${marker.properties.category} &#183; ${marker.properties.isGood}</strong></em></p>
          <p>${marker.properties.location}</p>
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
    for (let item of dataset) {
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
    let { width, height, selected, selectedGood } = this.state;
    return (
      <div>
        <div className="logo-box">
          <a target="_blank" rel="noopener noreferrer" href="https://ai-global.org/">
            <img alt="AI Global Logo" src="/transparent-rect-logo.png" />
          </a>
          <License />
        </div>
        <SideDrawer
          selected={selected}
          selectedGood={selectedGood}
          onClickDomain={this.onClickDomain.bind(this)}
          onClickGoodness={this.onClickGoodness.bind(this)}
        />
        <TitleBox />
        <InfoBox />
        <DataBox />
        <CaseBox />
        <div className="slider-box">
          <Slider
            style={{ width: '95%', margin: 'auto' }}
            onChange={(v) => this.onYearSliderChange(v)}
            range
            marks={yearMarks}
            min={startYear}
            max={endYear}
            step={null}
            defaultValue={[startYear, endYear]}
            tipFormatter={null}
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
      <a rel="license noopener noreferrer" href="http://creativecommons.org/licenses/by/4.0/" target="_blank">
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

const CustomColorCheckbox = (props) => {
  const CustomizedCheckbox = withStyles({
    root: {
      color: props.color,
      '&$checked': {
        color: props.color,
      },
    },
    checked: {},
  })((props) => <Checkbox {...props} />);
  return <CustomizedCheckbox {...props} />;
};

const useStyles = makeStyles({
  list: {
    width: 250,
  },
});

function SideDrawer({ selected, selectedGood, onClickDomain, onClickGoodness }) {
  const classes = useStyles();
  const [state, setState] = React.useState({
    left: false,
  });

  const toggleDrawer = (anchor, open) => (event) => {
    if (event.type === 'keydown' && (event.key === 'Tab' || event.key === 'Shift')) {
      return;
    }
    setState({ ...state, [anchor]: open });
  };

  const list = (anchor) => (
    <ClickAwayListener onClickAway={toggleDrawer('left', false)}>
      <div
        className={clsx(classes.list, {
          [classes.fullList]: anchor === 'top' || anchor === 'bottom',
        })}
        role="presentation"
        style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}
      >
        <a style={{ marginTop: '20px' }} target="_blank" rel="noopener noreferrer" href="https://ai-global.org/">
          <img alt="AI Global Logo" src="/transparent-rect-logo.png" />
        </a>
        <FormGroup className="legend-box">
          <h3 style={{ margin: '0', marginTop: '20px' }}>
            <strong>Domains</strong>
          </h3>
          {domains.map((domain) => (
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <FormControlLabel
                control={
                  <CustomColorCheckbox
                    color={rgbToHex(...domainToColors[domain][0])}
                    checked={selected.includes(domain)}
                    onChange={() => onClickDomain(domain)}
                  />
                }
              />
              <p style={{ fontWeight: 'normal' }}>{domain}</p>
            </div>
          ))}
          <hr />
          <h3 style={{ margin: '0', marginTop: '20px' }}>
            <strong>Where AI Has Been...</strong>
          </h3>
          {goodness.map((isGood) => (
            <FormControlLabel
              style={{ fontSize: '0.6rem', marginRight: '0', padding: '0' }}
              control={
                <CustomCheckbox checked={selectedGood.includes(isGood)} onChange={() => onClickGoodness(isGood)} />
              }
              label={isGood}
            />
          ))}
        </FormGroup>
      </div>
    </ClickAwayListener>
  );

  const LightTooltip = withStyles((theme) => ({
    arrow: {
      color: '#00ADEE',
    },
    tooltip: {
      backgroundColor: 'white',
      color: '#00ADEE',
      boxShadow: theme.shadows[1],
      fontSize: 15,
      width: '120px',
    },
  }))(Tooltip);

  return (
    <div class="legend-box-button" style={{ zIndex: '10000' }}>
      <React.Fragment key={'left'}>
        <LightTooltip
          title={<p style={{ textAlign: 'center' }}>Add Filter to the Cases Displayed</p>}
          arrow
          placement="top"
        >
          <Fab variant="extended" style={{ backgroundColor: '#00ADEE' }} onClick={toggleDrawer('left', true)}>
            <div style={{ color: 'white', fontSize: '1.2em', display: 'flex', alignItems: 'center' }}>
              <FilterListIcon />
              &nbsp; <strong>Filter</strong>
            </div>
          </Fab>
        </LightTooltip>
        <Drawer anchor={'left'} open={state['left']} onClose={toggleDrawer('left', false)} style={{ zIndex: '10000' }}>
          {list('left')}
        </Drawer>
      </React.Fragment>
    </div>
  );
}

function InfoBox() {
  const LightTooltip = withStyles((theme) => ({
    arrow: {
      color: '#00ADEE',
    },
    tooltip: {
      backgroundColor: 'white',
      color: '#00ADEE',
      boxShadow: theme.shadows[1],
      fontSize: 15,
      width: '500px',
    },
  }))(Tooltip);

  return (
    <div className="info-box-button">
      <LightTooltip
        title={
          <p style={{ textAlign: 'center', marginBottom: '2px' }}>
            Check how your AI System performs with curated responsibility metrics from our{' '}
            <strong>
              <em>Responsible AI Design Assistant</em>
            </strong>
          </p>
        }
        arrow
        placement="top"
      >
        <Fab
          href="https://oproma.github.io/rai-trustindex/"
          target="_blank"
          rel="noopener noreferrer"
          variant="extended"
          style={{ backgroundColor: '#00ADEE' }}
        >
          <div style={{ color: 'white', fontSize: '1.2em', display: 'flex', alignItems: 'center' }}>
            <BeenhereIcon />
            &nbsp; <strong>Responsible AI Design Assistant</strong>
          </div>
        </Fab>
      </LightTooltip>
    </div>
  );
}

function DataBox() {
  const LightTooltip = withStyles((theme) => ({
    arrow: {
      color: '#00ADEE',
    },
    tooltip: {
      backgroundColor: 'white',
      color: '#00ADEE',
      boxShadow: theme.shadows[1],
      fontSize: 15,
      width: '175px',
    },
  }))(Tooltip);

  return (
    <div className="data-box-button">
      <LightTooltip
        title={<p style={{ textAlign: 'center', marginBottom: '2px' }}>Check out our Dataset</p>}
        arrow
        placement="top"
      >
        <Fab
          href="https://docs.google.com/spreadsheets/d/1hUAGsMGT-tbcboF6zzbtFHowT9k0yKjjy7K8hfbEuG8/edit#gid=0"
          target="_blank"
          rel="noopener noreferrer"
          variant="extended"
          style={{ backgroundColor: '#00ADEE' }}
        >
          <div style={{ color: 'white', fontSize: '1.2em', display: 'flex', alignItems: 'center' }}>
            <StorageIcon />
            &nbsp; <strong>DATASET &amp; STATS</strong>
          </div>
        </Fab>
      </LightTooltip>
    </div>
  );
}

function CaseBox() {
  const LightTooltip = withStyles((theme) => ({
    arrow: {
      color: '#00ADEE',
    },
    tooltip: {
      backgroundColor: 'white',
      color: '#00ADEE',
      boxShadow: theme.shadows[1],
      fontSize: 15,
      width: '120px',
    },
  }))(Tooltip);

  return (
    <div className="case-box-button">
      <LightTooltip
        title={<p style={{ textAlign: 'center', marginBottom: '2px' }}>Submit a case to add to our Map Dataset</p>}
        arrow
        placement="top"
      >
        <Fab
          href="https://docs.google.com/forms/d/e/1FAIpQLSeo4ZcT48qYDA3Z4GgRF8TjNLVuHpAvt9I1rVDX87usskLoVQ/viewform"
          target="_blank"
          rel="noopener noreferrer"
          variant="extended"
          style={{ backgroundColor: '#00ADEE' }}
        >
          <div style={{ color: 'white', fontSize: '1.2em', display: 'flex', alignItems: 'center' }}>
            <AddIcon />
            &nbsp; <strong>ADD CASE</strong>
          </div>
        </Fab>
      </LightTooltip>
    </div>
  );
}

export default Map;
