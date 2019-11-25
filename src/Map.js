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
        for (let i = 0; i < this.props.graph.length; i++) {
            let x = 50 * i;
            let node = this.props.graph[i];
            c.fillRect(x, 10, 10, 10)
            c.fillText(node.id, x, 10)
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