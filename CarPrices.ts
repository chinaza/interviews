import Cache from './Cache';
import { getExternalPrice } from './ExternalPrice';

export default class CarPrices {
  constructor(private cache: Cache) {}

  private async fetchExternalPrice(numberPlate: string): Promise<number> {
    try {
      const price = await getExternalPrice(numberPlate);
      await this.cache.setPrice(numberPlate, 'FETCHED', price);
      await this.cache.manageLock(numberPlate, 'release');

      return price;
    } catch (error) {
      console.error(error);
      return 0;
    }
  }

  public async getPrice(
    numberPlate: string,
    skipCacheForRead: boolean = true
  ): Promise<number> {
    // Acquire lock and Check if price is in cache
    await this.cache.manageLock(numberPlate, 'acquire');

    const cachedValue = await this.cache.getPrice(numberPlate);

    if (
      cachedValue?.state === 'FETCHED' &&
      cachedValue?.price &&
      !skipCacheForRead
    ) {
      // Release lock if price in cache
      await this.cache.manageLock(numberPlate, 'release');
      return cachedValue.price;
    }

    const price = await this.fetchExternalPrice(numberPlate);

    return price;
  }
}
