import { useSession, signIn, signOut } from 'next-auth/react';
import { Link } from '@chakra-ui/next-js';
import styles from './header.module.css';
import {
  Box,
  Flex,
  Avatar,
  HStack,
  Text,
  IconButton,
  Button,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  MenuDivider,
  useDisclosure,
  useColorModeValue,
  Stack,
  useColorMode,
  ButtonGroup,
} from '@chakra-ui/react';
import { HamburgerIcon, CloseIcon, AddIcon, SunIcon, MoonIcon, ChevronDownIcon } from '@chakra-ui/icons';
import { PropsWithChildren } from 'react';

const Links = [''];

const NavLink = ({ children }: PropsWithChildren) => {
  return (
    <Link
      px={2}
      py={1}
      rounded={'md'}
      _hover={{
        textDecoration: 'none',
        bg: useColorModeValue('gray.200', 'gray.700'),
      }}
      href={'#'}>
      {children}
    </Link>
  );
};

const ProfileMenu = () => {
  const { data: session } = useSession();

  const menuItems = session ? <>
    <MenuItem as="a" href={`/user/${session?.user?.name}`}>Profile</MenuItem>
    <MenuItem as="a" href={`/user/${session?.user?.name}/schemas`}>Schemas</MenuItem>
    <MenuItem as="a" href="/orgs">Organizations</MenuItem>
    <MenuDivider />
    <MenuItem>Settings</MenuItem>
    <MenuItem onClick={() => signOut()}>Sign out</MenuItem>
  </> : <MenuItem onClick={() => signIn()}>Sign in</MenuItem>;

  return (
    <Menu>
      <MenuButton as={Button} rounded={'full'} variant={'link'} cursor={'pointer'} minW={0}>
        <Avatar
          size={'sm'}
          src={
            'https://images.unsplash.com/photo-1493666438817-866a91353ca9?ixlib=rb-0.3.5&q=80&fm=jpg&crop=faces&fit=crop&h=200&w=200&s=b616b2c5b373a80ffc9636ba24f7a4a9'
          }
        />
      </MenuButton>
      <MenuList>
        {menuItems}
      </MenuList>
    </Menu>
  );
};

export default function Header() {
  const { colorMode, toggleColorMode } = useColorMode();
  const { isOpen, onOpen, onClose } = useDisclosure();

  return (
    <>
      <Box bg={useColorModeValue('gray.100', 'gray.900')} px={4}>
        <Flex h={16} alignItems={'center'} justifyContent={'space-between'}>
          <IconButton
            size={'md'}
            icon={isOpen ? <CloseIcon /> : <HamburgerIcon />}
            aria-label={'Open Menu'}
            display={{ md: 'none' }}
            onClick={isOpen ? onClose : onOpen}
          />
          <HStack spacing={8} alignItems={'center'}>
            <Box>
              <Link href="/">Home</Link>
            </Box>
            <HStack as={'nav'} spacing={4} display={{ base: 'none', md: 'flex' }}>
              {Links.map((link) => (
                <NavLink key={link}>{link}</NavLink>
              ))}
            </HStack>
          </HStack>
          <Flex alignItems={'center'} gap="2">
            <ButtonGroup isAttached>
              <Button as="a" href="/schema/new" variant={'solid'} colorScheme={'teal'} size={'sm'} leftIcon={<AddIcon />}>
                Create
              </Button>
              <Menu>
                <MenuButton as={IconButton} icon={<ChevronDownIcon />} size={'sm'} colorScheme="teal" />
                <MenuList>
                  <MenuItem as="a" href="/schema/new">New</MenuItem>
                  <MenuItem as="a" href="/schema/record">Record</MenuItem>
                </MenuList>
              </Menu>
            </ButtonGroup>

            <Button onClick={toggleColorMode} bgColor={'transparent'}>
              {colorMode === 'light' ? <MoonIcon /> : <SunIcon />}
            </Button>

            <ProfileMenu />
          </Flex>
        </Flex>

        {isOpen ? (
          <Box pb={4} display={{ md: 'none' }}>
            <Stack as={'nav'} spacing={4}>
              {Links.map((link) => (
                <NavLink key={link}>{link}</NavLink>
              ))}
            </Stack>
          </Box>
        ) : null}
      </Box>
    </>
  );
};

