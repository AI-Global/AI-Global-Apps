import React from 'react';
import { ResponsiveBar } from '@nivo/bar'
import db from '../data/db';

class Chart extends React.Component {

  constructor(props) {
    super(props);
    this.state = {};
  }

  render() {
    let maxCnt = 0;
    let itemsByType = db.reduce((acc, item) => {
      if(!(item.type in acc)) {
        acc[item.type] = [];
      }
      acc[item.type].push(item);
      maxCnt = Math.max(maxCnt, acc[item.type].length);
      return acc;
    }, {});
    let types = Object.keys(itemsByType);
    types.sort((a, b) => itemsByType[b].length - itemsByType[a].length);
    let data = types.map(type => {
      let items = itemsByType[type];
      let d = {
        org: type
      };
      for(let i = 0; i < maxCnt; i++) {
        d['item' + i] = items[i] ? 1 : null;
      }
      return d;
    });
    let keys = [];
    for(let i = 0; i < maxCnt; i++) {
      keys.push('item' + i);
    }
    let Tooltip = ({ id, indexValue }) => {
      let item = itemsByType[indexValue][parseInt(id.replace('item', ''))];
      return <span>{item.name}</span>;
    };
    return (
      <ResponsiveBar
        data={data}
        keys={keys}
        enableLabel={false}
        tooltip={Tooltip}
        indexBy="org"
        margin={{ top: 50, right: 130, bottom: 50, left: 60 }}
        padding={0.3}
        colors={{ scheme: 'nivo' }}
        axisTop={null}
        axisRight={null}
        axisBottom={{
          tickSize: 5,
          tickPadding: 5,
          tickRotation: 10,
          legend: 'Organization Types',
          legendPosition: 'middle',
          legendOffset: 40
        }}
        axisLeft={{
          tickSize: 5,
          tickPadding: 5,
          tickRotation: 0,
          legend: 'Organizations',
          legendPosition: 'middle',
          legendOffset: -40
        }}
        labelSkipWidth={12}
        labelSkipHeight={12}
        animate={true}
        motionStiffness={90}
        motionDamping={15}
      />
    );
  }

}

export default Chart;
