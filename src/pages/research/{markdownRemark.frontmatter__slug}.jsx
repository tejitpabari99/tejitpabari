import * as React from "react"
import { graphql } from "gatsby"
import { Box, Flex, forwardRef, Avatar, Container, Image, Stack } from '@chakra-ui/react';


import Layout from "../../components/common/layout"
import Seo from "../../components/common/seo"

export default function ResearchTemplate({
    data,
}) {
  const { markdownRemark } = data
  const { frontmatter, html } = markdownRemark
  return (
    <Layout>
        <Flex maxW={'95%'} paddingTop={'10vh'} h={'100vh'} display={'block'}
          direction={'column'}textAlign={'center'} fontFamily={'poppins'}
          marginLeft={'auto'} marginRight={'auto'}>
            <h1>Name here</h1>
            <h1>Date here</h1>
            <div
            dangerouslySetInnerHTML={{ __html: html }}
            />
          </Flex>
    </Layout>
  )
}
export const Head = () => <Seo/>

export const pageQuery = graphql`
  query($id: String!) {
    markdownRemark(id: { eq: $id }) {
      html
      frontmatter {
        slug
      }
    }
  }
`