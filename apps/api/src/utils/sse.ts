export const SSE = {
  encoder: new TextEncoder(),

  event(controller: ReadableStreamDefaultController, name: string, data: unknown) {
    controller.enqueue(this.encoder.encode(`event: ${name}\ndata: ${JSON.stringify(data)}\n\n`));
  },

  batch(controller: ReadableStreamDefaultController, data: unknown[]) {
    this.event(controller, 'batch', data);
  },

  end(controller: ReadableStreamDefaultController, data: unknown = { done: true }) {
    this.event(controller, 'end', data);
    controller.close();
  },
};
