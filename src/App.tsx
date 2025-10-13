import "./styles/App.css"

import Scene from "./components/Scene"
import { Leva } from "leva"

import styled from "styled-components"

const Title = styled.h1`
  position: absolute;
  top: 3rem;
  left: 3rem;
  color: white;
  font-size: 2rem;
  font-weight: 100;
  z-index: 10;
  margin: 0;
  padding: 0;
`

function App() {
  return (
    <>
      <Title>Lucas Cranach Timeline</Title>
      <Leva collapsed />

      <Scene />
    </>
  )
}

export default App
