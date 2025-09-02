import { useState } from "react";

export const getServerSideProps = async () => {
  const request = await fetch(
    "https://fakerapi.it/api/v1/custom?_quantity=1&initialCount=number"
  );
  const response = await request.json();
  const initialCount = response.data[0].initialCount;
  return { props: { initialCount } };
};

export default function App({ initialCount }: { initialCount: number }) {
  const [count, setCount] = useState<number>(initialCount);
  return <button onClick={() => setCount(count + 1)}>{count}</button>;
}
