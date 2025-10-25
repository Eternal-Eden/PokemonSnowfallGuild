// Global type declarations for modules without type definitions

declare module 'express' {
  export interface Request {
    [key: string]: unknown;
  }
  export interface Response {
    [key: string]: unknown;
  }
  export interface NextFunction {
    (error?: Error): void;
  }
  export interface Application {
    [key: string]: unknown;
    use(...args: unknown[]): Application;
    get(...args: unknown[]): Application;
    post(...args: unknown[]): Application;
    put(...args: unknown[]): Application;
    delete(...args: unknown[]): Application;
    listen(...args: unknown[]): Application;
  }
  export interface Router {
    [key: string]: unknown;
    use(...args: unknown[]): Router;
    get(...args: unknown[]): Router;
    post(...args: unknown[]): Router;
    put(...args: unknown[]): Router;
    delete(...args: unknown[]): Router;
  }
  
  interface ExpressStatic {
    (): Application;
    json(options?: Record<string, unknown>): unknown;
    urlencoded(options?: Record<string, unknown>): unknown;
    static(root: string, options?: Record<string, unknown>): unknown;
    Router(options?: Record<string, unknown>): Router;
  }
  
  const express: ExpressStatic;
  export = express;
}

declare module '@prisma/client' {
  export * from '@prisma/client';
}

declare module 'zod' {
  export * from 'zod';
}

declare module 'react' {
  export * from 'react';
}

declare module 'react-dom' {
  export * from 'react-dom';
}

declare module 'framer-motion' {
  export * from 'framer-motion';
}

declare module 'lucide-react' {
  export * from 'lucide-react';
}

declare module 'next/navigation' {
  export * from 'next/navigation';
}

declare module 'next/link' {
  export * from 'next/link';
}

declare module 'next/server' {
  export * from 'next/server';
}

declare module 'gsap' {
  export * from 'gsap';
}

declare module 'gsap/ScrollTrigger' {
  export * from 'gsap/ScrollTrigger';
}

declare module 'fs' {
  export * from 'fs';
}

declare module 'path' {
  export * from 'path';
}

declare module 'js-yaml' {
  export * from 'js-yaml';
}

// Global process declaration for Node.js
declare global {
  namespace NodeJS {
    interface ProcessEnv {
      NODE_ENV: 'development' | 'production' | 'test';
      [key: string]: string | undefined;
    }
  }
  
  var process: NodeJS.Process;
}

export {};