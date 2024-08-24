# obsidian-canvas-event-patcher

Small monkey patcher for wrapping around ObsidianMD's Canvas events.

## Adding as a submodule

I add this repo as a submodule to my Canvas plugin projects under /events when I want code to trigger under certain circumstances.

`git submodule add https://github.com/neonpalms/obsidian-canvas-event-patcher.git events`

## Using in a plugin

These events can be listened to with `plugin.registerEvent()` like so:

```ts
import { Plugin } from 'obsidian';
import { CanvasData, CanvasNodeData, CanvasEdgeData } from './types/canvas';

// Import these
// Holds all string defs of each canvas event
import CanvasEvent from './events/canvas_event';
// Patches the Canvas methods
import CanvasEventPatcher from './events/canvas_event_patcher';

export default class MyCanvasPlugin extends Plugin {
    async onload() {
        // Then call .init & pass your instance of the Plugin class
        CanvasEventPatcher.init(this);

        // Then you can register an event such as CanvasEvent.NodeCreated
        this.registerEvent(this.app.workspace.on(
            // @ts-ignore
            CanvasEvent.NodeCreated, (node: CanvasNodeData) => {
                this.doMyPlugin(node);
            }));
    }

    doMyPlugin(node: CanvasNodeData) {
        console.log("My plugin does this when a new node is created on a Canvas!");
        console.log(`I even have access to the node that was just created ${node.id}.`);
    }
}
```

## How this was written

This code was based off of a method utilized by [Quorafind's Obsidian Canvas MindMap plugin](https://github.com/Quorafind/Obsidian-Canvas-MindMap/blob/master/src/canvasMindMap.ts) and with help from [the official ObsidianMD Discord](https://discord.gg/obsidianmd).
