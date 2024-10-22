import { userState } from "@/pages/atom.ts";
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
  createUserWithEmailAndPassword,
  getAuth,
  updateProfile,
  User,
} from "@firebase/auth";
import { Field, Formik } from "formik";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useRecoilState } from "recoil";
import {
  emailValidator,
  passwordValidator,
} from "../../utils/form_validator.ts";

export function Register() {
  const navigate = useNavigate();
  const [ user, setUser ] = useRecoilState(userState);
  const bg = useColorModeValue("white", "gray.700");
  const formBg = useColorModeValue("gray.50", "gray.800");
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
      bg={formBg}
      transform={"translateY(-15%)"}
    >
      <Formik
        initialValues={{ username: "", email: "", password: "" }}
        onSubmit={(
          values: { username: string; email: string; password: string },
          { setSubmitting },
        ) => {
          const { username, email, password } = values;
          console.log(username, email, password);

          const auth = getAuth();

          createUserWithEmailAndPassword(auth, email, password)
            .then((userCredential) => {
              const user = userCredential.user as User;
              updateProfile(user, {
                displayName: username,
              })
                .then(() => {
                  user.getIdTokenResult().then((idTokenResult) => {
                    const idToken = idTokenResult.token;
                    localStorage.setItem("token", idToken);
                    const refreshToken = user.refreshToken;
                    localStorage.setItem("refreshToken", refreshToken);

                    setUser({
                      id: user.uid,
                      username: username,
                      email: email,
                    });
                    navigate("/");
                  });
                })
                .catch((error) => {
                  toast({
                    title: "Failed to update user profile.",
                    description: error.message,
                    status: "error",
                    duration: 9000,
                    isClosable: true,
                    position: "top-right",
                  });
                  setSubmitting(false);
                });
            })
            .catch((error) => {
              toast({
                title: "Failed to create user.",
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
        }) =>
          <form onSubmit={handleSubmit}>
            <Stack
              spacing={8}
              mx={"auto"}
              maxW={"lg"}
              py={12}
              px={6}
              w={"450px"}
            >
              <Stack align={"center"}>
                <Heading fontSize={"4xl"}>Sign up</Heading>
              </Stack>
              <Box rounded={"lg"} bg={bg} boxShadow={"lg"} p={8}>
                <Stack spacing={4}>
                  <FormControl
                    id="username"
                    isInvalid={Boolean(errors.username) && touched.username}
                  >
                    <FormLabel>Username</FormLabel>
                    <Field
                      name="username"
                      as={Input}
                      isDisabled={isSubmitting}
                      validate={usernameValidator}
                    />
                  </FormControl>
                  <FormControl
                    id="email"
                    isInvalid={Boolean(errors.email) && touched.email}
                  >
                    <FormLabel>Email</FormLabel>
                    <Field
                      name="email"
                      as={Input}
                      type="email"
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
                      name="password"
                      as={Input}
                      type="password"
                      isDisabled={isSubmitting}
                      validate={passwordValidator}
                    />
                  </FormControl>

                  <Stack spacing={10}>
                    <Stack spacing={4} mt={4}>
                      <Button
                        bg={"black"}
                        color={"white"}
                        _hover={{
                          bg: "black",
                        }}
                        type="submit"
                        isLoading={isSubmitting}
                        isDisabled={isSubmitting}
                      >
                        Sign up
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
                          navigate("/login");
                        }}
                      >
                        Sign in
                      </Button>
                    </Stack>
                  </Stack>
                </Stack>
              </Box>
            </Stack>
          </form>
        }
      </Formik>
    </Flex>
  );
}
