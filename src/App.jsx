import { useEffect, useState } from "react"

import "./styles/App.css"
import Experience from "./components/Experience"

import { fetchData } from "./utils/fetchData"

function App() {
  const [data, setData] = useState()

  useEffect(() => {
    //
    ;(async () => {
      const data = await fetchData(
        import.meta.env.VITE_API_HOST,
        import.meta.env.VITE_API_LOGIN,
        import.meta.env.VITE_API_PASSWORD
      )
      setData(data.data.results)
    })()
  }, [])

  return (
    <>
      <Experience results={data} />
    </>
  )
}

export default App
