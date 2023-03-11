import React, { useState } from 'react'
import './test.styl'

export default function Text() {
	const [text, setText] = useState('skajgn')
	const onBeforeInput = e => {
		e.preventDefault()
		const {data} = e;
		console.log(data)
		// setText(text + data)
    e.target.innerHTML = e.target.textContent + data
	}

	return (
    <div
      className="text-insert-spellcheck-poc"
      contentEditable
      suppressContentEditableWarning
      onBeforeInput={onBeforeInput}
    >
      <span spellCheck>{text}</span>
    </div>
  );
}
