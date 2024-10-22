import { userState } from "@/pages/atom.ts";
import { passwordValidator } from "@/utils/form_validator.ts";
import {
  Box,
  Button,
  Flex,
  FormControl,
  FormLabel,
  Heading,
  Input,
  Stack,
  Text,
  useColorModeValue,
  useToast,
} from "@chakra-ui/react";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  signInWithPopup,
} from "@firebase/auth";
import { Field, Formik } from "formik";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useRecoilState } from "recoil";
import { emailValidator } from "../../utils/form_validator";

export function Login() {
  const navigate = useNavigate();
  const [ user, setUser ] = useRecoilState(userState);
  const bg = useColorModeValue("white", "gray.700");
  const toast = useToast();

  useEffect(() => {
    if (user.id) {
      navigate("/");
    }
  }, [ navigate, user ]);

  return (
    <Flex
      minH={"100vh"}
      align={"center"}
      justify={"center"}
      bg={useColorModeValue("gray.50", "gray.800")}
      transform={"translateY(-15%)"}
      // avoid flicker on back press when logged in
      opacity={user.id ? 0 : 1}
    >
      <Stack spacing={8} mx={"auto"} maxW={"lg"} py={12} px={6} w={"450px"}>
        <Stack align={"center"}>
          <Heading fontSize={"4xl"}>Sign in</Heading>
        </Stack>
        <Formik
          initialValues={{
            email: "",
            password: "",
          }}
          onSubmit={(
            values: { email: string; password: string },
            { setSubmitting },
          ) => {
            const { email, password } = values;
            const auth = getAuth();
            signInWithEmailAndPassword(auth, email, password)
              .then((userCredential) => {
                const user = userCredential.user;
                user
                  .getIdToken()
                  .then((idToken) => {
                    localStorage.setItem("token", idToken);
                    const refreshToken = user.refreshToken;
                    localStorage.setItem("refreshToken", refreshToken);

                    setUser({
                      id: user.uid,
                      email: user.email ?? "",
                      username: user.displayName ?? "",
                    });
                  })
                  .catch((error) => {
                    toast({
                      title: "Failed to get user token.",
                      description: error.message,
                      status: "error",
                      duration: 9000,
                      isClosable: true,
                      position: "top-right",
                    });
                  });
              })
              .catch((error) => {
                toast({
                  title: "Failed to get user details.",
                  description: error.message,
                  status: "error",
                  duration: 9000,
                  isClosable: true,
                  position: "top-right",
                });
                setSubmitting(false);
              });
          }}
        >
          {({
            // values,
            errors,
            touched,
            // handleChange,
            // handleBlur,
            handleSubmit,
            isSubmitting,

            /* and other goodies */
          }) => {
            return (
              <form onSubmit={handleSubmit}>
                <Box rounded={"lg"} bg={bg} boxShadow={"lg"} p={8}>
                  <Stack spacing={4}>
                    <FormControl
                      id="email"
                      isInvalid={Boolean(errors.email) && touched.email}
                    >
                      <FormLabel>Email</FormLabel>
                      <Field
                        as={Input}
                        type="text"
                        id="email"
                        name="email"
                        isDisabled={isSubmitting}
                        validate={emailValidator}
                      />
                    </FormControl>

                    <FormControl
                      id="password"
                      isInvalid={Boolean(errors.password) && touched.password}
                    >
                      <FormLabel>Password</FormLabel>
                      <Field
                        as={Input}
                        type="password"
                        id="password"
                        name="password"
                        isDisabled={isSubmitting}
                        validate={passwordValidator}
                      />
                    </FormControl>
                    <Stack spacing={10}>
                      {/* <Stack
                      direction={{ base: "column", sm: "row" }}
                      align={"start"}
                      justify={"space-between"}
                    >
                      <Field
                        as={Checkbox}
                        name="rememberMe"
                        id="rememberMe"
                        isDisabled={isSubmitting}
                      >
                        Remember me
                      </Field>
                    </Stack> */}

                      <Stack spacing={4} mt={4}>
                        <Button
                          bg={"black"}
                          color={"white"}
                          _hover={{
                            bg: "black",
                          }}
                          type="submit"
                          isDisabled={isSubmitting}
                          isLoading={isSubmitting}
                        >
                          Sign in
                        </Button>

                        {/* google provider with icon */}
                        <Button
                          // leftIcon={<FaGoogle />}
                          variant={"outline"}
                          onClick={() => {
                            const auth = getAuth();
                            const provider = new GoogleAuthProvider();
                            // show google sign in popup
                            signInWithPopup(auth, provider)
                              .then((result) => {
                                // This gives you a Google Access Token. You can use it to access the Google API.
                                const credential =
                                  GoogleAuthProvider.credentialFromResult(
                                    result,
                                  );
                                if (credential === null) {
                                  throw new Error(
                                    "Failed to get credential from result",
                                  );
                                }
                                const token = credential.accessToken!;
                                localStorage.setItem("token", token);
                                const user = result.user;

                                setUser({
                                  id: user.uid,
                                  email: user.email ?? "",
                                  username: user.displayName ?? "",
                                });
                              })
                              .catch((error) => {
                                toast({
                                  title: "Failed to sign in with Google",
                                  description: error.message,
                                  status: "error",
                                  duration: 9000,
                                  isClosable: true,
                                  position: "top-right",
                                });
                              });
                          }}
                          isDisabled={isSubmitting}
                        >
                          Sign in with Google
                        </Button>

                        <Text
                          color={"gray.500"}
                          fontSize={"sm"}
                          textAlign={"center"}
                        >
                          or
                        </Text>
                        <Button
                          variant={"outline"}
                          onClick={() => {
                            navigate("/register");
                          }}
                          isDisabled={isSubmitting}
                        >
                          Sign up
                        </Button>
                      </Stack>
                    </Stack>
                  </Stack>
                </Box>
              </form>
            );
          }}
        </Formik>
      </Stack>
    </Flex>
  );
}
