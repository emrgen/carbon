import React, {useState, createElement, useRef, useEffect, createContext, useContext} from 'react'
import './test.styl'
import {createPortal} from "react-dom";
import ReactDOM from "react-dom/client";

const Person = ({ name }) => {
  const context = useContext(TestContext)

  console.log(context)
  return <div>{name}</div>;
}

const TestContext = createContext<any>(null)

export default function Text() {
	const [text, setText] = useState('skajgn');
  const ref = useRef<any>()
  const [portal, setPortal] = useState<any>(null)
	const onBeforeInput = e => {
		e.preventDefault()
		const {data} = e;
		console.log(data)
		// setText(text + data)
    e.target.innerHTML = e.target.textContent + data
	}

  useEffect(() => {
    if (!ref.current) return
    setPortal(ref.current);
  }, []);

	return (
    <TestContext.Provider value={ref}>
    <div
      className="text-insert-spellcheck-poc"
      contentEditable
      suppressContentEditableWarning
      onBeforeInput={onBeforeInput}
    >
      <div>{text}</div>

      <div ref={ref}></div>
      {portal && <Portal contentElement={portal}>
        <Person name={"subhasis"}/>
      </Portal>}
    </div>
    </TestContext.Provider>
  );
}

const Portal = ({ children, contentElement }) => {
  console.log(contentElement)
  if (!contentElement) return null
  return createPortal(children, contentElement);
}
