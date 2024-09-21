import { Plugin, ItemView } from "obsidian"
import { AllCanvasNodeData, CanvasData, CanvasEdgeData, CanvasFileData, CanvasGroupData, CanvasLinkData, CanvasNodeData, CanvasTextData } from "types/canvas";
import CanvasEvent from "./canvas_event";
import { around } from "monkey-around";

export default class CanvasEventPatcher {
    private static plugin: Plugin;

    static init(plugin: Plugin) {
        CanvasEventPatcher.plugin = plugin;
        plugin.registerEvent(
            plugin.app.workspace.on('file-open', this.tryApplyCanvasPatch)
        );
        this.tryApplyCanvasPatch();
    }

    private static tryApplyCanvasPatch() {
        const workspace = CanvasEventPatcher.plugin.app.workspace;
        const canvasView = workspace.getActiveViewOfType(ItemView);
        // @ts-ignore
        const canvas: CanvasData = canvasView?.canvas;
        if (!canvas) {
            console.info("Canvas was not found & therefore not patched.");
            return;
        } else {
            console.info("Canvas was found, patching will begin.");
        }

        CanvasEventPatcher.plugin.register(around(canvas.constructor.prototype, {
            markViewportChanged: (next: any) => function (...args: any) {
                workspace.trigger(CanvasEvent.ViewportChanged.Before, ...args);
                const result = next.call(this, ...args);
                workspace.trigger(CanvasEvent.ViewportChanged.After, ...args);
                console.info(`Viewport has changed.`);
                return result;
            },
            markMoved: (next: any) => function (node: CanvasNodeData) {
                const result = next.call(this, node);
                workspace.trigger(CanvasEvent.NodeMoved, node);
                console.info(`Node ${node.id} moved to ${node.x}, ${node.y}`);
                return result;
            },
            updateSelection: (next: any) => function (update: () => void) {
                const oldSelection = new Set(this.selection);
                const result = next.call(this, update);
                workspace.trigger(CanvasEvent.SelectionChanged, oldSelection, ((update: () => void) => next.call(this, update)));
                console.info(`The selection has been updated.`);
                return result
            },
            addNode: (next: any) => function (node: CanvasNodeData) {
                workspace.trigger(CanvasEvent.NodeCreated, node);
                console.info(`Node ${node.id} was created.`);
                return next.call(this, node);
            },
            createTextNode: (next: any) => function (node: CanvasTextData) {
                workspace.trigger(CanvasEvent.NodeTypeCreated.Text, node);
                const result = next.call(this, node);
                console.info(`Text node ${node.id} was created.`);
                return result;
            },
            createFileNode: (next: any) => function (node: CanvasFileData) {
                workspace.trigger(CanvasEvent.NodeTypeCreated.File, node);
                const result = next.call(this, node);
                console.info(`File node ${node.id} was created.`);
                return result;
            },
            createLinkNode: (next: any) => function (node: CanvasLinkData) {
                workspace.trigger(CanvasEvent.NodeTypeCreated.Link, node);
                const result = next.call(this, node);
                console.info(`Link node ${node.id} was created.`);
                return result;
            },
            createGroupNode: (next: any) => function (group: CanvasGroupData) {
                workspace.trigger(CanvasEvent.NodeTypeCreated.Group, group);
                workspace.trigger(CanvasEvent.GroupCreated);
                const result = next.call(this, group);
                console.info(`Group node ${group.id} was created.`);
                return result;
            },
            removeNode: (next: any) => function (node: AllCanvasNodeData) {
                if (node.zIndex < -999) {
                    console.info(`Group ${node.id} removed.`);
                    workspace.trigger(CanvasEvent.GroupRemoved, node);
                }
                else {
                    console.info(`Node ${node.id} removed.`);
                    workspace.trigger(CanvasEvent.NodeRemoved, node);
                }
                const result = next.call(this, node);
                return result;
            },
            addEdge: (next: any) => function (edge: CanvasEdgeData) {
                workspace.trigger(CanvasEvent.EdgeCreated, edge);
                const result = next.call(this, edge);
                console.info(`Edge ${edge.id} created between nodes ${edge.fromNode} to ${edge.toNode}.`);
                return result;
            },
            removeEdge: (next: any) => function (edge: CanvasEdgeData) {
                console.info(`Deleted edge ${edge.id} between nodes ${edge.fromNode} to ${edge.toNode}.`);
                workspace.trigger(CanvasEvent.EdgeRemoved, edge);
                const result = next.call(this, edge);
                return result;
            },
            setReadonly: (next: any) => function (readonly: boolean) {
                readonly ? console.info(`Readonly mode on.`) : console.info(`Readonly mode off.`);
                const result = next.call(this, readonly);
                workspace.trigger(CanvasEvent.ReadonlyChanged, readonly);
                return result;
            },
            zoomToBbox: (next: any) => function (bbox: any) {
                console.info(`Getting ready to zoom to bounding box.`);
                workspace.trigger(CanvasEvent.ZoomToBbox.Before, bbox);
                const result = next.call(this, bbox);
                console.info(`Zoomed to bounding box.`);
                workspace.trigger(CanvasEvent.ZoomToBbox.After, bbox);
                return result;
            },
            requestSave: (next: any) => function (...args: any) {
                console.info(`Canvas about to save.`);
                workspace.trigger(CanvasEvent.CanvasSaved.Before, ...args);
                const result = next.call(this, ...args);
                workspace.trigger(CanvasEvent.CanvasSaved.After, ...args);
                console.info(`Canvas saved!`);
                return result;
            },
        }));

        CanvasEventPatcher.plugin.register(around(canvas.nodeInteractionLayer.constructor.prototype, {
            setTarget: (next: any) => function (node: CanvasNodeData) {
                const result = next.call(this, node);
                node ? console.info(`Node ${node.id} interacted with.`) : {};
                workspace.trigger(CanvasEvent.NodeInteraction, node);
                return result;
            },
        }));

        // The menu is created & destroyed, but the patcher never releases it, which leads to memory full of patched objects
        // So I commented this out for now
        // CanvasEventPatcher.plugin.register(around(canvas.menu.constructor.prototype, {
        //     render: (next: any) => function (...args: any) {
        //         console.info(`Pop-up menu has been created.`);
        //         const result = next.call(this, ...args);
        //         workspace.trigger(CanvasEvent.PopupMenuCreated, ...args);
        //         next.call(this);
        //         return result;
        //     },
        // }));

        console.info("Canvas has been patched!");
    }
}
