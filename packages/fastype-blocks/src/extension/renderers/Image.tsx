import {
  CarbonBlock,
  RendererProps,
  preventAndStop,
  useCarbon,
  useSelectionHalo,
} from "@emrgen/carbon-core";
import { useCallback, useRef, useState } from "react";
import { LazyLoadImage } from "react-lazy-load-image-component";

import {
  Box,
  Button,
  Center,
  Flex,
  IconButton,
  Input,
  Spinner,
  Square,
  Stack,
  Text,
  useDisclosure,
} from "@chakra-ui/react";
import {
  useCombineConnectors,
  useConnectorsToProps,
  useDragDropRectSelect,
} from "@emrgen/carbon-dragon";
import { Form, Formik } from "formik";
import { HiMiniBars3BottomLeft, HiMiniBars3BottomRight } from "react-icons/hi2";
import { LuAlignCenter } from "react-icons/lu";
import { RxImage } from "react-icons/rx";
import { TbStatusChange } from "react-icons/tb";
import { useFastypeOverlay } from "../../hooks/useFastypeOverlay";

export function ImageComp(props: RendererProps) {
  const { node } = props;
  const { node: image } = node.attrs;
  const app = useCarbon();
  const [ready, setReady] = useState(false);

  const ref = useRef<HTMLDivElement>(null);
  const updater = useDisclosure();
  useFastypeOverlay(updater);

  const selection = useSelectionHalo(props);
  const dragDropRect = useDragDropRectSelect({ node, ref });
  const connectors = useConnectorsToProps(
    useCombineConnectors(dragDropRect, selection)
  );

  const handleClick = (e) => {
    preventAndStop(e);

    app.emit(
      "show:options:menu",
      node.id,
      ref.current?.getBoundingClientRect()
    );

    app.tr.selectNodes([node.id]).dispatch();
  };

  const alignImage = useCallback(
    (align) => {
      return (e) => {
        preventAndStop(e);
        const { tr } = app;
        app.blockSelection.blocks
          .filter((n) => n.name === "image")
          .forEach(({ id }) => {
            tr.updateAttrs(id, {
              html: {
                style: {
                  justifyContent: align,
                },
              },
            });
          });
        tr.dispatch();
      };
    },
    [app]
  );

  const onClick = useCallback(
    (e) => {
      // preventAndStop(e);
      app.tr.selectNodes([]).dispatch();
    },
    [app.tr]
  );

  console.log("image", image.src);

  return (
    <>
      <CarbonBlock {...props} custom={{ ...connectors, onClick }} ref={ref}>
        {updater.isOpen && (
          <>
            <Box
              contentEditable={false}
              suppressContentEditableWarning
              pos={"absolute"}
              bottom={"100%"}
              left={"50%"}
              bg="white"
              transform={"translate(-50%,0)"}
              boxShadow={"0 0 10px 0 #aaa"}
              borderRadius={6}
              p={4}
              zIndex={1000}
              onBeforeInput={stop}
              onKeyUp={stop}
              onKeyDown={stop}
            >
              <Formik
                initialValues={{
                  src: "",
                }}
                onSubmit={(values, actions) => {
                  const { src } = values;
                  if (!src) return;

                  console.log("values", values, actions);
                  actions.setSubmitting(true);
                  console.log("submit", values.src);

                  setTimeout(() => {
                    updater.onClose();
                    actions.setSubmitting(false);
                    app.tr
                      .updateAttrs(node.id, {
                        node: {
                          src: values.src,
                        },
                      })
                      .dispatch();
                  }, 1000);
                }}
              >
                {(props) => (
                  <Form>
                    <Stack w={300} spacing={4}>
                      <Input
                        autoFocus
                        placeholder="Image URL"
                        size="sm"
                        id="src"
                        name="src"
                        onChange={props.handleChange}
                      />
                      <Button
                        colorScheme="blue"
                        size="sm"
                        type="submit"
                        onMouseDown={stop}
                        onClick={stop}
                        isLoading={props.isSubmitting}
                      >
                        Update
                      </Button>
                    </Stack>
                  </Form>
                )}
              </Formik>
            </Box>
          </>
        )}

        <Box
          className="image-container"
          pos={"relative"}
          onClick={handleClick}
          bg="#eee"
        >
          <>
            {!image.src && (
              <Flex
                className="video-overlay"
                onClick={() => {
                  updater.onOpen();
                }}
              >
                <Square
                  size={12}
                  borderRadius={4}
                  // border={"1px solid #ddd"}
                  // bg={"#fff"}
                  fontSize={26}
                  color={"#aaa"}
                >
                  <RxImage />
                </Square>
                <Text>Click to add image</Text>
              </Flex>
            )}
            {image.src && (
              <>
                <Flex
                  className="image-controls"
                  pos={"absolute"}
                  top={0}
                  right={0}
                  mr={1}
                  mt={1}
                >
                  <IconButton
                    colorScheme={"facebook"}
                    size={"sm"}
                    aria-label="Search database"
                    icon={<TbStatusChange />}
                    onMouseDown={preventAndStop}
                    onClick={(e) => {
                      preventAndStop(e);
                      updater.onOpen();
                    }}
                  />
                </Flex>

                <LazyLoadImage
                  src={node.attrs.node.src}
                  alt=""
                  onLoad={() => {
                    setReady(true);
                  }}
                  placeholder={<Center color='#aaa'>Image loading...</Center>}
                />
                {/* {selection.isSelected && (
                <div className="image-align-controls">
                  <div
                    className="align-left"
                    onClick={alignImage("start")}
                    onMouseDown={preventAndStop}
                  >
                    <HiMiniBars3BottomLeft />
                  </div>
                  <div
                    className="align-center"
                    onClick={alignImage("center")}
                    onMouseDown={preventAndStop}
                  >
                    <LuAlignCenter />
                  </div>
                  <div
                    className="align-right"
                    onClick={alignImage("end")}
                    onMouseDown={preventAndStop}
                  >
                    <HiMiniBars3BottomRight />
                  </div>
                </div>
              )} */}
                <Spinner
                  pos={"absolute"}
                  bottom={0}
                  right={0}
                  zIndex={10}
                  // bg={"#eee"}
                  size="sm"
                  m={2}
                  color="#555"
                  display={image.src ? (ready ? "none" : "block") : "none"}
                />
                {selection.SelectionHalo}
              </>
            )}
          </>
        </Box>
      </CarbonBlock>
    </>
  );
}
