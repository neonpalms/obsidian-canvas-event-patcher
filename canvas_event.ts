const EVENT_PREFIX = 'canvas-events-definitions';

const CanvasEvent = {
    NodeMoved: `${EVENT_PREFIX}:node-moved`,
    ViewportChanged: {
        Before: `${EVENT_PREFIX}:viewport-changed:before`,
        After: `${EVENT_PREFIX}:viewport-changed:after`,
    },
    NodeCreated: `${EVENT_PREFIX}:node-created`,
    NodeTypeCreated: {
        Text: `${EVENT_PREFIX}:node-type-created:text`,
        File: `${EVENT_PREFIX}:node-type-created::file`,
        Link: `${EVENT_PREFIX}:node-type-created:link`,
        Group: `${EVENT_PREFIX}:node-type-created:group`,
    },
    GroupCreated: `${EVENT_PREFIX}:group-created`,
    GroupRemoved: `${EVENT_PREFIX}:group-removed`,
    NodeRemoved: `${EVENT_PREFIX}:node-removed`,
    EdgeCreated: `${EVENT_PREFIX}:edge-created`,
    EdgeRemoved: `${EVENT_PREFIX}:edge-removed`,
    SelectionChanged: `${EVENT_PREFIX}:selection-changed`,
    ReadonlyChanged: `${EVENT_PREFIX}:readonly-changed`,
    ZoomToBbox: {
        Before: `${EVENT_PREFIX}:zoom-to-bbox:before`,
        After: `${EVENT_PREFIX}:zoom-to-bbox:after`,
    },
    CanvasSaved: {
        Before: `${EVENT_PREFIX}:canvas-saved:before`,
        After: `${EVENT_PREFIX}:canvas-saved:after`,
    },
    NodeInteraction: `${EVENT_PREFIX}:node-interaction`,
    PopupMenuCreated: `${EVENT_PREFIX}:popup-menu-created`,
};

export default CanvasEvent;
