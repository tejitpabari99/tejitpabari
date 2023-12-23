import * as React from "react"
import Writeup from "../components/common/writeup"

import Layout from "../components/common/layout"
import Seo from "../components/common/seo"

const ResearchPage = () => (
  <Layout>
    <Writeup writeupData={writeupData} heading={"Research"}/>
  </Layout>
)

const writeupData = [
  {
    "title": "Flood Event Extraction from News Media to Support Satellite-Based Flood Index Insurance in Bangladesh",
    "description": `Researched on "Flood Event Extraction from News Media to Support Satellite-Based Flood Index Insurance in Bangladesh". Created and published a dataset of 40,000 tagged news articles covering flood events in Bangladesh by 10 prominent news sources. Developed a BERT-based classifier to extract flood-events. Created a flood-event time-series and defined criteria for flood occurrence and severity. Validated results against Sentinel data, with a correlation coefficient of 0.7. The results contributed to the development of a flood index insurance by the Bangladesh government. Authored a pre-print research paper and presented findings at the AGU conference.`,
    "links": [
      {
        "title": "Pre-print paper",
        "link": "https://bit.ly/tejit-flood-research"
      },
      {
        "title": "AGU Abstract Presentation",
        "link": "https://agu.confex.com/agu/fm20/meetingapp.cgi/Paper/766342"
      }
    ]
  },
  {
    "title": "SMARTtest: A Smartphone App to Facilitate HIV and Syphilis Self- and Partner-Testing, Interpretation of Results, and Linkage to Care",
    "description": `Created an affordable HIV & Syphilis detection app using React Native and Firebase, with Twilio & SendGrid for data sharing. Automated testing & deployment at Expo. The app has been downloaded 1000+, with news coverage. Published research in AIDS and Behaviour.`,
    "links": [
      {
        "title": "AIDS and Behaviour Paper",
        "link": "https://doi.org/10.1007/s10461-019-02718-y"
      }
    ]
  },
  {
    "title": "A Study on the Solar Illumination Provided by a Water Bottle",
    "description": `Experimentally demonstrated that the “Liter of Light” bottle outperforms a glass plate in illuminating low-light areas like slums. Regional Finalist for Google Science Fair. Published and presented research at Journal of Basic and Applied Engineering Research. Received media coverage for my research, with features in The Tribune, The Times of Indiaand Krishi Jagran national newspapers.`,
    "links": [
      {
        "title": "JBAER Paper",
        "link": "https://doi.org/10.7916/D8Q24BQ9"
      }
    ]
  }
]

export const Head = () => <Seo/>

export default ResearchPage
