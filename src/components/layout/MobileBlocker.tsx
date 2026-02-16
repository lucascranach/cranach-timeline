import styled from "styled-components"
import { getCurrentLanguage } from "@/utils/languageUtils"
import { useIsMobile } from "@/hooks/use-mobile"

const BlockerContainer = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background-color: var(--background);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 2rem;
  z-index: 999999;
`

const Message = styled.div`
  text-align: center;
  color: var(--foreground);
  font-family: "IBMPlexSans", sans-serif;
  max-width: 600px;
`

const Title = styled.h1`
  font-size: 2rem;
  font-weight: 500;
  margin-bottom: 1rem;
  letter-spacing: 0.02em;
`

const Description = styled.p`
  font-size: 1.125rem;
  font-weight: 300;
  line-height: 1.6;
  margin: 0;
  opacity: 0.9;
`

const messages = {
  de: {
    title: "Desktop erforderlich",
    description:
      "Diese Anwendung ist für Desktop-Bildschirme optimiert. Bitte öffnen Sie die Seite auf einem Gerät mit größerem Bildschirm, um die Lucas Cranach Timeline zu erleben.",
  },
  en: {
    title: "Desktop Required",
    description:
      "This application is optimized for desktop screens. Please open this page on a device with a larger screen to experience the Lucas Cranach Timeline.",
  },
}

export const MobileBlocker = ({ children }: { children: React.ReactNode }) => {
  const isMobile = useIsMobile()
  const language = getCurrentLanguage()
  const message = messages[language]

  if (isMobile) {
    return (
      <BlockerContainer>
        <Message>
          <Title>{message.title}</Title>
          <Description>{message.description}</Description>
        </Message>
      </BlockerContainer>
    )
  }

  return <>{children}</>
}
