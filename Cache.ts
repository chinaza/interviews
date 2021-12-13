export type State = 'FETCHING' | 'FETCHED';

type CacheValue = {
  plate: string;
  state: State;
  price?: number;
};

export default interface Cache {
  getPrice: (numberPlate: string) => Promise<CacheValue>;

  setPrice: (
    numberPlate: string,
    state: State,
    price?: number
  ) => Promise<void>;

  manageLock: (numberPlate: string, op: 'acquire' | 'release') => Promise<void>;
}
