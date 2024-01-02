import { component$, useSignal } from '@builder.io/qwik'
import './app.css'



export const App = component$(() => {
  const count = useSignal(0);

  return (
    <div onClick$={() => count.value++}>
      hello world {count.value}
    </div>
  )
})
