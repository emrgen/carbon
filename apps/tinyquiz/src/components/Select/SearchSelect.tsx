import {
  Box,
  Button,
  Checkbox,
  Circle,
  Divider,
  HStack,
  Input,
  Popover,
  PopoverBody,
  PopoverContent,
  PopoverTrigger,
  Stack,
  Tag,
  Text,
  Tooltip,
  useDisclosure,
  usePrevious
} from "@chakra-ui/react";
import React, {useCallback, useEffect, useRef} from "react";
import {SelectOption} from "@/components/Select/ReactSelect.tsx";
import {unionWith} from "lodash";
import {BiPlus} from "react-icons/bi";

interface SearchSelectProps {
  icon?: React.ReactNode;
  label: String;
  isMulti?: boolean;
  limit?: number;

  options?: SelectOption[];
  value?: SelectOption[];

  onSearch?(term: string): void;

  onChange?(options: SelectOption[]): void;

  buttonStyle?: any;
}

const isEqualOption = (a: SelectOption, b: SelectOption) => {
  if (a.key && b.key) {
    return a.key === b.key
  }

  return a.label === b.label
}

export const searchSelectKey = (op: SelectOption) => {
  return op.key ?? op.label
}

export const SearchSelect = (props: SearchSelectProps) => {
  const {
    label, isMulti = true, onSearch, options, onChange, value = [],
    icon = (
      <Circle size={'0.8rem'} border={'1px solid'}>
        <BiPlus/>
      </Circle>
    ),
    limit = 2,
    buttonStyle
  } = props;
  const disclosure = useDisclosure();
  const isSelected = useCallback((op: SelectOption) => {
    return (value.findIndex(s => isEqualOption(s, op)) > -1)
  }, [value])

  const ref = useRef<HTMLInputElement>(null);
  const prevOpen = usePrevious(disclosure.isOpen);

  useEffect(() => {
    setTimeout(() => {
      if (!prevOpen && disclosure.isOpen && ref.current) {
        ref.current.focus();
      }
    }, 50)
  }, [ref, prevOpen, disclosure.isOpen])

  return (
    <Popover placement={'bottom-start'} {...disclosure}>
      <PopoverTrigger>
        <Button variant={'outline'} border={'1px dashed #ddd'} px={2} fontSize={'xs'} color={'#999'} {...buttonStyle}>
          <HStack h={'full'} spacing={2}>
            <HStack spacing={1}>
              {icon}
              <Text userSelect={'none'}>
                {label}
              </Text>
            </HStack>

            {!!value && value?.length > 0 && (
              <>
                <Divider orientation={'vertical'} h={'60%'} px={0}/>
                <HStack spacing={1}>
                  {value?.length > limit ? (
                    <Tag><Text fontSize={'xs'}>{`${value.length} selected`}</Text></Tag>
                  ) : (
                    value.map(s => {
                      return <Tag key={searchSelectKey(s)} userSelect={'none'}><Text
                        fontSize={'xs'}>{s.label}</Text></Tag>
                    })
                  )}
                </HStack>
              </>
            )}
          </HStack>
        </Button>
      </PopoverTrigger>
      <PopoverContent w={'200px'}>
        <PopoverBody px={1}>
          <Stack>
            {onSearch && (
              <Box px={2}>
                <Input
                  ref={ref}
                  placeholder={'Search...'}
                  onChange={e => onSearch(e.target.value)}
                />
              </Box>
            )}

            {options?.map(op => {
              return (
                <HStack
                  key={searchSelectKey(op)}
                  _hover={{bg: '#eee'}}
                  cursor={'pointer'}
                  userSelect={'none'}
                  borderRadius={4}
                  fontSize={'sm'}
                  px={2} py={1}
                  onClick={() => {
                    if (isMulti) {
                      if (isSelected(op)) {
                        onChange?.(value?.filter(s => !isEqualOption(s, op)) ??[]);
                      } else {
                        if(value) {
                          onChange?.(unionWith([...value, op], isEqualOption));
                        }
                      }
                    } else {
                      onChange?.([op]);
                      disclosure.onClose();
                    }
                  }}
                >
                  <HStack w={'full'}>
                    {isMulti && <Checkbox isChecked={isSelected(op)} pointerEvents={'none'}/>}
                    <Tooltip label={op.label} hasArrow placement={'end'} openDelay={700}>
                      <Box w={'full'} textOverflow={'ellipsis'} whiteSpace={'nowrap'} overflow={'hidden'}>
                        {op.label}
                      </Box>
                    </Tooltip>
                  </HStack>
                </HStack>
              )
            })}
            <Divider/>
            <HStack justifyContent={'space-between'}>
              <Button size={'xs'} variant={'ghost'} onClick={disclosure.onClose}>Close</Button>
              <Button
                size={'xs'}
                variant={'outline'}
                onClick={() => {
                  onChange?.([]);
                }}
                // isDisabled={value.length === 0}
              >Clear</Button>
            </HStack>
          </Stack>
        </PopoverBody>
      </PopoverContent>
    </Popover>
  )
}

export const SearchSelectMemo = React.memo(SearchSelect);