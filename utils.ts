export function randomInterval(min: number, max: number) {
  const interval = Math.floor(Math.random() * (max - min)) + min;

  return interval;
}
