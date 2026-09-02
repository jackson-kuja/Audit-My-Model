export async function registerWebMCPTools(tools, { documentRef = document } = {}) {
  const context = documentRef?.modelContext;
  if (!context || typeof context.registerTool !== 'function') {
    return {
      available: false,
      registered: 0,
      errors: [],
      dispose() {},
    };
  }

  const controllers = [];
  const errors = [];

  for (const tool of tools) {
    const controller = new AbortController();
    try {
      await context.registerTool(tool, { signal: controller.signal });
      controllers.push(controller);
    } catch (error) {
      controller.abort();
      errors.push({
        name: tool.name,
        message: error instanceof Error ? error.message : String(error),
      });
    }
  }

  return {
    available: true,
    registered: controllers.length,
    errors,
    dispose() {
      for (const controller of controllers) controller.abort();
    },
  };
}
