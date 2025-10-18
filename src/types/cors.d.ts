declare module 'cors' {
  import { RequestHandler } from 'express';
  const cors: () => RequestHandler;
  export default cors;
}
