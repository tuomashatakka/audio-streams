/// <reference types="next" />
/// <reference types="next/image-types/global" />

// Web Worker type declarations
declare module '*.worker.ts' {
  class WebpackWorker extends Worker {
    constructor()
  }

  export default WebpackWorker
}

declare module '*.worker.js' {
  class WebpackWorker extends Worker {
    constructor()
  }

  export default WebpackWorker
}