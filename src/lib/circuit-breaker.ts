/**
 * Circuit Breaker Pattern Implementation
 * Prevents cascading failures by stopping requests when a service is down
 * 
 * States:
 * - CLOSED: Normal operation, requests pass through
 * - OPEN: Service is failing, requests are rejected immediately
 * - HALF_OPEN: Testing if service has recovered, allows limited requests
 */

export type CircuitState = 'CLOSED' | 'OPEN' | 'HALF_OPEN'

interface CircuitBreakerState {
  failures: number
  lastFailureTime: number | null
  state: CircuitState
  successCount: number // For HALF_OPEN state
}

interface CircuitBreakerOptions {
  failureThreshold?: number // Number of failures before opening circuit
  timeoutMs?: number // Time to wait before attempting HALF_OPEN
  halfOpenMaxAttempts?: number // Max requests in HALF_OPEN before closing
}

/**
 * Circuit Breaker for protecting against cascading failures
 */
export class CircuitBreaker {
  private state: CircuitBreakerState
  private failureThreshold: number
  private timeoutMs: number
  private halfOpenMaxAttempts: number

  constructor(options: CircuitBreakerOptions = {}) {
    this.failureThreshold = options.failureThreshold || 5
    this.timeoutMs = options.timeoutMs || 60000 // 1 minute
    this.halfOpenMaxAttempts = options.halfOpenMaxAttempts || 3
    
    this.state = {
      failures: 0,
      lastFailureTime: null,
      state: 'CLOSED',
      successCount: 0,
    }
  }

  /**
   * Execute a function with circuit breaker protection
   * @param fn - Function to execute
   * @returns Result of the function
   * @throws Error if circuit is open or function fails
   */
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    // Check if circuit is open
    if (this.state.state === 'OPEN') {
      const timeSinceLastFailure = this.state.lastFailureTime 
        ? Date.now() - this.state.lastFailureTime 
        : Infinity
      
      // If timeout has passed, transition to HALF_OPEN
      if (timeSinceLastFailure > this.timeoutMs) {
        console.log('[Circuit Breaker] Transitioning from OPEN to HALF_OPEN')
        this.state.state = 'HALF_OPEN'
        this.state.successCount = 0
      } else {
        // Circuit is still open, reject immediately
        throw new Error(
          `Circuit breaker is OPEN - Kie.ai API unavailable. Retry after ${Math.ceil((this.timeoutMs - timeSinceLastFailure) / 1000)}s`
        )
      }
    }

    try {
      const result = await fn()
      this.onSuccess()
      return result
    } catch (error) {
      this.onFailure()
      throw error
    }
  }

  /**
   * Handle successful execution
   */
  private onSuccess(): void {
    if (this.state.state === 'HALF_OPEN') {
      this.state.successCount++
      // If we've had enough successes in HALF_OPEN, close the circuit
      if (this.state.successCount >= this.halfOpenMaxAttempts) {
        console.log('[Circuit Breaker] Transitioning from HALF_OPEN to CLOSED')
        this.state.state = 'CLOSED'
        this.state.failures = 0
        this.state.successCount = 0
      }
    } else {
      // CLOSED state - reset failure count on success
      this.state.failures = 0
      this.state.lastFailureTime = null
    }
  }

  /**
   * Handle failed execution
   */
  private onFailure(): void {
    this.state.failures++
    this.state.lastFailureTime = Date.now()

    if (this.state.state === 'HALF_OPEN') {
      // Any failure in HALF_OPEN immediately opens the circuit
      console.log('[Circuit Breaker] Failure in HALF_OPEN, transitioning to OPEN')
      this.state.state = 'OPEN'
      this.state.successCount = 0
    } else if (this.state.failures >= this.failureThreshold) {
      // Too many failures, open the circuit
      console.log(`[Circuit Breaker] Failure threshold (${this.failureThreshold}) reached, opening circuit`)
      this.state.state = 'OPEN'
    }
  }

  /**
   * Get current circuit state (for monitoring)
   */
  getState(): CircuitState {
    return this.state.state
  }

  /**
   * Get failure count (for monitoring)
   */
  getFailureCount(): number {
    return this.state.failures
  }

  /**
   * Manually reset the circuit breaker (for admin use)
   */
  reset(): void {
    console.log('[Circuit Breaker] Manually resetting circuit breaker')
    this.state = {
      failures: 0,
      lastFailureTime: null,
      state: 'CLOSED',
      successCount: 0,
    }
  }

  /**
   * Get circuit breaker status for monitoring
   */
  getStatus(): {
    state: CircuitState
    failures: number
    lastFailureTime: number | null
    timeUntilRetry?: number
  } {
    const status: {
      state: CircuitState
      failures: number
      lastFailureTime: number | null
      timeUntilRetry?: number
    } = {
      state: this.state.state,
      failures: this.state.failures,
      lastFailureTime: this.state.lastFailureTime,
    }

    if (this.state.state === 'OPEN' && this.state.lastFailureTime) {
      const timeSinceLastFailure = Date.now() - this.state.lastFailureTime
      status.timeUntilRetry = Math.max(0, Math.ceil((this.timeoutMs - timeSinceLastFailure) / 1000))
    }

    return status
  }
}

// Singleton instance for Kie.ai API
export const kieCircuitBreaker = new CircuitBreaker({
  failureThreshold: 5,
  timeoutMs: 60000, // 1 minute
  halfOpenMaxAttempts: 3,
})

