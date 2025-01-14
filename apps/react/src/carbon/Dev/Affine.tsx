import {
  Box,
  Card,
  CardFooter,
  Grid,
  GridItem,
  Heading,
  Stack,
} from "@chakra-ui/react";
import {
  Affine,
  ResizeRatio,
  Shaper,
  toRad,
  TransformAnchor,
  TransformHandle,
} from "@emrgen/carbon-affine";

const Shape = ({ transform = "", ...rest }) => {
  return (
    <Box
      pos="absolute"
      bg="red.400"
      w="2px"
      h="2px"
      left={"-1px"}
      top={"-1px"}
      // style={{ transform }}
      borderTopRightRadius={1}
      {...rest}
    >
      {/*triangle*/}
      <Box
        pos="absolute"
        w="0"
        h="0"
        right={"0px"}
        borderLeft="10px solid transparent"
        borderRight="10px solid transparent"
        borderTop="20px solid white"
        transform={"rotate(45deg)"}
      ></Box>
    </Box>
  );
};

const sp = Shaper.from(Affine.fromSize(50, 50));

const af = sp.translate(135, 100);

export const AffineExp = () => {
  return (
    <Stack pos="absolute" w="full" h="full" p={6} overflow={"auto"} gap={6}>
      <Heading textAlign={"center"} size={"lg"}>
        Showing different transformations
      </Heading>
      <Box w={"1080px"} m={"0 auto"}>
        <Grid
          templateColumns="repeat(4, 1fr)"
          templateRows="repeat(4, 1fr)"
          gap="6"
        >
          <ShapeItem label={"No transform"} style={af.toStyle()} />
          <ShapeItem
            label={"Rotate 45° clockwise"}
            style={af.rotate(toRad(45)).toStyle()}
          />
          <ShapeItem
            label={"Rotate 90° clockwise"}
            style={af.rotate(toRad(90)).toStyle()}
          />
          <ShapeItem
            label={"Rotate 90° anti-clockwise"}
            style={af.rotate(toRad(-90)).toStyle()}
          />
          <ShapeItem label={"No transform"} style={af.toStyle()} />
          <ShapeItem
            label={"Resize wrt left by 20"}
            style={af
              .resize(
                20,
                0,
                TransformAnchor.LEFT,
                TransformHandle.RIGHT,
                ResizeRatio.KEEP,
              )
              .toStyle()}
          />
          <ShapeItem
            label={"Resize wrt top by 20"}
            style={af
              .resize(
                0,
                20,
                TransformAnchor.TOP,
                TransformHandle.BOTTOM,
                ResizeRatio.KEEP,
              )
              .toStyle()}
          />
          <ShapeItem
            label={"Resize wrt center by 20x20"}
            style={af
              .resize(
                20,
                20,
                TransformAnchor.CENTER,
                TransformHandle.BOTTOM_RIGHT,
                ResizeRatio.KEEP,
              )
              .toStyle()}
          />
          <ShapeItem label={"No transform"} style={af.toStyle()} />
          <ShapeItem
            label={"Scale wrt center 2x2"}
            style={af.scale(2, 2).toStyle()}
          />
          <ShapeItem
            label={"Scale wrt left-top by 1.5x1.5"}
            style={(() => {
              const ch = af.scaleFromDelta(
                20,
                20,
                TransformAnchor.TOP_LEFT,
                TransformHandle.BOTTOM_RIGHT,
                ResizeRatio.KEEP,
              );
              return af.scale(ch.sx, ch.sy, ch.ax, ch.ay).toStyle();
            })()}
          />
          <ShapeItem
            label={"Scale wrt center by 0.5x0.5"}
            style={af.scale(0.5, 0.5, 0.5, 0.5).toStyle()}
          />
          <ShapeItem label={"No transform"} style={af.toStyle()} />
          <ShapeItem
            label={"Translate by 20x20"}
            style={af.translate(20, 20).toStyle()}
          />
          <ShapeItem
            label={"Translate by 50x50"}
            style={af.translate(50, 50).toStyle()}
          />
          <ShapeItem
            label={"Translate by -50x-50"}
            style={af.translate(-50, -50).toStyle()}
          />
          <ShapeItem label={"No transform"} style={af.toStyle()} />
          <ShapeItem label={"Flip X"} style={af.flipX().toStyle()} />
          <ShapeItem label={"Flip Y"} style={af.flipY().toStyle()} />
          <ShapeItem
            label={"Flip X and Y"}
            style={af.flipX().flipY().toStyle()}
          />
        </Grid>
      </Box>
    </Stack>
  );
};

const ShapeItem = ({ label, style }) => {
  return (
    <GridItem h="270px">
      <Stack h={"full"}>
        <Card flex={1}>
          <Shape
            style={style}
            borderTopRightRadius={10}
            data-transform={af.toCSS()}
          />
          <CardFooter></CardFooter>
        </Card>
        <Heading textAlign={"center"} size={"sm"} h={12}>
          {label}
        </Heading>
      </Stack>
    </GridItem>
  );
};