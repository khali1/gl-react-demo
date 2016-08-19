import React, { Component } from 'react';
import R from './renderers';
import { Surface } from 'gl-react-dom';
import GL from 'gl-react';
import { AutoSizer } from 'react-virtualized';

import './App.css';

const filters = ["NONE", "INKWELL", "MAYFAIR", "LOFI", "EARLYBIRD", "F1977", "WALDEN", "XPRO", "BROOKLYN", "GINGHAM", "REYES", "HUDSON"];
const transitions = ["CROSSFADE", "CUT", "FADE_COLOR", "RAYTRACED_SPHERE", "BLUR", "GLITCH_DISPLACE", "CROSSHATCH", "UNDULATING_BURN_OUT", "STAR_WIPE", "CUBE", "SWAP", "FLASH", "BURN", "RANDOM_SQUARES", "CROSS_ZOOM", "DIRECTIONAL_WIPE", "HEART", "DOORWAY", "PAGE_CURL", "SLIDE", "MOSAIC", "SIMPLE_FLIP", "SQUARE_SWIPE", "DREAMY", "FOLD", "SQUEEZE", "CIRCLE_OPEN", "RIPPLE"]

export default class App extends Component {
  constructor() {
    super();
    this.state = {
      time: 0,
      activeRenderer: 0,
      tProgress: 0,
      activeFilterA: 'NONE',
      activeFilterB: 'NONE',
      activeTransition: 'CROSSFADE'
    };
  }

  componentDidMount() {
    const loop = time => {
      requestAnimationFrame(loop);
      this.setState({time});
    };
    requestAnimationFrame(loop);
  }

  changeProgress(tProgress) {
    this.setState({tProgress});
  }

  togglePlay(ref) {
    const video = this[ref];
    if (video) {
      if (!video.paused) {
        video.pause();
      } else {
        video.play();
      }
    }
  }

  renderRenderer(width) {
    const {
      activeRenderer,
      time,
      tProgress,
      activeFilterA,
      activeFilterB,
      activeTransition } = this.state;

    const height = width * 9/16;

    switch(activeRenderer) {
    case 0:
      return <Surface width={width} height={height}>
        <R.HelloWorld width={width} height={height} time={time}/>
      </Surface>;
    case 1:
      return <Surface width={width} height={height}>
        <R.Video width={width} height={height}>
          <video ref={vid => {this.videoA = vid}} src="/dist/demo.mp4" />
        </R.Video>
      </Surface>;
    case 2:
      return <Surface width={width} height={height}>
        <R.FilteredVideo filter={activeFilterA} width={width} height={height}>
          <video ref={vid => {this.videoA = vid}} src="/dist/demo.mp4" />
        </R.FilteredVideo>
      </Surface>;
    case 3:
      return <Surface width={width} height={height}>
        <R.FilteredVideoTransition transition={activeTransition} progress={tProgress} width={width} height={height}>
          <GL.Uniform name="from">
            <R.FilteredVideo filter={activeFilterA} width={width} height={height}>
              <video ref={vid => {this.videoA = vid}} src="/dist/demo.mp4" />
            </R.FilteredVideo>
          </GL.Uniform>
          <GL.Uniform name="to">
            <R.FilteredVideo filter={activeFilterB} width={width} height={height}>
              <video ref={vid => {this.videoB = vid}} src="/dist/demo.mp4" />
            </R.FilteredVideo>
          </GL.Uniform>
        </R.FilteredVideoTransition>
      </Surface>;
    default:
      return <Surface width={width} height={height}>
        <R.HelloWorld width={width} height={height} time={time}/>
      </Surface>;
    } 
  }

  renderBar(width) {
    return (
      <div style={{width: width, height: width * 7 / 16}}>
        <div style={{textAlign: 'center'}}>
          <div style={{display: 'inline-block'}}>
            <button onClick={()=>this.setState({activeRenderer: 0})}>HELLO WORLD</button>
            <button onClick={()=>this.setState({activeRenderer: 1})}>VIDEO</button>
            <button onClick={()=>this.setState({activeRenderer: 2})}>FILTERED VIDEO</button>
            <button onClick={()=>this.setState({activeRenderer: 3})}>FILTERED VIDEO TRANSITION</button>
          </div>
        </div>
        <div style={{textAlign: 'center'}}>
          <div style={{display: 'inline-block'}}>
            <button onClick={()=>this.togglePlay('videoA')}>v1: Play/Pause</button>
            <button onClick={()=>this.togglePlay('videoB')}>v2: Play/Pause</button>
          </div>
        </div>
        <div style={{textAlign: 'center'}}>
          <select onChange={(ev)=>this.setState({activeFilterA: ev.target.value})}>
            {filters.map(item => <option value={item}>{item}</option>)}
          </select>
          <select onChange={(ev)=>this.setState({activeFilterB: ev.target.value})}>
            {filters.map(item => <option value={item}>{item}</option>)}
          </select>
        </div>
        <div style={{textAlign: 'center'}}>
          <div style={{display: 'inline-block'}}>
            <input type="range" min={0} max={1000} step={1} onChange={(ev) => this.changeProgress(ev.target.value/1000)}/>
            <select onChange={(ev)=>this.setState({activeTransition: ev.target.value})}>
              {transitions.map(item => <option value={item}>{item}</option>)}
            </select>
          </div>
        </div>
      </div>
    );
  }

  render() {
    return (
      <AutoSizer disableHeight>
        {({width}) => [this.renderRenderer(width), this.renderBar(width)]}
      </AutoSizer>
    );
  }
}
