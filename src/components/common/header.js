'use client'

import * as React from "react"
import {
  Box,
  Flex,
  Text,
  Button,
  Stack,
  Popover,
  PopoverTrigger,
  PopoverContent,
  useColorMode,
  useColorModeValue
} from '@chakra-ui/react'
import { MoonIcon, SunIcon } from '@chakra-ui/icons'

/*
  {
    label: 'Blog',
    children: [
      {
        label: 'Work',
        href: '#',
      },
      {
        label: 'Outdoors',
        href: '#',
      },
    ],
  },
  */
const Header = () => {
  const { colorMode, toggleColorMode } = useColorMode()
  return (
    <>
      <Flex
        zIndex={1}
        as="header" position="fixed"
        width={'100%'}
        bg={useColorModeValue('white', 'gray.800')}
        color={useColorModeValue('gray.600', 'white')}
        minH={'60px'}
        py={{ base: 2 }}
        px={{ base: 4 }}
        justifyContent={'space-between'}
        align={'center'}>
        <Button
          as={'a'}
          textAlign={'center'}
          fontFamily={'heading'}
          fontWeight={'medium'}
          fontSize={'4vh'}
          marginBottom={0}
          paddingLeft={'10px'}
          bg={useColorModeValue('white', 'gray.800')}
          color={useColorModeValue('gray.700', 'gray.200')}
          href={'./files'}
          variant='link'
          _hover={{
            textDecoration: 'none',
            color: useColorModeValue('black', 'white'),
          }}>
          Tejit Pabari
        </Button>
        <Flex display={{ base: 'center', md: 'flex' }} ml={10}>
          <DesktopNav />
        </Flex>
        <Stack direction={'row'} spacing={2} >
          <Button onClick={toggleColorMode}>
            {colorMode === 'light' ? <MoonIcon /> : <SunIcon />}
          </Button>
          <Button
            as={'a'}
            display={{ base: 'none', md: 'inline-flex' }}
            fontSize={'sm'}
            fontWeight={600}
            color={'pink.400'}
            bg={useColorModeValue('white', 'gray.800')}
            href={''}
            target="_blank"
            isExternal={'true'}
            borderStyle={'solid'}
            border={'1px'}
            borderColor={'pink.400'}
            _hover={{
              bg: 'pink.400',
              color: 'white'
            }}>
            Resume
          </Button>
        </Stack>
        
      </Flex>
    </>
  )
}

const DesktopNav = () => {
  const linkColor = useColorModeValue('gray.600', 'gray.200')
  const linkHoverColor = useColorModeValue('gray.800', 'white')
  const popoverContentBgColor = useColorModeValue('white', 'gray.800')

  return (
    <Stack direction={'row'} spacing={4}>
      {NAV_ITEMS.map((navItem) => (
        <Box key={navItem.label}>
          <Popover trigger={'hover'} placement={'bottom-start'}>
            <PopoverTrigger>
              <Box
                as="a"
                p={2}
                href={navItem.href ?? '#'}
                fontSize={'sm'}
                fontWeight={500}
                color={linkColor}
                _hover={{
                  textDecoration: 'none',
                  color: linkHoverColor,
                }}>
                {navItem.label}
              </Box>
            </PopoverTrigger>

            {navItem.children && (
              <PopoverContent
                bg={popoverContentBgColor}
                p={4}
                rounded={'xl'}>
                <Stack>
                  {navItem.children.map((child) => (
                    <DesktopSubNav key={child.label} {...child} />
                  ))}
                </Stack>
              </PopoverContent>
            )}
          </Popover>
        </Box>
      ))}
    </Stack>
  )
}

const DesktopSubNav = ({ label, href }) => {
  return (
    <Box
      as="a"
      href={href}
      role={'group'}
      display={'block'}
      p={2}
      rounded={'md'}
      _hover={{ bg: useColorModeValue('pink.50', 'gray.900') }}>
      <Box>
        <Text
          transition={'all .3s ease'}
          _groupHover={{ color: 'pink.400' }}
          fontWeight={500}>
          {label}
        </Text>
      </Box>
    </Box>
  )
}

const NAV_ITEMS = [
  {
    label: 'Research',
    href: '/research',
  },
  {
    label: 'Work Experience',
    href: '/work-experience',
  },
  {
    label: 'Projects',
    href: '/projects',
  },
  {
    label: 'About',
    href: '/about',
  },
]

export default Header