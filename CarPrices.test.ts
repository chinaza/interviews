import CarPrices from './CarPrices';
import { getExternalPrice } from './ExternalPrice';
import RedisCache from './Redis';
import { randomInterval } from './utils';
import * as dotenv from 'dotenv';
import path from 'path';
dotenv.config();
dotenv.config({ path: path.join(__dirname, '.env') });

const mockedExternalPrice = (numberPlate: string): Promise<number> => {
  const responseTime = randomInterval(5000, 10000);
  const price =
    numberPlate.split('').reduce((acc, curr) => acc + curr.charCodeAt(0), 0) *
    100;
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      return resolve(price);
    }, responseTime);
  });
};

jest.mock('./ExternalPrice');
(getExternalPrice as any).mockImplementation(mockedExternalPrice);

const { REDIS_HOST = 'localhost', REDIS_PW = undefined } = process.env;
const REDIS_PORT = Number(process.env.REDIS_PORT) || 6379;
const cache = new RedisCache(REDIS_HOST, REDIS_PORT, REDIS_PW);

it('should use cache for second request', async () => {
  const carPrices = new CarPrices(cache);
  await carPrices.getPrice('SG70 SAM', false);
  await carPrices.getPrice('SG70 SAM', false);
  expect(getExternalPrice).toHaveBeenCalledTimes(1);
});

it('should detect an in-flight request and call get external price only once', async () => {
  const carPrices = new CarPrices(cache);

  const req1 = carPrices.getPrice('SG70 SAM', false);
  const req2 = carPrices.getPrice('SG70 SAM', false);
  await Promise.all([req1, req2]);
  expect(getExternalPrice).toHaveBeenCalledTimes(1);
});

it('should call external price service twice skipping cache', async () => {
  const carPrices = new CarPrices(cache);

  await carPrices.getPrice('SG70 SAM', false);
  await carPrices.getPrice('SG70 SAM', true);
  expect(getExternalPrice).toHaveBeenCalledTimes(2);
});

afterEach(() => {
  (getExternalPrice as any).mockClear();
});

beforeEach(async () => {
  await cache.clear();
});

afterAll(async () => {
  await cache.close();
});
