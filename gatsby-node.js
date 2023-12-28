const path = require(`path`);
const { createFilePath } = require(`gatsby-source-filesystem`);

exports.onCreateNode = ({ node, getNode, actions }) => {
  const { createNodeField } = actions;
  if (node.internal.type === `MarkdownRemark`) {
    const parent = getNode(node.parent);
    let collection = parent.sourceInstanceName;
    createNodeField({
      node,
      name: 'collection',
      value: collection,
    });

    const filePath = createFilePath({ node, getNode });
    const fileEnd = path.parse(filePath).base;
    const slug = `/${collection}/${fileEnd}`;
    createNodeField({
      node,
      name: `slug`,
      value: slug,
    });
  }
};

exports.createPages = async ({ graphql, actions }) => {
  const { createPage } = actions

  const blogPost = path.resolve(`./src/templates/blog-post.js`)
  const result = await graphql(
    `{
      allMarkdownRemark(
        sort: {frontmatter: {date: DESC}}
        filter: {fields: {collection: {eq: "blog"}}}
      ) {
        edges {
          node {
            id
            fields {
              collection
              slug
            }
            frontmatter {
              slug
              title
              position
              date
              date_range
              excerpt
              category
              tags
              links
            }
          }
        }
      }
    }`
  )

  if (result.errors) {
    throw result.errors
  }

  // Create blog posts pages.
  const posts = result.data.allMarkdownRemark.edges

  posts.forEach((post, index) => {
    const previous = index === posts.length - 1 ? null : posts[index + 1].node
    const next = index === 0 ? null : posts[index - 1].node

    createPage({
      path: post.node.fields.slug,
      component: blogPost,
      context: {
        slug: post.node.fields.slug,
        previous,
        next,
      },
    })
  })
}