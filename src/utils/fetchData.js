import { encode } from "js-base64"

export async function fetchData(url, login, password) {
  try {
    const encodedCredentials = encode(`${login}:${password}`)
    // console.log("Encoded Credentials:", encodedCredentials) // Debugging line

    const response = await fetch(`${url}`, {
      headers: new Headers({
        Authorization: `Basic ${encodedCredentials}`,
      }),
    })

    // console.log("Response Status:", response.status) // Log the status code
    // console.log("Response Headers:", response.headers) // Log the headers

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()

    return data
  } catch (error) {
    console.error("Error fetching data:", error)
  }
}
