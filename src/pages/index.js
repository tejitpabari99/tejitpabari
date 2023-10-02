import * as React from "react"

import Layout from "../components/common/layout"
import IntroSection from "../components/index/IntroSection"
import ProjectSection from "../components/index/ProjectSection"
import Seo from "../components/common/seo"
const utmParameters = `?utm_source=starter&utm_medium=start-page&utm_campaign=default-starter`

const IndexPage = () => (
  <Layout>
    <IntroSection />
    <ProjectSection />
  </Layout>
)

export const Head = () => <Seo/>

export default IndexPage
