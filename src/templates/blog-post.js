import * as React from "react"
import { graphql } from "gatsby"
import { Flex} from '@chakra-ui/react';

import Layout from "../components/common/layout"
import Seo from "../components/common/seo"

export default function BlogPost({ data, pageContext, location }) {
  const { markdownRemark } = data
  const { frontmatter, html } = markdownRemark
  const { title, date, category, tags } = frontmatter
  const { previous, next } = pageContext

  let previousTitle, previousSlug;
  if (previous && previous.frontmatter) {
    ({ title: previousTitle } = previous.frontmatter);
    ({ slug: previousSlug } = previous.fields);
  }

  let nextTitle, nextSlug;
  if (next && next.frontmatter) {
    ({ title: nextTitle } = next.frontmatter);
    ({ slug: nextSlug } = next.fields);
  }

  return (
    <Layout>
        <Flex maxW={'65%'} marginTop={'25vh'}display={'block'}
          fontFamily={'poppins'} marginLeft={'auto'} marginRight={'auto'}>
            <h1>{title}</h1>
            <h3>{date}</h3>
            <h4>{category}</h4>
            <h4>{tags.join(', ')}</h4>
            <p>{nextTitle && nextSlug && `Next: ${nextTitle}; ${nextSlug}`}</p>
            <p>{previousTitle && previousSlug && `Previous: ${previousTitle}; ${previousSlug}`}</p>
            <div
            dangerouslySetInnerHTML={{ __html: html }}
            />
          </Flex>
    </Layout>
  )
}
export const Head = () => <Seo/>

export const pageQuery = graphql`
  query($slug: String!) {
    markdownRemark(fields: { slug: { eq: $slug } }) {
      html
      frontmatter {
        title
        date(formatString: "MMMM DD, YYYY")
        category
        tags
      }
    }
  }
`