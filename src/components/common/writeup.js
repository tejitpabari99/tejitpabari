'use client'

import * as React from "react"
import {
  Flex,
  Box,
  Stack,
  Heading,
  Text,
  Button,
  Divider,
  useColorModeValue
} from '@chakra-ui/react'


const Writeup = ({ writeupData, heading }) => {
  return (
    <Flex maxW={'70%'} paddingTop={'20vh'} display={'block'}
        direction={'column'} marginLeft={'auto'} marginRight={'auto'}>
        {heading && <Heading as="h1" size="2xl" noOfLines={1} marginBottom={'2vh'}> 
          {heading} 
        </Heading>}
        <Stack direction='column'>
            {writeupData && writeupData.map((item) => 
                <WriteupItem {...item}/>
            )}
        </Stack>
    </Flex>
  )
}

const WriteupItem = ({title, description, links}) => {
    return(
        <Box marginTop={'6vh'} marginB>
            <Heading as="h2" size="lg">{title}</Heading>
            <Text maxWidth={"100%"} paddingTop={'2vh'}>{description}</Text>
            <Stack direction={'row'} spacing={5}>
              {links && links.map((item) => 
                  <WriteupLinks {...item}/>
              )}
            </Stack>
        </Box>
    )
}

const WriteupLinks = ({title, link}) => {
    return (
      <Button
        as={'a'}
        display={{ base: 'none', md: 'inline-flex' }}
        fontSize={'sm'}
        fontWeight={600}
        color={'blue.400'}
        bg={useColorModeValue('white', 'gray.800')}
        href={link}
        target="_blank"
        isExternal={'true'}
        borderStyle={'solid'}
        border={'1px'}
        borderColor={'blue.400'}
        _hover={{
            bg: 'blue.400',
            color: 'white'
        }}>
        {title}
      </Button>
    )
}

export default Writeup