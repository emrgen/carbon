import { Box } from "@chakra-ui/react";
import { Affine, Shaper } from "@emrgen/carbon-affine";

const Shape = ({transform = '', ...rest}) => {
  return (
    <Box
      pos="absolute"
      bg="red"
      w="2px"
      h="2px"
      left={"-1px"}
      top={"-1px"}
      style={{ transform }}
      borderTopRightRadius={1}
      {...rest}
    >
      {/* <Box
        h="2px"
        w="full"
        bg="teal"
        top={"50%"}
        pos="relative"
        transform={"translateY(-1px) rotateZ(0.52rad)"}
      ></Box> */}
    </Box>
  );
}

const sp = Shaper.from(Affine.fromSize(50, 50));

let af = sp
  .translate(200, 200)
  .rotate(Math.PI / 4)
  // .scale(2, 1)
  .flipX()
  .flipY();

export const AffineExp = () => {
  return (
    <Box w="full" h="full">
      <Shape
        bg="red"
        style={af.translate(100, 100).toStyle()}
        // transform={af.toStyle()}
        borderTopRightRadius={10}
        data-transform={af.toCSS()}
      />

      <Shape
        bg="red"
        // style={af.toStyle()}
        borderTopRightRadius={1}
        data-transform={af.toCSS()}
        transform={af.toCSS()}
      />
    </Box>
  );
};
