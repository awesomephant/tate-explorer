const actions = {
    unlockStoreDoor: function (graph) {
        graph[1].east.locked = false;
        return graph;
    }
}

export {actions}