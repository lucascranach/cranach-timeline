import LinePlot from "./plot/LinePlot"
import Scene from "./three/Scene"

const Experience = (props) => {
  return (
    <>
      <LinePlot results={props.results || []} />
      {/* <Scene results={props.results || []} /> */}
    </>
  )
}

export default Experience
