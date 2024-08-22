import { Plugin, ItemView } from "obsidian"
import { AllCanvasNodeData, CanvasData, CanvasEdgeData, CanvasFileData, CanvasGroupData, CanvasLinkData, CanvasNodeData, CanvasTextData } from "types/canvas";
import CanvasEvent from "./canvas_event";
import { around } from "monkey-around";

export default class CanvasEventPatcher {
    private static plugin: Plugin;

    constructor(plugin: Plugin) {
        CanvasEventPatcher.plugin = plugin;
        if (!this.applyCanvasPatch())
            throw new Error("Canvas could not be monkey patched.");
    }

    private applyCanvasPatch(): boolean {
        const canvasView = CanvasEventPatcher.plugin.app.workspace.getActiveViewOfType(ItemView);
        // @ts-ignore
        const canvas: CanvasData = canvasView?.canvas;
        if (!canvas) return false;

        const workspace = CanvasEventPatcher.plugin.app.workspace;

        CanvasEventPatcher.plugin.register(around(canvas.constructor.prototype, {
            markViewportChanged: (next: any) => function (...args: any) {
                workspace.trigger(CanvasEvent.ViewportChanged.Before, this);
                const result = next.call(this, ...args);
                workspace.trigger(CanvasEvent.ViewportChanged.After, this);
                return result;
            },
            markMoved: (next: any) => function (node: CanvasNodeData) {
                const result = next.call(this, node);
                workspace.trigger(CanvasEvent.NodeMoved, this, node);
                return result;
            },
            updateSelection: (next: any) => function (update: () => void) {
                const oldSelection = new Set(this.selection)
                const result = next.call(this, update)
                workspace.trigger(CanvasEvent.SelectionChanged, this, oldSelection, ((update: () => void) => next.call(this, update)))
                return result
            },
            addNode: (next: any) => function (node: CanvasNodeData) {
                workspace.trigger(CanvasEvent.NodeCreated, this, node);
                return next.call(this, node)
            },
            createTextNode: (next: any) => function (node: CanvasTextData) {
                workspace.trigger(CanvasEvent.NodeTypeCreated.Text);
                const result = next.call(this, node);
                return result;
            },
            createFileNode: (next: any) => function (node: CanvasFileData) {
                workspace.trigger(CanvasEvent.NodeTypeCreated.File);
                const result = next.call(this, node);
                return result;
            },
            createLinkNode: (next: any) => function (node: CanvasLinkData) {
                workspace.trigger(CanvasEvent.NodeTypeCreated.Link);
                const result = next.call(this, node);
                return result;
            },
            createGroupNode: (next: any) => function (group: CanvasGroupData) {
                workspace.trigger(CanvasEvent.NodeTypeCreated.Group);
                workspace.trigger(CanvasEvent.GroupCreated);
                const result = next.call(this, group);
                return result;
            },
            removeNode: (next: any) => function (node: AllCanvasNodeData) {
                if (node.zIndex < -999)
                    workspace.trigger(CanvasEvent.GroupRemoved);
                else
                    workspace.trigger(CanvasEvent.NodeRemoved);
                const result = next.call(this, node);
                return result;
            },
            addEdge: (next: any) => function (edge: CanvasEdgeData) {
                workspace.trigger(CanvasEvent.EdgeCreated);
                const result = next.call(this, edge);
                return result;
            },
            removeEdge: (next: any) => function (edge: CanvasEdgeData) {
                workspace.trigger(CanvasEvent.EdgeRemoved);
                const result = next.call(this, edge);
                return result;
            },
            setReadonly: (next: any) => function (readonly: boolean) {
                const result = next.call(this, readonly)
                workspace.trigger(CanvasEvent.ReadonlyChanged, this, readonly)
                return result
            },
            zoomToBbox: (next: any) => function (bbox: any) {
                workspace.trigger(CanvasEvent.ZoomToBbox.Before, this, bbox)
                const result = next.call(this, bbox)
                workspace.trigger(CanvasEvent.ZoomToBbox.After, this, bbox)
                return result
            },
            requestSave: (next: any) => function (...args: any) {
                workspace.trigger(CanvasEvent.CanvasSaved.Before, this)
                const result = next.call(this, ...args)
                workspace.trigger(CanvasEvent.CanvasSaved.After, this)
                return result
            },
        }));

        CanvasEventPatcher.plugin.register(around(canvas.nodeInteractionLayer.constructor.prototype, {
            setTarget: (next: any) => function (node: CanvasNodeData) {
                const result = next.call(this, node);
                workspace.trigger(CanvasEvent.NodeInteraction, this.canvas, node);
                return result;
            },
        }));

        CanvasEventPatcher.plugin.register(around(canvas.menu.constructor.prototype, {
            render: (next: any) => function (...args: any) {
                const result = next.call(this, ...args);
                workspace.trigger(CanvasEvent.PopupMenuCreated, this.canvas);
                next.call(this);
                return result;
            },
        }));

        return true;
    }
}
