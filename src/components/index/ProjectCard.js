import * as React from 'react';
import { Card, CardBody, CardFooter, Button, Stack, Image, Heading, Text, useColorModeValue } from '@chakra-ui/react';
import { ArrowForwardIcon } from '@chakra-ui/icons'

const ANIMATION_DURATION = 0.5;

const ProjectCard = ({imgSrc, imgAlt, title, desc, link}) => {
  return (
    <Card maxW='sm'>
      <CardBody padding={0}>
        <Image
          src={imgSrc}
          alt={imgAlt}
          h={'210px'}
          width={'100%'}
        />
        <Stack spacing='3' padding={'var(--card-padding)'}>
          <Heading size='md'>{title}</Heading>
          <Text>
              {desc}
          </Text>
        </Stack>
      </CardBody>
      <CardFooter>
      <Button
          as={'a'}
          textAlign={'center'}
          fontFamily={'heading'}
          bg={useColorModeValue('white', 'gray.800')}
          color={useColorModeValue('gray.700', 'gray.200')}
          href={link}
          variant='link'
          _hover={{
            textDecoration: 'none',
            color: useColorModeValue('black', 'white'),
          }}>
          Read More <ArrowForwardIcon/>
        </Button>
      </CardFooter>
    </Card>
  );
};

export default ProjectCard;