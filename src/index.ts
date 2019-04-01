export interface TheInterface {
  name: string;
}

export default function theModule (): TheInterface {
  return { name: "new module" };
}
