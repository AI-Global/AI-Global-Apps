import React from 'react';
import { ResponsiveBubble } from '@nivo/circle-packing'
import db from '../data/db';

const COLORS = [
  [0, 173, 159],
  [0, 173, 242],
  [45, 65, 255],
  [242, 232, 0],
  [242, 145, 0],
  [255, 92, 92],
  [174, 92, 255],
  [58, 0, 116],
  [0, 87, 24]
];
let itemsByType = db.reduce((acc, item) => {
  if (!(item.type in acc)) {
    acc[item.type] = []
  }
  acc[item.type].push(item);
  return acc;
}, {});
let typeToColor = {};
Object.keys(itemsByType).map((type, i) => typeToColor[type] = COLORS[i]);

class Chart extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      selected: null,
      selectedTypes: Object.keys(itemsByType)
    };
  }

  onClick(node) {
    let { selected } = this.state
    if (selected && selected.id == node.id || node.depth == 1) {
      this.setState({ selected: null });
    } else {
      this.setState({ selected: node });
    }
  }

  getLabel(node) {
    return "";
  }

  getColor(node) {
    let c;
    if (node.depth == 0) {
      c = [255, 255, 255];
    } else if (node.depth == 1) {
      c = typeToColor[node.type];
    } else {
      let tc = typeToColor[node.type];
      c = [tc[0] + 20, tc[1] + 20, tc[2] + 20];
    }
    return `rgb(${c[0]}, ${c[1]}, ${c[2]})`;
  }

  getTooltip({ node }) {
    if (node.depth == 1) {
      return node.data.type;
    } else if (node.depth == 2) {
      return node.data.org;
    }
    return '...';
  }

  onCheckClick(type) {
    this.setState(state => {
      if (state.selectedTypes.includes(type)) {
        state.selectedTypes = state.selectedTypes.filter(x => x != type);
      } else {
        state.selectedTypes.push(type);
      }
      return state;
    });
  }

  render() {
    let { selectedTypes, selected } = this.state;
    let nodesByType = db.reduce((acc, item) => {
      if (!selectedTypes.includes(item.type)) {
        return acc;
      }
      if (!(item.type in acc)) {
        acc[item.type] = {
          id: item.type,
          type: item.type,
          value: 0,
          children: []
        };
      }
      acc[item.type].value += 1;
      acc[item.type].children.push({
        id: acc[item.type].children.length + ' ' + item.activity,
        type: item.type,
        org: item.organization,
        link: item.link,
        value: 1
      });
      return acc;
    }, {});
    let root = {
      id: 'Responsible AI',
      value: 1,
      color: "root",
      children: Object.values(nodesByType)
    };
    return (
      <div style={{ height: (window.innerHeight - 10) + 'px' }}>
        <div className="title-box">
          <h1 style={{ margin: 'auto', width: '40%', marginBottom: '20px' }}>AI Documentation Across Organization Type</h1>
          <h5 style={{ margin: 'auto', width: '40%' }}>Hover over a small bubble to see the specific organization and click on the link to learn more.</h5>
        </div> 
        <div className="legend-box">
          <p>Types</p>
          {Object.keys(itemsByType).map((type) => <div>
            <input type="checkbox" checked={selectedTypes.includes(type)} onClick={() => this.onCheckClick(type)} />
            <div style={{ backgroundColor: 'rgb(' + typeToColor[type].join(',') + ')' }} className="color-block"></div> {type}</div>)}
          <br />
          <a target="_blank" href="https://portal.ai-global.org/dataset/ai-documentation-across-organization-types">View Dataset</a>
          <a target="_blank" href="https://docs.google.com/forms/d/e/1FAIpQLSe7E8R_tWxqpko8zaMASTmjUonD9438XlFlP6IA238dMtYkqg/viewform">Submit a Documentation</a>
        </div>
        {selected && <div style={{ position: 'fixed', zIndex: 10, top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}>
          <p><b>{selected.data.org}</b></p>
          <a href={selected.data.link}>More Info</a>
        </div>}
        <ResponsiveBubble
          padding={30}
          margin={{ top: 100, right: 0, bottom: 0, left: 0 }}
          leavesOnly={false}
          colors={(n) => this.getColor(n)}
          onClick={(n) => this.onClick(n)}
          labelSkipRadius={0}
          label={(n) => this.getLabel(n)}
          labelTextColor={{ from: "color", modifiers: [["darker", 2]] }}
          root={root}
          animate={true}
          motionStiffness={100}
          motionDamping={20}
          tooltip={(n) => this.getTooltip(n)}
        />
      </div>
    );
  }

}

export default Chart;
