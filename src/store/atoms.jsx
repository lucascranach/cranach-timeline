import { atom } from "jotai"

export const cranachElderEvents = atom(async () => {
  const res = await fetch("/data/cranachElderEvents_de.json")
  return await res.json()
})

export const cranachYoungerEvents = atom(async () => {
  const res = await fetch("/data/cranachYoungerEvents_de.json")
  return await res.json()
})

export const lutherEvents = atom(async () => {
  const res = await fetch("/data/lutherEvents_de.json")
  return await res.json()
})

export const historyEvents = atom(async () => {
  const res = await fetch("/data/historyEvents_de.json")
  return await res.json()
})