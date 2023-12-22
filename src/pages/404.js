import * as React from "react"
import {Flex} from '@chakra-ui/react';


import Layout from "../components/common/layout"
import Seo from "../components/common/seo"

const NotFoundPage = () => (
  <Layout>
    <Flex padding={'10vh'} paddingTop={'30vh'} h={'100vh'} display={'block'}>
      <p>You just hit a route that doesn&#39;t exist... the sadness.</p>
    </Flex>
  </Layout>
)

export const Head = () => <Seo title="404: Not Found" />

export default NotFoundPage
