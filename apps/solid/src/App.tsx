// import { createSignal } from 'solid-js'
import './App.css'

import {Node} from '@emrgen/carbon-solid';

import {createContext, createSignal, For} from "solid-js";
import {createStore} from "solid-js/store";

function App() {
  // const [count, setCount] = createSignal(0)

  const [state, setState] = createStore({
    key: 1,
    isBlock: true,
    children: [
      {
        key: 2,
        isText: true,
        textContent: "Hello"
      },
      {
        key: 3,
        isText: true,
        textContent: "World"
      }
    ],
  });

  const handleClick = () => {
    setState("children", 0, "textContent", "Changed");
  }

  return (
    <>
      <button onclick={handleClick}>Click</button>
      <div class={"bg-indigo-500 text-sky-400"}>
        123
        {render(state as any)}
      </div>
    </>
  )
}


// const RenderContext = createContext(null);

const render = (node: Node) => {
  console.log(node)
  if (node.isBlock) {
    return (
      <div data-id={node.key}>
        <For each={node.children}>
          {(child) => render(child as any)}
        </For>
      </div>
    );
  }

  if (node.isText) {
    return <span data-id={node.key}>{node.textContent + ' '}</span>;
  }

  return null;
}

export default App
