import { Request, Response, NextFunction } from 'express';

interface CustomError extends Error {
  statusCode?: number;
  isOperational?: boolean;
}

// Middleware to handle 404 errors
export const notFound = (req: Request, res: Response, next: NextFunction): void => {
  const error = new Error(`Not Found: ${req.originalUrl}`);
  res.status(404).json({ error: error.message, status: false });
};


// Middleware to handle 500 errors
export const errorHandler = (err: CustomError, req: Request, res: Response, next: NextFunction): void => {
    // Set status code if it's not already set
    const statusCode = err?.statusCode || 500;
    res.status(statusCode);
  
    // Checking if the environment is development (to show stack trace) or production (hide stack trace)
    const isDevelopment = process.env.NODE_ENV === 'development';
  
    // Send error response
    res.json({
      message: err.message,
      stack: isDevelopment ? err.stack : undefined, 
    });
  };