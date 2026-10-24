// jsdom has no canvas and prints "Not implemented" for getContext: return null as a browser without canvas would.
HTMLCanvasElement.prototype.getContext = (() => null) as typeof HTMLCanvasElement.prototype.getContext;
