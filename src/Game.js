import React from 'react'
import game from './game.json'
//import catalogue from './catalogue.json'
import util from './util.js'
import { actions } from './actions.js'
// import Map from './Map.js'
import './Game.css'

export default class Game extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            input: '',
            prevInput: '',
            currentRoom: 'entrance',
            visitedRooms: [],
            outputs: [],
            failedCommandCount: 0,
            inventory: game.initialInventory
        }

        this.outputRef = React.createRef()
        this.inputRef = React.createRef()

        this.handleInput = this.handleInput.bind(this);
        this.handleChange = this.handleChange.bind(this);
        this.detectSubmit = this.detectSubmit.bind(this)
        this.addOutput = this.addOutput.bind(this)
        this.getItemByID = this.getItemByID.bind(this)
        this.resolveAlternateTriggers = this.resolveAlternateTriggers.bind(this)
    }

    componentDidMount() {
        this.inputRef.current.focus();
        this.fillStores()
    }

    resolveAlternateTriggers(obj, term) {
        let alternates = obj.alternateTriggers;
        if (alternates) {
            for (let i = 0; i < alternates.length; i++) {
                let alt = alternates[i];
                for (let j = 0; j < alt.match.length; j++) {
                    if (alt.match[j] === term) {
                        return alt.term;
                    }
                }
            }
            console.warn('No match found.')
            return term;
        } else {
            console.warn('Object has no alternate triggers.')
            return term;
        }
    }

    getGraphIndexByID(id) {
        for (let i = 0; i < game.graph.length; i++) {
            if (game.graph[i].id === id) {
                return i;
            }
        }
        return null;
    }


    fillStores() {
        const shelfCount = 10;
        const graphIndex = this.getGraphIndexByID('store1')

        for (let i = 0; i < shelfCount; i++) {
            let shelfID = `store1-shelf${i + 1}`;
            game.graph[graphIndex][`shelf-${i + 1}`] = { node: shelfID }
            game.graph.push({
                id: shelfID,
                back: { node: 'store1' },
                west: { node: 'corridor1' }
            })
        }
        console.dir(game.graph)
        this.addOutput(this.getMessage('init'))
        this.addOutput(this.getMessage('help'))
    }

    getNodeByID(id) {
        for (let i = 0; i < game.graph.length; i++) {
            if (game.graph[i].id === id) { return game.graph[i] }
        }
        console.warn(`Couldn't find node with ID "${id}"`)
    }

    getItemByID(id) {
        for (let i = 0; i < game.rooms[this.state.currentRoom].items.length; i++) {
            let item = game.rooms[this.state.currentRoom].items[i];
            if (item.id === id) {
                game.rooms[this.state.currentRoom].items[i].examined = true;
                return item
            }
            if (item.examined && item.visibleItems) {
                for (let j = 0; j < item.visibleItems.length; j++) {
                    let vi = item.visibleItems[j];
                    if (vi.id === id) {
                        return vi;
                    }
                }
            }
            if (item.searched && item.hiddenItems) {
                for (let j = 0; j < item.hiddenItems.length; j++) {
                    let hi = item.hiddenItems[j];
                    if (hi.id === id) {
                        return hi;
                    }
                }
            }
        }
        for (let i = 0; i < this.state.inventory.length; i++) {
            if (this.state.inventory[i].id === id) {
                return this.state.inventory[i]
            }
        }

        return false;
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
        }, () => {
            let outputEl = this.outputRef.current;
            outputEl.scrollTop = outputEl.scrollHeight;
        })
    }

    resolveSynonyms(word) {
        for (let i = 0; i < game.synonyms.length; i++) {
            for (let j = 0; j < game.synonyms[i].match.length; j++) {
                if (game.synonyms[i].match[j] === word) {
                    return game.synonyms[i].term;
                }
            }
        }
        return word;
    }

    getMessage(msg, insertWord = '') {
        if (game.messages[msg]) {
            let message = game.messages[msg][util.gri(0, game.messages[msg].length - 1)]
            message = message.replace('%', insertWord)
            return message
        }
    }

    handleInput() {
        this.setState({ prevInput: this.state.input })
        let s = this.state.input.replace('at ', '')
        s = s.replace('through ', '')
        s = s.replace('to ', '')
        s = s.toLocaleLowerCase()
        let command = []
        let words = s.split(' ');
        for (let i = 0; i < words.length; i++) {
            command.push(this.resolveSynonyms(words[i]))
        }
        console.log(command)
        let verb = command[0];
        let noun = command[1];
        let currentNode = this.getNodeByID(this.state.currentRoom);

        this.setState(function (prevState) {
            prevState.outputs.push('> ' + this.state.input);
            return prevState;
        })
        this.setState({ input: '' })
        if (command.length === 1) {
            noun = this.resolveSynonyms(command[0])
            if (noun === 'north' || noun === 'south' || noun === 'east' || noun === 'west') {
                verb = 'go'
            } else if (noun === 'inventory') {
                verb = 'examine'
            }
            else if (noun === 'help') {
                this.addOutput(this.getMessage('help'))
                return;
            }
            else if (noun === 'examine') {
                verb = 'examine';
                noun = 'around';
            }
            else if (noun === 'go') {
                this.addOutput(this.getMessage('giveCompass'))
            } else if (this.getItemByID(noun)) {
                verb = 'examine'
            }
        }
        if (verb === 'use') {
            console.log('In use flow')
            let itemExists = this.getItemByID(noun)
            console.log(itemExists)
            if ((command[2] === 'with' || command[2] === 'on') && itemExists) {
                let target = this.getItemByID(command[3]);
                target = this.resolveSynonyms(target)
                if (target && target.interactions && target.interactions[noun]) {
                    this.addOutput(target.interactions[noun].message);
                    //TODO: Make this dynamicly controlled from game.json
                    game.graph = actions.unlockStoreDoor(game.graph);
                    return;
                } else if (target) {
                    this.addOutput(this.getMessage('itemDidntWork'))
                    return;
                } else {
                    this.addOutput(this.getMessage('noSuchThing'))
                    return;
                }
            } else if (itemExists) {
                this.addOutput(this.getMessage('giveTarget', command[1]))
                return;
            } else {
                this.addOutput(this.getMessage('noSuchThing'))
                return;
            }
        }
        if (verb === 'go') {
            // noun is a direction here
            noun = this.resolveAlternateTriggers(currentNode, noun)

            if (currentNode[noun] && currentNode[noun].locked !== true) {
                let nextRoom = currentNode[noun].node;
                this.setState(function (prevState) {
                    prevState.currentRoom = nextRoom;
                    return prevState;
                })
                if (!game.rooms[nextRoom].visited) {
                    this.addOutput(`${game.rooms[nextRoom].title}/n${game.rooms[nextRoom].description}`)
                    game.rooms[nextRoom].visited = true;
                } else if (game.rooms[nextRoom].visited === true) {
                    this.addOutput(game.rooms[nextRoom].title)
                }
            } else if (currentNode[noun] && currentNode[noun].locked === true) {
                this.addOutput(this.getMessage('locked'))
            }
            else {
                this.addOutput(this.getMessage('cantGoThatWay'))
            }
        } else if (verb === 'take') {
            let item = this.getItemByID(noun);
            if (item && item.canTake) {
                this.addOutput('Taken.')
                this.addToInventory(item)
            } else if (item && !item.canTake) {
                this.addOutput(this.getMessage('cantTakeThat'))
            } else if (!item) {
                this.addOutput(this.getMessage('noSuchThing'))
            }
        } else if (verb === 'examine') {
            if (noun === 'inventory') {
                let list = this.state.inventory.map(function (item) {
                    return `— ${item.name}`
                })
                if (list.length > 0) {
                    this.addOutput(`You are carrying:`)
                    let s = '';
                    for (const item in list) {
                        s += `${list[item]}/n`
                    }
                    this.addOutput(s)
                } else {
                    this.addOutput(`Your're not carrying anything.`)
                }
            } else if (noun === 'around') {
                this.addOutput(game.rooms[this.state.currentRoom].title)
                this.addOutput(game.rooms[this.state.currentRoom].description)
            } else {
                let item = this.getItemByID(noun)
                if (item) {
                    this.addOutput(item.description)
                } else {
                    this.addOutput(this.getMessage('noSuchThing'))
                }
            }
        } else if (verb === 'search') {
            let item = this.getItemByID(noun)
            if (item) {
                if (item.hiddenItems) {
                    item.searched = true;
                    this.addOutput(item.searchDescription);
                } else {
                    item.searched = true;
                    this.addOutput(this.getMessage('searchFailed'))
                }
            } else {
                this.addOutput(this.getMessage('noSuchThing'))
            }
        } else {
            this.setState(function (prevState) {
                prevState.failedCommandCount++
                return prevState;
            })
            if (this.state.failedCommandCount > 2) {
                this.addOutput(this.getMessage('hint'))
                this.setState({ failedCommandCount: 0 })
            } else {
                this.addOutput(this.getMessage('didntUnderstand'))
            }
        }


    }

    render() {

        const outputItems = this.state.outputs.map(function (msg, index) {
            let paragraphs = msg.split('/n');
            const ps = paragraphs.map(function (p, index) {
                return <p>{p}</p>
            })
            return <li key={index}>{ps}</li>
        });

        return (
            <div className='game'>
                <div className="game--status">{game.rooms[this.state.currentRoom].title}</div>
                <div className='game--output' ref={this.outputRef}>
                    <ul>
                        {outputItems}
                    </ul>
                </div>
                <div className='game--controls'>
                    <input ref={this.inputRef} onKeyPress={this.detectSubmit} value={this.state.input} onChange={this.handleChange} className='controls--field'></input>
                    <button onClick={this.handleInput} className='controls--button'>Enter</button>
                </div>
                {/* <Map graph={game.graph}></Map> */}
            </div>

        )
    }

}