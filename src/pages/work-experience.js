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
    "title": "Azure Maps Creator",
    "subtitle": "Software Engineer",
    "description": `Developed a Performance Testing Framework with PowerBI visualization to diagnose latency regressions. Shadow Product Manager, drove product development for Creator Onboarding tool. Analyzed metrics for API usage to drive feature-development. Spearheaded development of a QGIS plugin for Creator APIs, with efficient parallel data loading, intuitive UI design, debugging support and comprehensive documentation. Plugin has been downloaded 1,000+ times. Directed diversity initiatives, health-focused challenges, team bonding events.`,
    "links": [
      {
        "title": "Azure Maps Creator",
        "link": "https://www.microsoft.com/en-us/maps/azure/azure-maps-creator"
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
