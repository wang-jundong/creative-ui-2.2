import React, { useEffect, useState } from "react";
// @ts-ignore
import { PrivateKey } from '@textile/hub'
import { BigNumber, providers, utils } from 'ethers'
import bcryptjs from 'bcryptjs';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  Button,
  Flex,
  Box,
  Heading,
  FormControl,
  FormLabel,
  FormErrorMessage,
  FormHelperText,
  Select,
  Input,
  InputGroup,
  InputRightElement,
  Container,
  Stack,
  useToast,
  useColorModeValue,
} from "@chakra-ui/react";
import { TextileInstance } from "../../../services/textile/textile";
import SignUp from './SignUp';
import LogoModal from './LogoModal';
import { useEthers } from "@usedapp/core";
import { useAuth } from "../../../services/context/auth";
import { UserModel } from "../../../services/textile/types";

type WindowInstanceWithEthereum = Window & typeof globalThis & { ethereum?: providers.ExternalProvider };
class StrongType<Definition, Type> {
  // @ts-ignore
  private _type: Definition;
  constructor(public value?: Type) {}
}
export class EthereumAddress extends StrongType<'ethereum_address', string> {}

const SignIn = (props) => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [closeButtons , setCloseButtons] = useState(false)
  const [secret, setSecret] = useState<string>();
  
  const toast = useToast()

  const { logIn } = useAuth();

  const { account, library } = useEthers();

  const handleChange = (e: any) => setSecret(e.target.value);

  const generateMessageForEntropy = (ethereum_address: EthereumAddress, application_name: string, secret: string): string => {
    return (
      '******************************************************************************** \n' +
      'READ THIS MESSAGE CAREFULLY. \n' +
      'DO NOT SHARE THIS SIGNED MESSAGE WITH ANYONE OR THEY WILL HAVE READ AND WRITE \n' +
      'ACCESS TO THIS APPLICATION. \n' +
      'DO NOT SIGN THIS MESSAGE IF THE FOLLOWING IS NOT TRUE OR YOU DO NOT CONSENT \n' +
      'TO THE CURRENT APPLICATION HAVING ACCESS TO THE FOLLOWING APPLICATION. \n' +
      '******************************************************************************** \n' +
      'The Ethereum address used by this application is: \n' +
      '\n' +
      ethereum_address.value +
      '\n' +
      '\n' +
      '\n' +
      'By signing this message, you authorize the current application to use the \n' +
      'following app associated with the above address: \n' +
      '\n' +
      application_name +
      '\n' +
      '\n' +
      '\n' +
      'The hash of your non-recoverable, private, non-persisted password or secret \n' +
      'phrase is: \n' +
      '\n' +
      secret +
      '\n' +
      '\n' +
      '\n' +
      '******************************************************************************** \n' +
      'ONLY SIGN THIS MESSAGE IF YOU CONSENT TO THE CURRENT PAGE ACCESSING THE TEXTILE KEYS \n' +
      'ASSOCIATED WITH THE ABOVE ADDRESS AND APPLICATION. \n' +
      'NOTE THIS DOES NOT ALLOW ACCESS TO YOUR WALLET FOR BLOCKCHAIN TX. \n' +
      'AGAIN, DO NOT SHARE THIS SIGNED MESSAGE WITH ANYONE OR THEY WILL HAVE READ AND \n' +
      'WRITE ACCESS TO THIS APPLICATION. \n' +
      '******************************************************************************** \n'
    );
  }

  const generatePrivateKey = async (): Promise<PrivateKey> => {
    const signer = library.getSigner();
    const salt: string = "$2a$10$3vx4QH1vSj9.URynBqkbae";
    // avoid sending the raw secret by hashing it first
    const hashSecret = bcryptjs.hashSync(secret, salt);
    const message = generateMessageForEntropy(new EthereumAddress(account), 'Creative', hashSecret)
    const signedText = await signer.signMessage(message);
    const hash = utils.keccak256(signedText);
    if (hash === null) {
      throw new Error('No account is provided. Please provide an account to this application.');
    }
    // The following line converts the hash in hex to an array of 32 integers.
      // @ts-ignore
    const array = hash
      // @ts-ignore
      .replace('0x', '')
      // @ts-ignore
      .match(/.{2}/g)
      .map((hexNoPrefix) => BigNumber.from('0x' + hexNoPrefix).toNumber())
    
    if (array.length !== 32) {
      throw new Error('Hash of signature is not the correct size! Something went wrong!');
    }
    const identity = PrivateKey.fromRawEd25519Seed(Uint8Array.from(array))
    console.log(`Your VIP Key: ${identity.toString()}`)
    
    const identityString = identity.toString()
    localStorage.setItem("user-private-identity" , identityString)

    createNotification(identity);
    setCloseButtons(true)
    onClose();
    // Close the modal function and set local storage variable 
    //handleSuccessSignin(); // set close buttons to true 
    // Create a textile instance which will create or get the bucket assoicated with this user.
    // Initialize the instance now itself which would create the bucket as well as the thread db collection
    // to hold the content and its related metadata.

    await TextileInstance.setPrivateKey(identity);

    await logIn();

    // Your app can now use this identity for generating a user Mailbox, Threads, Buckets, etc
    return identity
  }

  const createNotification = (identity: PrivateKey) => {
    toast({ 
      title: "Secret Key",
      status: "success",
      description: ` SIGNED IN! Public Key: ${identity.public.toString()} Your app can now generate and reuse this users PrivateKey for creating user Mailboxes, Threads, and Buckets.`,
      duration: 9000,
      isClosable: true,
    });
  }

  const [show, setShow] = useState(false);

  const handleClick = () => setShow(!show);

  return (
    <>
      <Button variant="ghost" size="md" onClick={onOpen} >
        Sign In
      </Button>

      <Modal isOpen={isOpen} onClose={onClose} size="xl" isCentered>
        <ModalOverlay />
        <ModalContent borderRadius="10px" h="400px">
          <ModalCloseButton />
          <ModalBody
            borderRadius="10px"
            bgGradient="linear(to-r, rgb(40, 92, 163), rgb(229, 1, 105))"
            h="800px"
          >
            <Flex alignItems="center" pt="2%" justifyContent="space-between">
              <Stack spacing={1}>
              <LogoModal />
              <Heading fontSize="2rem" color={useColorModeValue("white", "white")}>CREATIVE</Heading>
              </Stack>
              <Container>
              <Stack spacing={6}>
                <Heading as="h6" size="md" color={useColorModeValue("white", "white")}>Sign In</Heading>
                {/* name */}
                  <FormControl id="login" isRequired>
                  <FormLabel color={useColorModeValue("white", "white")}>Password</FormLabel>
                    <InputGroup>
                      <Input
                        name="password"
                        color={"white"}
                        placeholder="Password"
                        type={show ? "text" : "password"}
                        
                        onChange={handleChange}
                      />
                      <InputRightElement width="4.5rem">
                      <Button h="1.75rem" size="sm" onClick={handleClick} color={useColorModeValue("gray.900", "white")}>
                        {show ? "Hide" : "Show"}
                      </Button>
                    </InputRightElement>
                    </InputGroup>
                    <FormHelperText>enter account password</FormHelperText>
                    <Button onClick={generatePrivateKey} padding={2} color={useColorModeValue("gray.900", "white")}>Login with Metamask</Button>
                  </FormControl>
                </Stack>
              </Container>
            </Flex>
          </ModalBody>
        </ModalContent>
      </Modal>
    </>
  );
};

export default SignIn;
