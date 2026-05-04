export class EngramMemory {
  private memory: Map<string, string> = new Map();

  /**
   * Constant-time retrieval: O(1)
   */
  public recall(key: string): string | undefined {
    return this.memory.get(key);
  }

  public store(key: string, value: string): void {
    this.memory.set(key, value);
  }
}
