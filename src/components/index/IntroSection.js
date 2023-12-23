import * as React from 'react';
import { Box, Flex, forwardRef, Avatar, Container, Image, Stack } from '@chakra-ui/react';

const ANIMATION_DURATION = 0.5;

const IntroSection = () => {
  return (
    <Flex maxW={'60%'} paddingTop={'40vh'} h={'100vh'} display={'block'}
          direction={'column'}textAlign={'center'} fontFamily={'poppins'}
          marginLeft={'auto'} marginRight={'auto'}>
      <Box as="h1" fontSize="5xl" fontWeight="400" marginBottom={'20px'}>
        Hi, I'm Tejit!
      </Box>
      <Box as="h2" fontSize="2xl" fontWeight="400">
        I'm a Software Engineer at Azure Maps, Microsoft.
      </Box>
      <Box as="h2" fontSize="2xl" fontWeight="400" mt={5}>
        I am passionate about research and projects in the geospatial field, positively impacting the community
      </Box>
    </Flex>
  );
};

export default IntroSection;