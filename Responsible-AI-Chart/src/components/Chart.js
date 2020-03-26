import React from 'react';
import { ResponsiveBubble } from '@nivo/circle-packing'
import db from '../data/db';

class Chart extends React.Component {

  constructor(props) {
    super(props);
    this.state = {};
  }

  onClick(node) {
    console.log(node);
  }

  render() {
    let itemsByType = db.reduce((acc, item) => {
      if (!(item.type in acc)) {
        acc[item.type] = {
          id: item.type,
          color: item.type + '!',
          value: 0,
          children: []
        };
      }
      acc[item.type].value += 1;
      acc[item.type].children.push({
        id: item.name,
        color: item.type,
        value: 1
      });
      return acc;
    }, {});
    let root = {
      id: 'Responsible AI',
      value: 1,
      color: "root",
      children: Object.values(itemsByType)
    };
    return (
      <ResponsiveBubble 
        onClick={(node) => this.onClick(node)}
        colorBy={(({color}) => color)}
        labelSkipRadius={1000}
        root={root}
        animate={true}
        motionStiffness={90}
        motionDamping={12}
      />
    );
  }

}

export default Chart;
