import CircuitBreaker  from 'opossum';
import mongoose from 'mongoose';
import { logger } from './logger';

interface RetryConfig {
  maxRetries: number;
  retryDelay: number;
  timeout: number;
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 5,
  retryDelay: 5000,
  timeout: 120000, // Match serverSelectionTimeoutMS
};

// Circuit breaker for database operations
const breaker = new CircuitBreaker(async (operation: () => Promise<any>) => {
  return await operation();
}, {
  timeout: 180000, // 3 minutes - match serverSelectionTimeoutMS
  errorThresholdPercentage: 30, // Lower threshold - open circuit after 30% of requests fail
  resetTimeout: 90000, // 1.5 minutes to wait before attempting to reconnect
  rollingCountTimeout: 120000, // 2 minutes rolling window for error rate calculation
  rollingCountBuckets: 10, // Number of buckets for error rate calculation
  volumeThreshold: 3, // Minimum number of requests before error percentage is calculated
});

breaker.on('open', () => {
  logger.warn('Circuit Breaker: Open - Database operations temporarily suspended');
});

breaker.on('halfOpen', () => {
  logger.info('Circuit Breaker: Half Open - Testing database connection');
});

breaker.on('close', () => {
  logger.info('Circuit Breaker: Closed - Database operations resumed');
});

// Retry wrapper for database operations
export async function withRetry<T>(
  operation: () => Promise<T>,
  config: Partial<RetryConfig> = {}
): Promise<T> {
  const finalConfig = { ...DEFAULT_RETRY_CONFIG, ...config };
  let lastError: Error | null = null;
  
  for (let attempt = 1; attempt <= finalConfig.maxRetries; attempt++) {
    try {
      // Use circuit breaker to execute the operation
      return await breaker.fire(operation);
    } catch (error: any) {
      lastError = error;
      
      // Check if we should retry based on error type
      if (error instanceof mongoose.Error.MongooseServerSelectionError ||
          error.name === 'MongoNetworkError' ||
          error.message.includes('connection closed')) {
        
        if (attempt < finalConfig.maxRetries) {
          logger.warn(`Database operation failed, attempt ${attempt}/${finalConfig.maxRetries}. Retrying in ${finalConfig.retryDelay}ms`);
          await new Promise(resolve => setTimeout(resolve, finalConfig.retryDelay));
          continue;
        }
      } else {
        // Don't retry for other types of errors
        break;
      }
    }
  }
  
  throw lastError || new Error('Operation failed after retries');
}

// Health check function
export async function checkDatabaseHealth(): Promise<boolean> {
  try {
    if (mongoose.connection.readyState !== 1) {
      return false;
    }
    
    // Try a simple operation to verify database responsiveness
    await mongoose.connection.db.admin().ping();
    return true;
  } catch (error) {
    logger.error('Database health check failed:', error);
    return false;
  }
}

// Connection monitoring
export function setupConnectionMonitoring(): void {
  mongoose.connection.on('connected', () => {
    logger.info('MongoDB: Connected');
  });

  mongoose.connection.on('disconnected', () => {
    logger.warn('MongoDB: Disconnected');
  });

  mongoose.connection.on('reconnected', () => {
    logger.info('MongoDB: Reconnected');
  });

  mongoose.connection.on('error', (error) => {
    logger.error('MongoDB: Connection error:', error);
  });
}
