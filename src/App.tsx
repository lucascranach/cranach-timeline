import "./styles/App.css"

import Scene from "./components/Scene"
import { Leva } from "leva"

function App() {
  return (
    <>
      <Leva collapsed />
      <Scene />
    </>
  )
}

export default App
