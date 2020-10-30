import React from 'react';
import { Modal, Button } from 'antd';
import 'antd/dist/antd.css';
import HelpOutlineIcon from '@material-ui/icons/HelpOutline';
import PublicIcon from '@material-ui/icons/Public';

class TitleBox extends React.Component {
  state = {
    modalVisible: true,
  };

  setModalVisible(modalVisible) {
    this.setState({ modalVisible });
  }

  render() {

    return (
      <div class="title-box">
        <button style={{color: "#272727", fontSize: "2.5em", outline: "none", backgroundColor: "transparent", border: "none"}} onClick={() => this.setModalVisible(true)}>
          <p><strong>Where in the World is AI? <HelpOutlineIcon/></strong></p>
        </button>
        <Modal
          title={<div style={{display: "flex", alignItems: "center"}}>
             <PublicIcon style={{color: "#00ADEE"}}/> <p style={{margin: "0"}}>&nbsp;<strong>Welcome to the Where in the World is AI Map!</strong></p>
            </div>}
          centered
          visible={this.state.modalVisible}
          onCancel={() => this.setModalVisible(false)}
          footer={[<Button key="Continue" onClick={() => this.setModalVisible(false)}>
              Continue
            </Button>,]}
        >
          <p>Everyone is talking about AI, but <strong>how and where is it actually being used?</strong>
            We've mapped out interesting examples where AI has been harmful and where it's been helpful. Cases 
            are aggregated by AI Global, Awful AI, and Charlie
            Pownall/CPC &amp; Associates (
            <a href="https://docs.google.com/spreadsheets/d/1Bn55B4xz21-_Rgdr8BBb2lt0n_4rzLGxFADMlVW0PYI/edit#gid=364376814"
            target="_blank"
            rel="noopener noreferrer">Link</a>).
           </p>
           <p style={{marginBottom: "0"}}><strong>How does the Map work?</strong></p>
           <ul>
               <li>Configure desired time period on bottom by <strong>dragging the slider</strong></li>
               <li><strong>Click on points</strong> to see individual cases</li>
               <li>Filter types of cases through the <strong>filter button on bottom left</strong></li>
               <li>Cases are organized by <strong>domains via color coding</strong></li>
           </ul>
        </Modal>
      </div>
    );
  }
}

export default TitleBox;