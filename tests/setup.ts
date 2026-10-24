// jsdom has no canvas and prints "Not implemented" for getContext: return null as a browser without canvas would.
// (Absent in the files that run in the node environment.)
if (typeof HTMLCanvasElement !== 'undefined') {
    HTMLCanvasElement.prototype.getContext = (() => null) as typeof HTMLCanvasElement.prototype.getContext;
}
