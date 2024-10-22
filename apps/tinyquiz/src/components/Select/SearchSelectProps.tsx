import React, {useCallback, useEffect, useState} from "react";
import {
  Box,
  Button,
  Circle,
  Divider,
  HStack,
  IconButton,
  Input,
  InputGroup,
  InputRightElement,
  Popover,
  PopoverBody,
  PopoverContent,
  PopoverTrigger,
  Stack,
  Tag,
  Text,
  Tooltip,
  Wrap
} from "@chakra-ui/react";
import {BiPlus} from "react-icons/bi";
import {range} from "lodash";
import {randomString} from "@/utils/random.ts";
import {MdClear} from "react-icons/md";
import {RxReset} from "react-icons/rx";

export interface SelectPropOption {
  prop: string;
  value: PropValue;
}

export interface PropValue {
  key: string;
  value: string;
}

interface SelectProps {
  label: string;
  isMulti?: boolean;
  visibleCount?: number;
  value: SelectPropOption[];
  onChange: (value: SelectPropOption[]) => void;
  keys: string[];
  onSearchKey: (key: string) => string[];
  onSelectKey: (key: string) => void;
  values: PropValue[];
  onSearchValue: (key: string, value: string) => string[];
}

const isEqualOption = (a: SelectPropOption, b: SelectPropOption) => {
  return a.value.key === b.value.key;
}

const values = range(10).map(i => {
  return {
    key: `${i}`,
    value: `${i}: ${randomString(7)}`
  }
});

