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
    "subtitle": "Natural Language Processing Researcher",
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
    "title": "DVMM Lab",
    "subtitle": "Computer Vision Researcher",
    "description": `Developed a phrase grounding pipeline using YOLOv3 and BERT for image and caption extraction from research papers. Achieved 85\% accuracy. Constructed a searchable knowledge graph between image and captions. Classified Dosage Response curve using extracted features. Achieved 92.7% accuracy with AdaBoost.`,
    "links": [
      {
        "title": "Project Report",
        "link": "https://bit.ly/tejit-dvmm-lab-research-2020"
      }
    ]
  },
  {
    "title": "SMARTtest: A Smartphone App to Facilitate HIV and Syphilis Self- and Partner-Testing, Interpretation of Results, and Linkage to Care",
    "subtitle": "Full Stack Developer",
    "description": `Created an affordable HIV & Syphilis detection app using React Native and Firebase, with Twilio & SendGrid for data sharing. Automated testing & deployment at Expo. The app has been downloaded 1000+, with news coverage. Published research in AIDS and Behaviour.`,
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
  },
  {
    "title": "INCITE Labs",
    "subtitle": "Data Science Researcher",
    "description": `Extracted syllabi and mission statements from college websites to quantify measure for liberal arts education. Developed Python scripts for streamlined SQL database interaction.`,
    "links": [
      {
        "title": "Website",
        "link": "https://incite.columbia.edu/measuring-liberal-arts"
      },
      {
        "title": "News Coverage",
        "link": "https://www.labiotech.eu/best-biotech/hiv-test-app-home/#:~:text=SMARTtest,and%20syphilis%20in%20the%20blood."
      }
    ]
  },
  {
    "title": "Pill Recognition & Prescription Extraction",
    "subtitle": "Machine Learning Researcher",
    "description": `Utilized Google Vision and OCR to extract pill features and bottle imprints. Developed a multi-dimensional embedding using collected data for RandomForest and SVM classifiers, enabling precise pill identification.`,
    "links": [
      {
        "title": "Project Report",
        "link": "https://www.researchgate.net/publication/340528010_Pill_Detection_Prescription_Analysis"
      }
    ]
  },
  
  {
    "title": "A Study on the Solar Illumination Provided by a Water Bottle",
    "subtitle": "Researcher and First Author",
    "description": `Experimentally demonstrated that the “Liter of Light” bottle outperforms a glass plate in illuminating low-light areas like slums. Regional Finalist for Google Science Fair. Published and presented research at Journal of Basic and Applied Engineering Research. Received media coverage for my research, with features in The Tribune, The Times of Indiaand Krishi Jagran national newspapers.`,
    "links": [
      {
        "title": "JBAER Paper",
        "link": "https://doi.org/10.7916/D8Q24BQ9"
      },
      {
        "title": "Google Science Fair",
        "link": "https://www.hindustantimes.com/education/google-science-fair-two-indian-teens-among-global-finalists/story-B3iDwvHtxLngSz21egVOYJ.html"
      },
      {
        "title": "Times of India",
        "link": "https://timesofindia.indiatimes.com/education/news/two-indian-teens-among-global-finalists-at-google-science-fair/articleshow/53736020.cms"
      },
    ]
  }
]

export const Head = () => <Seo/>

export default ResearchPage
