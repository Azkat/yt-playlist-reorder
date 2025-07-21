export class RateLimiter {
  private quotaUsed: number = 0;
  private dailyLimit: number = 10000;
  private requestQueue: Array<() => Promise<any>> = [];
  private isProcessing: boolean = false;

  async executeWithLimit<T>(operation: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.requestQueue.push(async () => {
        try {
          const result = await operation();
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });

      if (!this.isProcessing) {
        this.processQueue();
      }
    });
  }

  private async processQueue(): Promise<void> {
    if (this.isProcessing || this.requestQueue.length === 0) {
      return;
    }

    this.isProcessing = true;

    while (this.requestQueue.length > 0) {
      if (this.quotaUsed >= this.dailyLimit) {
        await this.waitForQuotaReset();
      }

      const operation = this.requestQueue.shift();
      if (operation) {
        try {
          await operation();
          this.quotaUsed += this.calculateQuotaCost();
        } catch (error) {
          if (this.isRateLimitError(error)) {
            await this.exponentialBackoff();
            this.requestQueue.unshift(operation);
          } else {
            throw error;
          }
        }
      }
    }

    this.isProcessing = false;
  }

  private calculateQuotaCost(): number {
    // YouTube APIの基本的なクォータコスト
    return 1;
  }

  private isRateLimitError(error: any): boolean {
    return error?.response?.status === 429 || 
           error?.response?.status === 403 && 
           error?.response?.data?.error?.errors?.[0]?.reason === "quotaExceeded";
  }

  private async waitForQuotaReset(): Promise<void> {
    // 1日のクォータリセットを待つ（実際のアプリでは日付チェックが必要）
    const hoursUntilMidnight = 24 - new Date().getHours();
    await new Promise(resolve => setTimeout(resolve, hoursUntilMidnight * 60 * 60 * 1000));
    this.quotaUsed = 0;
  }

  private async exponentialBackoff(): Promise<void> {
    const delay = Math.min(1000 * Math.pow(2, Math.random()), 30000);
    await new Promise(resolve => setTimeout(resolve, delay));
  }
}