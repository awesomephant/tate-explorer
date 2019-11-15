import React from 'react'
import game from './game.json'
import './Game.css'

export default class Game extends React.Component {
    constructor(props) {
        super()
        this.state = {
            input: '',
            prevInput: '',
            currentRoom: 'entrance',
            outputs: [],
            inventory: []
        }
        this.handleInput = this.handleInput.bind(this);
        this.handleChange = this.handleChange.bind(this);
        this.detectSubmit = this.detectSubmit.bind(this)
        this.addOutput = this.addOutput.bind(this)
        this.getItemByID = this.getItemByID.bind(this)
    }

    componentDidMount() {
        this.setState({
            outputs: [game.rooms[this.state.currentRoom].description]
        })
    }

    getNodeByID(id) {
        for (let i = 0; i < game.graph.length; i++) {
            if (game.graph[i].id === id) { return game.graph[i] }
        }
        console.warn(`Couldn't find node with ID "${id}"`)
    }

    getItemByID(id) {
        for (let i = 0; i < game.rooms[this.state.currentRoom].items.length; i++) {
            if (game.rooms[this.state.currentRoom].items[i].id === id) { return game.rooms[this.state.currentRoom].items[i] }
        }
    }

    addToInventory(item) {
        this.setState(function (prevState) {
            prevState.inventory.push(item);
            return prevState
        })
    }

    handleChange(e) {
        this.setState({
            input: e.target.value
        })
    }

    detectSubmit(e) {
        if (e.key === 'Enter') {
            this.handleInput()
        }
        if (e.keyCode === 38) {
            this.setState({ input: this.state.prevInput })
            e.preventDefault()
        }
    }

    addOutput(msg) {
        this.setState(function (prevState) {
            prevState.outputs.push(msg);
            return prevState;
        })
    }

    handleInput() {
        this.setState({ prevInput: this.state.input })
        let command = this.state.input.replace('the ', '').split(' ')

        let verb = command[0];
        let noun = command[1];
        this.setState(function (prevState) {
            prevState.outputs.push('> ' + this.state.input);
            return prevState;
        })
        this.setState({ input: '' })
        let currentNode = this.getNodeByID(this.state.currentRoom);
        let currentRoom = game.rooms[this.state.currentRoom];
        if (verb === 'go') {
            // noun is a direction here
            if (currentNode[noun]) {
                let nextRoom = currentNode[noun].node;
                this.setState(function (prevState) {
                    prevState.currentRoom = nextRoom;
                    return prevState;
                })
                this.addOutput(game.rooms[nextRoom].description)
            } else {
                this.addOutput(game.messages.cantGoThatWay[0])
            }
        } else if (verb === 'take') {
            let item = this.getItemByID(noun);
            if (item) {
                this.addOutput('Taken.')
                this.addToInventory(item)
            } else {
                this.addOutput("You can't take that.")
            }
        }


    }

    render() {

        const outputItems = this.state.outputs.map((msg, index) =>
            <li key={index}>{msg}</li>
        );

        return (
            <div className='game'>
                <div className="game--status">{this.state.currentRoom}</div>
                <div className='game--output'>
                    <ul>
                        {outputItems}
                    </ul>
                </div>
                <div className='game--controls'>
                    <input onKeyPress={this.detectSubmit} value={this.state.input} onChange={this.handleChange} className='controls--field'></input>
                    <button onClick={this.handleInput} className='controls--button'>Enter</button>
                </div>
            </div>
        )
    }

}