import * as React from 'react';
import ProjectCard from './ProjectCard';
import { Box, Flex, forwardRef, Avatar, Container, Image, Stack } from '@chakra-ui/react';

const ANIMATION_DURATION = 0.5;

const ProjectSection = () => {
  return (
    <Flex maxW={''} padding={'10vh'} h={'100%'} display={'block'} bg={'#f8fafc'} 
          direction={'column'} textAlign={'left'} fontFamily={'poppins'}>
      <Box as="h1" fontSize="3xl" fontWeight="400" marginBottom={'10px'} textAlign={'left'}>
      Projects
      </Box>
      <Flex flexWrap="wrap" gridGap={6} justify="space-between" mt={'5vh'}>
        <ProjectCard 
          imgSrc='https://images.unsplash.com/photo-1515378791036-0648a3ef77b2?ixid=MXwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHw%3D&ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80'
          imgAlt='Test Image'
          title='Project Title'
          desc='This is a sample Project description. Wow what a great description'
          link='https://i.imgur.com/bPcitZs.jpeg'/>
        <ProjectCard 
          imgSrc='https://images.unsplash.com/photo-1515378791036-0648a3ef77b2?ixid=MXwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHw%3D&ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80'
          imgAlt='Test Image'
          title='Project Title'
          desc='This is a sample Project description. Wow what a great description'
          link='https://i.imgur.com/bPcitZs.jpeg'/>
        <ProjectCard 
          imgSrc='https://images.unsplash.com/photo-1515378791036-0648a3ef77b2?ixid=MXwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHw%3D&ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80'
          imgAlt='Test Image'
          title='Project Title'
          desc='This is a sample Project description. Wow what a great description'
          link='https://i.imgur.com/bPcitZs.jpeg'/>
      </Flex>
    </Flex>
  );
};

export default ProjectSection;