export const SearchSelectProps = (props: SelectProps) => {
  const {label, visibleCount = 2, onChange, value, keys, onSearchKey, onSelectKey, values, onSearchValue} = props;

  const [keyOptions, setKeyOptions] = useState<string[]>(keys ?? []);
  const [valueOptions, setValueOptions] = useState<PropValue[]>([])

  const [prop, setProp] = useState('');
  const [keyTerm, setKeyTerm] = useState('');
  const [valueTerm, setValueTerm] = useState('');

  const isSelected = useCallback((op: SelectPropOption) => {
    return value.findIndex(s => isEqualOption(s, op)) > -1
  }, [value]);

  const handleKeyInput = useCallback((e) => {
    setProp('');
    setKeyTerm(e.target.value);
    setValueOptions([]);
    setValueTerm('');
  }, [onSelectKey, setProp]);

  useEffect(() => {
    setKeyOptions(keys ?? []);
  }, [keys]);

  useEffect(() => {
    setValueOptions(values)
  }, [values]);

  const handleValueInput = useCallback((e) => {
    setValueTerm(e.target.value)
  }, [setValueTerm]);

  const handleOnSearchKey = useCallback((term: string) => {
    setKeyOptions(onSearchKey(term));
  }, [onSearchKey]);

  useEffect(() => {
    handleOnSearchKey(keyTerm);
  }, [keyTerm]);

  const handleOnSearchValue = useCallback((term: string) => {
    setValueOptions(values.filter(v => v.value.includes(term)));
  }, [values]);

  useEffect(() => {
    handleOnSearchValue(valueTerm);
  }, [valueTerm]);

  useEffect(() => {
    return () => {
      setProp('');
      setKeyTerm('');
      setValueTerm('');
      setKeyOptions([]);
      setValueOptions([]);
    }
  }, []);

  return (
    <Popover placement={'bottom-start'} onOpen={() => {
      console.log('open')
    }}>
      <PopoverTrigger>
        <Button variant={'outline'} border={'1px dashed #ddd'} px={2} fontSize={'xs'} color={'#999'}>
          <HStack h={'full'} spacing={2}>
            <HStack spacing={1}>
              <Circle size={'0.8rem'} border={'1px solid'}>
                <BiPlus/>
              </Circle>
              <Text>
                {label}
              </Text>
            </HStack>
            {value.length > 0 && (
              <>
                <Divider orientation={'vertical'} h={'60%'} px={0}/>
                <HStack spacing={1}>
                  {value.length > visibleCount ? (
                    <Tag><Text fontSize={'xs'}>{`${value.length} selected`}</Text></Tag>
                  ) : (
                    value.map(s => {
                      return <Tag size={'sm'} key={s.value.key}>
                        <HStack fontWeight={'bold'}>
                          <Text color={'#aaa'}>{s.prop}:</Text>
                          <Text color={'#555'}>{s.value.value}</Text>
                        </HStack>
                      </Tag>
                    })
                  )}
                </HStack>
              </>
            )}
          </HStack>
        </Button>
      </PopoverTrigger>
      <PopoverContent w={'500px'}>
        <PopoverBody px={1}>
          <Stack px={1}>
            <HStack justifyContent={'space-between'}>
              <HStack>
                {value.length === 0 && (
                  <Text fontSize={'sm'} color={'#aaa'}>No selection</Text>
                )}
                {value.length && <Wrap>
                  {
                    value.map(s => {
                      return (
                        <Tooltip
                          hasArrow
                          label={<Text fontSize={'sm'}>Remove</Text>}
                          borderRadius={4}
                          key={s.value.key}
                        >
                          <Tag size={'sm'} onClick={(e) => {
                            e.stopPropagation();
                            onChange(value.filter(v => v.value.key !== s.value.key))
                          }}>
                            <HStack fontWeight={'bold'} cursor={'pointer'}>
                              <Text color={'#aaa'}>{s.prop}:</Text>
                              <Text color={'#555'}>{s.value.value}</Text>
                            </HStack>
                          </Tag>
                        </Tooltip>
                      )
                    })
                  }
                </Wrap>
                }
              </HStack>
              <Tooltip label={'Reset'} hasArrow>
                <IconButton
                  variant={'ghost'}
                  size={'xs'}
                  aria-label={'rest'}
                  icon={<RxReset/>}
                  onClick={() => onChange([])}
                  isDisabled={value.length === 0}
                />
              </Tooltip>
            </HStack>

            <Divider/>

            <HStack w={'full'} h={'300px'} alignItems={'start'} spacing={3}>
              <Stack flex={1} h={'full'}>
                <InputGroup size='md'>
                  <Input size='sm' type={'text'} placeholder={'Search key'} value={keyTerm || prop}
                         onChange={handleKeyInput}/>
                  <InputRightElement>
                    <IconButton icon={<MdClear/>} aria-label={''} borderRadius={16} size={'2xs'} variant={'ghost'}
                                fontSize={'md'} onClick={() => {
                      onSelectKey('');
                      setProp('');
                      setKeyTerm('')
                    }} color={'#aaa'} _hover={{color: '#555'}} top={'-0.3rem'} left={1} pos={'relative'}/>
                  </InputRightElement>
                </InputGroup>
                <Box flex={1} pos={'relative'} w={'full'} h={'full'}>
                  <Stack pos={'absolute'} fontSize={'sm'} w='full' h={'full'} overflow={'auto'}>
                    {!prop && keyOptions.map(key => {
                      return (
                        <Box _hover={{bg: "#eee"}} p={1} borderRadius={4} cursor={'pointer'} onClick={() => {
                          onSelectKey(key);
                          setProp(key);
                          setKeyTerm(key);
                          setKeyOptions([]);
                          setValueTerm('');
                          handleOnSearchValue('');
                        }}>
                          {key}
                        </Box>
                      )
                    })}
                  </Stack>
                </Box>
              </Stack>

              <Stack flex={1} h={'full'}>
                <InputGroup size='md'>
                  <Input size='sm' type={'text'} placeholder={'Search value'} isDisabled={!prop} value={valueTerm}
                         onChange={handleValueInput}/>
                  <InputRightElement>
                    <IconButton icon={<MdClear/>} aria-label={''} borderRadius={16} size={'2xs'} variant={'ghost'}
                                fontSize={'md'} onClick={() => {
                      setValueTerm('');
                    }} color={'#aaa'} _hover={{color: '#555'}} top={'-0.3rem'} left={1} pos={'relative'}/>
                  </InputRightElement>
                </InputGroup>

                <Box flex={1} pos={'relative'} w={'full'} h={'full'}>
                  <Stack pos={'absolute'} fontSize={'sm'} w='full' h={'full'} overflow={'auto'}>
                    {valueOptions.map(kvalue => {
                      return (
                        <Box _hover={{bg: "#eee"}} p={1} borderRadius={4} cursor={'pointer'} onClick={() => {
                          onChange([...value, {prop, value: kvalue}]);
                          setProp('');
                          setValueTerm('');
                          setKeyTerm('');
                          setValueOptions([])
                        }}>
                          {kvalue.value}
                        </Box>
                      )
                    })}
                  </Stack>
                </Box>
              </Stack>
            </HStack>

          </Stack>
        </PopoverBody>
      </PopoverContent>
    </Popover>
  )
}