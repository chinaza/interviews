import { randomInterval } from './utils';

export async function getExternalPrice(numberPlate: string): Promise<number> {
  const responseTime = randomInterval(60000, 120000);
  const price =
    numberPlate.split('').reduce((acc, curr) => acc + curr.charCodeAt(0), 0) *
    100;
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      return resolve(price);
    }, responseTime);
  });
}
