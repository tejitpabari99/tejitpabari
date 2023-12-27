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
    "title": "Columbia Virtual Campus",
    "subtitle": "Co-Founder and CTO",
    "description": `Conceptualized CVC - a pandemic-born virtual community platform supporting students with resources, events, and initiatives. Led user research, product design and tech stack development using Javascript, Node.js, Firebase, Gatsby and Netlify. Mentored a team of 30 students across 5 projects. Achieved 10,000+ views, with 500+ unique users. Organized community projects such as Alumni Meetups, Freshmen Social, and Black Lives Matters tutoring initiative, raising $1100.`,
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
    "title": "Virtual Campus Design Challenge",
    "subtitle": "Head Organizer",
    "description": `Conceptualized and executed a three-day hackathon for Columbia students, offered technical mentorship to participants, orchestrated a speaker series featuring distinguished researchers, facilitated mentoring sessions and coordinated the judging process. Over 30 teams participated, with 4 winners in different categories awarded $500. The winning entries were widely used by the Columbia students to foster community interaction, medical support and improve online learning during the COVID crisis.`,
    "links": [
      {
        "title": "Website",
        "link": "https://columbiavirtualcampus.github.io/"
      },
      {
        "title": "News Coverage",
        "link": "https://www.engineering.columbia.edu/news/lydia-chilton-eugene-wu-design-challenge-covid"
      },
    ]
  },
  {
    "title": "Columbia Space Initiative",
    "subtitle": "Micro-G Challenge Leader",
    "description": `Co-led a team of 6 students to pursue the 2018 Micro-G challenge by NASA. Ideated, designed and built a working prototype of a novel zip-tie cutting device for astronauts to use in space. The device was selected for testing at NASA's Neutral Buoyancy Lab, and our team was invited to be a part of the testing as well. `,
    "links": [
      {
        "title": "Website",
        "link": "https://columbiaspace.org/microg/2018/01/19/micro-g-2018-intro-and-update/"
      },
      {
        "title": "News Coverage",
        "link": "https://www.engineering.columbia.edu/news/csi-spaceposium"
      }
    ]
  }
]

export const Head = () => <Seo/>

export default ProjectsPage
