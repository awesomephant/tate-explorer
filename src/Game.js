import React from 'react'
import game from './game.json'
import catalogue from './catalogue.json'
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
            moves: 0,
            currentRoom: 'entrance',
            visitedRooms: [],
            outputs: [],
            failedCommandCount: 0,
            inventory: game.initialInventory,
            onBox: false
        }

        this.outputRef = React.createRef()
        this.inputRef = React.createRef()

        this.handleInput = this.handleInput.bind(this);
        this.handleChange = this.handleChange.bind(this);
        this.detectSubmit = this.detectSubmit.bind(this)
        this.addOutput = this.addOutput.bind(this)
        this.getItemByID = this.getItemByID.bind(this)
        this.resolveAlternateTriggers = this.resolveAlternateTriggers.bind(this);
        this.isDirectionValid = this.isDirectionValid.bind(this)
    }

    componentDidMount() {
        this.inputRef.current.focus();
        this.fillStores()
        for (let room in game.rooms) {
            if (Object.prototype.hasOwnProperty.call(game.rooms, room)) {
                if (!game.rooms[room].items) {
                    game.rooms[room].items = []
                }
            }
        }
    }

    resolveAlternateTriggers(obj, term) {
        let alternates = obj.alternateTriggers;
        if (alternates) {
            console.warn('Object has alternate triggers, searching...')
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
                west: { node: 'corridor1' },
                up: { node: 'onShelf' }
            })
            game.rooms[shelfID] = {
                id: shelfID,
                title: `Shelf ${i + 1}`,
                canClimb: true
            }
            let collectionCount = 10;
            let shelfIndex = this.getGraphIndexByID(shelfID)
            let ids = []
            for (let j = 0; j < collectionCount; j++) {
                let thisCollection = catalogue.collections[util.gri(0, 200)];
                let id = util.sanitiseID(thisCollection.id)
                let collectionID = shelfID + '-' + id
                ids.push(id);

                game.graph[shelfIndex][id] = { node: collectionID }
                game.graph.push({
                    id: collectionID,
                    back: { node: shelfID }
                })

                let childrenIds = []
                for (let a = 0; a < thisCollection.children.length; a++) {
                    let c = thisCollection.children[a];
                    if (c.id) {
                        let itemId = util.sanitiseID(c.id);
                        childrenIds.push(itemId)
                        let collectionIndex = this.getGraphIndexByID(collectionID)
                        game.graph[collectionIndex][itemId] = { node: itemId }
                        game.graph.push({
                            id: itemId,
                            back: { node: collectionID }
                        })

                        let d = '';
                        if (c.Description) { d = c.Description }

                        game.rooms[itemId] = {
                            id: itemId,
                            title: `${itemId}`,
                            description: `${c.Title}(${c.Date})/n${d}`,
                        }
                    }
                }
                let childrenList = childrenIds.map(function (id) {
                    return `/n—${id}`
                })

                let items = []
                if (thisCollection.details.Extent) {
                    if (thisCollection.details.Extent.toLowerCase().includes('box')) {
                        items.push({
                            canTake: true,
                            id: "box",
                            name: "Archival Box",
                            description: "TODO its a box innit"
                        })
                    }

                    if (thisCollection.details.Extent.toLowerCase().includes('file')) {
                        items.push({
                            canTake: true,
                            id: "file",
                            name: "Archival File",
                            description: "TODO its a file innit"
                        })
                    }

                    if (thisCollection.details.Extent.toLowerCase().includes('folder')) {
                        items.push({
                            canTake: true,
                            id: "folder",
                            name: "Archival Folder",
                            description: "TODO its a foder innit"
                        })
                    }
                }

                game.rooms[collectionID] = {
                    id: collectionID,
                    title: id,
                    description: `The collection consists of ${thisCollection.details.Extent}. The catalogue entry reads:/n"${thisCollection.details.Title} (${thisCollection.details.Date})"./n Items contained within:${childrenList.join('')}`,
                    items: items
                }
            }

            let list = ids.map(function (id) {
                return `/n—${id}`
            })

            game.rooms[shelfID].description = `${game.messages.shelfDescription[0]} The label on the shelf tells you that it contains the following collections: ${list.join('')}`;
        }
        this.addOutput(this.getMessage('init'))
    }

    getNodeByID(id) {
        for (let i = 0; i < game.graph.length; i++) {
            if (game.graph[i].id === id) { return game.graph[i] }
        }
        console.warn(`Couldn't find node with ID "${id}"`)
    }

    getItemByID(id, includeRoom = true, includeInventory = true) {
        id = this.resolveAlternateTriggers(game.rooms[this.state.currentRoom], id)
        if (includeRoom) {
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
        }
        if (includeInventory) {

            for (let i = 0; i < this.state.inventory.length; i++) {
                if (this.state.inventory[i].id === id) {
                    return this.state.inventory[i]
                }
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
    removeItemFromInventory(itemID) {
        for (let i = 0; i < this.state.inventory.length; i++) {
            if (this.state.inventory[i].id === itemID) {
                this.setState((prevState) => {
                    prevState.inventory.splice(i, 1)
                    return prevState;
                })
                return;
            }
        }
    }

    addItemToRoom(item, roomId) {
        item.listSeperate = true;
        item.canTake = true;
        game.rooms[roomId].items.push(item);
        console.log(game.rooms[roomId])
    }

    removeItemFromRoom(id) {
        console.log(`Removing ${id}`)
        for (let i = 0; i < game.rooms[this.state.currentRoom].items.length; i++) {
            if (game.rooms[this.state.currentRoom].items[i].id === id) {
                game.rooms[this.state.currentRoom].items.splice(i, 1)
                return;
            }
            console.log(game.rooms[this.state.currentRoom].items[i])
            if (game.rooms[this.state.currentRoom].items[i].visibleItems) {
                for (let j = 0; j < game.rooms[this.state.currentRoom].items[i].visibleItems.length; j++) {
                    if (game.rooms[this.state.currentRoom].items[i].visibleItems[j].id === id) {
                        game.rooms[this.state.currentRoom].items[i].visibleItems.splice(j, 1)
                        return;
                    }
                }
            }

            if (game.rooms[this.state.currentRoom].items[i].hiddenItems) {
                for (let j = 0; j < game.rooms[this.state.currentRoom].items[i].hiddenItems.length; j++) {
                    if (game.rooms[this.state.currentRoom].items[i].hiddenItems[j].id === id) {
                        game.rooms[this.state.currentRoom].items[i].hiddenItems.splice(j, 1)
                        return;
                    }
                }
            }
        }
        return;
    }
    handleChange(e) {
        this.setState({
            input: e.target.value
        })
    }

    detectSubmit(e) {
        if (e.key === 'Enter' && this.state.input !== '') {
            this.handleInput()
        }
        if (e.keyCode === 38) {
            this.setState({ input: this.state.prevInput })
            e.preventDefault()
        }
    }

    addOutput(msg) {

        const fullMessage = {
            text: msg,
            source: 'game'
        }

        this.setState(function (prevState) {
            prevState.outputs.push(fullMessage);
            return prevState;
        }, () => {
            let outputEl = this.outputRef.current;
            outputEl.scrollTo({
                top: outputEl.scrollHeight,
                behavior: 'smooth'
            });
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

    resolveDescription(item) {
        let d = item.description;
        if (d.includes('$visibleItems')) {
            let visibleItems = util.joinEnglish(item.visibleItems, 'listName')
            d = d.replace('$visibleItems', visibleItems)
        }

        return d;
    }

    getMessage(msg, insertWord = '') {
        if (game.messages[msg]) {
            let message = game.messages[msg][util.gri(0, game.messages[msg].length - 1)]
            message = message.replace('%', insertWord)
            return message
        }
    }

    isDirectionValid(direction) {
        if (this.getNodeByID(this.state.currentRoom)[direction]) {
            return true
        }
        return false;
    }

    handleInput(s) {
        if (!s) {
            this.setState({ prevInput: this.state.input })
            s = this.state.input.replace('at ', '')
            s = s.replace('through ', '')
            s = s.replace('into ', '')
            s = s.replace('in ', '')
            s = s.replace('to ', '')
            s = s.replace('on ', '')
            s = s.replace('onto ', '')
            s = s.replace('the ', '')
            s = s.toLocaleLowerCase()

            this.setState(function (prevState) {
                prevState.outputs.push({text: this.state.input, source: "player"});
                return prevState;
            })
        }
        let command = []
        let words = s.split(' ');
        for (let i = 0; i < words.length; i++) {
            command.push(this.resolveSynonyms(words[i]))
        }
        console.log(command)
        let verb = command[0];
        console.log(verb)
        let noun = this.resolveSynonyms(command[1]);
        let currentNode = this.getNodeByID(this.state.currentRoom);

        if (noun === 'hatch') {
            verb = 'climb'
        }


        this.setState({ input: '' })
        if (command.length === 1) {
            noun = this.resolveSynonyms(command[0])
            if (noun === 'north' || noun === 'south' || noun === 'east' || noun === 'west' || noun === 'back' || this.isDirectionValid(noun)) {
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
                return;
            } else if (this.getItemByID(noun)) {
                verb = 'examine'
            } else if (noun === 'reset') {
                window.location.reload()
            }
        }
        if (verb === 'use') {
            console.log('In use flow')
            let itemExists = this.getItemByID(noun)
            let target = this.getItemByID(command[2]);
            if (target && itemExists) {
                target = this.resolveSynonyms(target)
                if (target && target.interactions && target.interactions[noun]) {
                    this.addOutput(target.interactions[noun].message);
                    //TODO: Make this dynamicly controlled from game.json
                    if (target.interactions[noun].action === 'unlockStoreDoor') {
                        game.graph = actions.unlockStoreDoor(game.graph);
                    } else if (target.interactions[noun].action === 'dropBox') {
                        let item = this.getItemByID('box', false, true);
                        this.addItemToRoom(item, this.state.currentRoom)
                        this.removeItemFromInventory(item.id)
                    } else if (target.interactions[noun].action === 'unlockCabinet') {
                        game.rooms[this.state.currentRoom].items[0].locked = false;
                        game.rooms[this.state.currentRoom].items[0].searched = true;
                    }
                    return;
                } else if (target) {
                    this.addOutput(this.getMessage('itemDidntWork'))
                    return;
                } else {
                    this.addOutput(this.getMessage('noSuchThing'))
                    return;
                }
            } else if (itemExists && command[2] === undefined) {
                console.log(target)
                this.addOutput(this.getMessage('giveTarget', command[1]))
                return;
            } else if (target === false) {
                this.addOutput(this.getMessage('noSuchThing'))
                return;
            }
        }
        if (verb === 'climb') {
            if (game.rooms[this.state.currentRoom].canClimb && noun === 'shelf') {
                verb = 'go'
                noun = 'up'
            } else if (noun === 'box' && this.getItemByID('box', true, false)) {
                this.setState({ onBox: true })
                this.addOutput(this.getMessage('climbedBox'))
                return;
            } else if (noun === 'hatch' && this.state.currentRoom === 'onShelf') {
                if (this.state.onBox === true) {
                    this.addOutput('(Standing on the box, you are able to reach the hatch. You open it, and pull yourself up inside.)')
                    verb = 'go'
                    noun = 'up'
                } else {
                    this.addOutput("The hatch is just out of reach from where you are. If you could find something to stand on...")
                    return;
                }
            } else {
                this.addOutput(this.getMessage('cantClimb'))
                return;
            }
        }

        if (verb === 'open') {
            let item = this.getItemByID(noun);
            console.log(item)
            if (item.locked === true) {
                this.addOutput(this.getMessage('locked'))
            }
            return;
        }

        if (verb === 'drop') {
            let item = this.getItemByID(noun, false, true);
            console.log(item)
            if (item) {
                this.addOutput('Dropped.')
                this.addItemToRoom(item, this.state.currentRoom)
                this.removeItemFromInventory(item.id)
                return;
            } else if (!item) {
                this.addOutput(this.getMessage('noSuchThingInInventory'))
                return;
            }
        }
        if (verb === 'go') {
            // noun is a direction here
            noun = this.resolveAlternateTriggers(currentNode, noun)

            if (noun === 'shelf') {
                if (command[2]) {
                    noun = `shelf-${command[2]}`
                } else {
                    noun = `shelf-1`
                    this.addOutput('(You walk up to Shelf 1)')
                }
            }

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
            console.log(game.rooms[this.state.currentRoom])
            let item = this.getItemByID(noun);
            if (item && item.canTake) {
                this.addOutput('Taken.')
                this.removeItemFromRoom(item.id)
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
                    s = s.substr(0, s.length - 2)
                    this.addOutput(s)
                } else {
                    this.addOutput(`Your're not carrying anything.`)
                }
            } else if (noun === 'around') {
                let droppedItems = ''
                for (let i = 0; i < game.rooms[this.state.currentRoom].items.length; i++) {
                    let item = game.rooms[this.state.currentRoom].items[i];
                    if (item.listSeperate) {
                        droppedItems += `There is a ${item.name.toLowerCase()} here./n`
                    }
                }

                this.addOutput(`${game.rooms[this.state.currentRoom].title}/n${game.rooms[this.state.currentRoom].description}/n${droppedItems}`)
            } else {
                let item = this.getItemByID(noun)
                console.log(item)
                if (item) {
                    this.addOutput(this.resolveDescription(item))
                } else {
                    this.addOutput(this.getMessage('noSuchThing'))
                }
            }
        } else if (verb === '___search') {
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
                this.addOutput(this.getMessage('didntUnderstand'))
                this.addOutput(this.getMessage('hint'))
                this.setState({ failedCommandCount: 0 })
            } else {
                this.addOutput(this.getMessage('didntUnderstand'))
            }
        }

        this.setState((prevState) => {
            prevState.moves++;
            return prevState;
        })

    }

    render() {

        const outputItems = this.state.outputs.map(function (msg, index) {
            let paragraphs = msg.text.split('/n');
            const ps = paragraphs.map(function (p, index) {
                return <p>{p}</p>
            })
            return <li key={index} data-source={msg.source}>{ps}</li>
        });

        return (
            <div className='game'>
                <header className='game--header'>
                    <div className="game--status">
                        {game.rooms[this.state.currentRoom].title}
                    </div>
                    <div className="game--status">
                        Moves: {this.state.moves}
                    </div>
                </header>
                <div className='game--output' ref={this.outputRef}>
                    <ul>
                        {outputItems}
                    </ul>
                </div>
                <div className='game--controls'>
                    <input ref={this.inputRef} onKeyPress={this.detectSubmit} value={this.state.input} onChange={this.handleChange} className='controls--field'></input>
                    <button onClick={this.handleInput} className='controls--button'>Enter</button>
                </div>
            </div>

        )
    }

}