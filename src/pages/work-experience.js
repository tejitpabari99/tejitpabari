import * as React from "react"
import Writeup from "../components/common/writeup"

import Layout from "../components/common/layout"
import Seo from "../components/common/seo"

const WorkExperiencePage = () => (
  <Layout>
    <Writeup writeupData={writeupData} heading={"Work Experience"}/>
  </Layout>
)

const writeupData = [
  {
    "title": "Microsoft Fabric Maps",
    "subtitle": "Software Engineer II",
    "description": `Served as lead engineer for the Tileset Job API, owning end-to-end design and delivery — from architecture and backend implementation to frontend integration, testing, telemetry, and iteration on user feedback — enabling large-scale geospatial data ingestion and map tile generation. Drove reliability and scalability improvements through infrastructure optimization, performance benchmarking, and SLA definition. Built a Power BI–driven performance testing framework that reduced latency regressions by 15% ahead of releases. Led security compliance and modernization through a classic-to-YAML pipeline migration with cross-team coordination. Also served as Shadow Product Manager, conducting competitive analysis of Databricks, ESRI, and CARTO, with findings directly informing the 2025 Public Preview roadmap.`,
    "links": [
      {
        "title": "Microsoft Fabric Maps",
        "link": "https://blog.fabric.microsoft.com/en-us/blog/introducing-maps-in-fabric-geospatial-insights-for-everyone/"
      },
      {
        "title": "Creator QGIS Plugin",
        "link": "https://plugins.qgis.org/plugins/AzureMapsCreator/"
      },
      {
        "title": "Creator Onboarding Tool",
        "link": "https://azure.github.io/azure-maps-creator-onboarding-tool/"
      },
    ]
  },
  {
    "title": "Jio, Reliance Industries",
    "subtitle": "Computer Vision Researcher",
    "description": `Engineered a Tensorflow-based license plate recognition model, annotated 1000 images for training, achieving 65% accuracy. Optimized a Bert Model for processing and querying legal documents.`,
  },
  {
    "title": "Programming for Entrepreneurs and Social Good",
    "subtitle": "Head teaching assistant",
    "description": `Led a team of three TAs for three semesters, organized office hours for students and developed a grading scheme for the exam.`,
    "links": [
      {
        "title": "Course Website",
        "link": "https://www.coursicle.com/columbia/courses/INAF/U6004/"
      }
    ]
  }
]

export const Head = () => <Seo/>

export default WorkExperiencePage
