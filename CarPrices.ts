import Cache from './Cache';
import eventEmitter from './Event';
import { getExternalPrice } from './ExternalPrice';

export default class CarPrices {
  constructor(private cache: Cache) {}

  private priceResponseListener = async (plate: string): Promise<number> => {
    return new Promise((resolve) => {
      eventEmitter.once(`plate:${plate}`, (price: number) => {
        return resolve(price);
      });
    });
  };

  private async fetchExternalPrice(numberPlate: string): Promise<number> {
    // Update price fetch status in cache and release lock
    await this.cache.setPrice(numberPlate, 'FETCHING');
    await this.cache.manageLock(numberPlate, 'release');

    const price = await getExternalPrice(numberPlate);
    await this.cache.setPrice(numberPlate, 'FETCHED', price);
    // Fire price event to notify listeners
    eventEmitter.emit(`plate:${numberPlate}`, price);
    return price;
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

    if (cachedValue?.state === 'FETCHING') {
      // Release lock if cache in fetching state
      await this.cache.manageLock(numberPlate, 'release');
      const resolvedPrice = await this.priceResponseListener(numberPlate);
      return resolvedPrice;
    }

    const price = await this.fetchExternalPrice(numberPlate);

    return price;
  }
}
