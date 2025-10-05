const A = (params = 0) => params + 1;

const B = [...A, 2, 3];

class C {}

new C();

function App() {
  return <div>{B}</div>;
}
