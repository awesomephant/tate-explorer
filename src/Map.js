import React from 'react';
import './Map.css';

export default class Map extends React.Component {
    constructor(props) {
        super(props)
        this.canvasRef = React.createRef()
        this.draw = this.draw.bind(this);
    }
    componentDidMount() {
        this.draw()
    }
    componentDidUpdate() {
        this.draw()
    }
    draw() {
        const c = this.canvasRef.current.getContext('2d')
        let x = 250;
        let y = 480;
        let done = false;
        let currentNode = 'entrance';

        c.fillRect(x,y,10,10)
        if (currentNode.north){
            
        }

    }
    render() {
        return (
            <div className='map'>
                <canvas width='500' height='500' ref={this.canvasRef}></canvas>
            </div>
        )
    }
}