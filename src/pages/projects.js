import * as React from "react"
import Writeup from "../components/common/writeup"

import Layout from "../components/common/layout"
import Seo from "../components/common/seo"

const ProjectsPage = () => (
  <Layout>
    <Writeup writeupData={writeupData} heading={"Projects"}/>
  </Layout>
)

const writeupData = [
  {
    "title": "Juno",
    "subtitle": "CEO and Co-Founder",
    "description": `Building an AI companion for medical appointments with the goal of improving patients' medical literacy. The app supports live note taking and real-time context-aware question generation during appointments, and provides clear, structured summaries with actionable follow-ups. Built in collaboration with neurologists and researchers, currently in talks with the National MS Society and Columbia University for funding. With 200+ patients surveyed, 30+ doctors consulted, and 70 patients in the beta waitlist, Juno is being developed with a strong focus on clinical validation and real-world applicability.`,
    "links": [
      {
        "title": "App",
        "link": "https://app.meetjuno.health/"
      },
      {
        "title": "Website",
        "link": "http://meetjuno.health/"
      }
    ]
  },
  {
    "title": "Med-Doc Tracker",
    "subtitle": "Developer",
    "description": `A personal health tool to store, organize, and search through all your medical documents in one place. Built to make navigating the fragmented world of medical records simpler and more accessible.`,
    "links": [
      {
        "title": "Website",
        "link": "https://tejitpabari.short.gy/med-doc-tracker"
      }
    ]
  },
  {
    "title": "Crunchy Filler",
    "subtitle": "Developer",
    "description": `A widely-used Chrome extension with 200+ downloads that marks filler episodes across anime series on Crunchyroll, helping fans skip non-canon content and stay on track with the main story.`,
    "links": [
      {
        "title": "Chrome Web Store",
        "link": "https://chromewebstore.google.com/detail/crunchy-filler/djbcknbbfoldifpllefimnnkfaogcnid"
      }
    ]
  },
  {
    "title": "Clip-Verse",
    "subtitle": "Developer",
    "description": `A web tool that extracts location information from YouTube videos and automatically pins them to Google Maps, turning travel and exploration content into navigable, interactive maps.`,
    "links": [
      {
        "title": "Website",
        "link": "https://clipverse-five.vercel.app/"
      }
    ]
  },
  {
    "title": "Fabric Maps MCP Server",
    "subtitle": "Developer",
    "description": `An MCP (Model Context Protocol) server that enables AI agents to interact with Fabric Maps APIs, allowing large language models to programmatically visualize and analyze geospatial data. Built as part of a Microsoft hackathon.`,
    "links": [
      {
        "title": "Hackathon Project",
        "link": "https://innovationstudio.microsoft.com/hackathons/MRTAthon-2025/project/112785"
      }
    ]
  },
  {
    "title": "Azure Maps AI Assistant",
    "subtitle": "Developer",
    "description": `An AI assistant that analyzes user data and automatically generates map visualizations based on natural language prompts. Built as part of a Microsoft hackathon, the assistant lowers the barrier to geospatial visualization by eliminating the need for manual configuration.`,
    "links": [
      {
        "title": "Hackathon Project",
        "link": "https://hackbox.microsoft.com/hackathons/MRTAthon/project/85641"
      }
    ]
  },
  {
    "title": "QGIS Plugin for Azure Maps Creator",
    "subtitle": "Developer",
    "description": `A QGIS plugin integrating Azure Maps Creator APIs directly into the QGIS environment, featuring efficient parallel data loading, an intuitive UI, and comprehensive debugging support and documentation. The plugin has been downloaded over 1,000 times.`,
    "links": [
      {
        "title": "QGIS Plugin Store",
        "link": "https://plugins.qgis.org/plugins/AzureMapsCreator/"
      }
    ]
  },
  {
    "title": "Creator Onboarding Tool",
    "subtitle": "Shadow Product Manager and Developer",
    "description": `Drove product development for the Azure Maps Creator Onboarding Tool as Shadow Product Manager, leading iterative design cycles informed by user feedback, accessible documentation, and analysis of API usage metrics to guide feature development.`,
    "links": [
      {
        "title": "Website",
        "link": "https://azure.github.io/azure-maps-creator-onboarding-tool/"
      }
    ]
  },
  {
    "title": "Columbia Virtual Campus",
    "subtitle": "Co-Founder and CTO",
    "description": `Conceptualized CVC - a pandemic-born virtual community platform supporting Columbia students with resources, events, and initiatives. Led user research, product design and tech stack development using Javascript, Node.js, Firebase, Gatsby and Netlify. Mentored a team of 40 students across 5 projects, achieving 10,000+ views with 500+ unique users. Organized community projects such as Alumni Meetups, Freshmen Social, and a Black Lives Matter tutoring initiative, raising $1,100.`,
    "links": [
      {
        "title": "Website",
        "link": "https://columbiavirtualcampus.com/"
      },
      {
        "title": "Facebook",
        "link": "https://www.facebook.com/columbiavirtualcampus/"
      },
      {
        "title": "Instagram",
        "link": "https://www.instagram.com/columbiavirtualcampus/"
      },
    ]
  },
  {
    "title": "SMARTtest: HIV & Syphilis Self-Testing App",
    "subtitle": "Full Stack Developer",
    "description": `Created an affordable HIV & Syphilis detection app using React Native and Firebase, with Twilio & SendGrid for secure data sharing. Automated testing and deployment through Expo. The app has been downloaded 1,000+ times and received widespread news coverage. Research was published in the AIDS and Behaviour journal.`,
    "links": [
      {
        "title": "AIDS and Behaviour Paper",
        "link": "https://doi.org/10.1007/s10461-019-02718-y"
      },
      {
        "title": "News Coverage",
        "link": "https://www.labiotech.eu/best-biotech/hiv-test-app-home/#:~:text=SMARTtest,and%20syphilis%20in%20the%20blood."
      }
    ]
  }
]

export const Head = () => <Seo/>

export default ProjectsPage
