import * as React from "react"

import Layout from "../components/common/layout"
import IntroSection from "../components/index/IntroSection"
import ProjectSection from "../components/index/ProjectSection"
import Seo from "../components/common/seo"

const IndexPage = () => (
  <Layout>
    <IntroSection />
  </Layout>
)

export const Head = () => <Seo/>

export default IndexPage
