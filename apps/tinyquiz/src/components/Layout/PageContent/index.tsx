import {Box, Center, Flex, Heading, HStack, Spinner, Stack, StackProps} from "@chakra-ui/react";
import React, {ReactNode, useState} from "react";
import {DateRangeInput} from "@/components/DateRangePicker";
import dayjs from "dayjs";
import {ReactSelect, SelectOption} from "@/components/Select/ReactSelect.tsx";
import {useInventoryOptions} from "@/pages/Inventory/hooks/stock.ts";
import {useAppInventoryStore} from "@/pages/store.ts";
import {useLocation} from "react-router-dom";

interface LayoutContentProps extends StackProps {
  header?: ReactNode | string;
  isLoading?: boolean;
  hideFilters?: boolean;
}

const color = 'rgba(248,248,248,0.82)';

// PageContent is a component that wraps the content of a page with a header and a loading spinner
export const PageContent = (props: LayoutContentProps) => {
  const {header, isLoading,hideFilters} = props;
  const [startDate, setStartDate] = useState<Date | null>(dayjs().subtract(1, 'month').toDate());
  const [endDate, setEndDate] = useState<Date | null>(new Date());
  const stockOptions = useInventoryOptions();
  const inventory = useAppInventoryStore(state => state.inventory);
  const updateStock = useAppInventoryStore(state => state.setInventory)

  const location = useLocation()

  return (
    <Stack h="full" p={4} w={"full"} margin={"0 auto"} spacing={4}>
      <HStack justifyContent={'space-between'}>
        <HStack>
          <Heading as="h3" size="sm">
            {header}
          </Heading>
          {isLoading && (
            <Center>
              <Spinner size={'xs'}/>
            </Center>
          )}
        </HStack>
        {!hideFilters && <Flex>
          <HStack spacing={1} fontSize={'sm'}>
            <Box w={200}>
              <ReactSelect
                value={inventory}
                options={[{label: 'All Inventory', value: ''}, ...stockOptions] ?? []}
                onChange={opt => updateStock(opt as SelectOption)}
              />
            </Box>
            <DateRangeInput
              size={'sm'}
              startMinDate={dayjs().startOf('year').toDate()}
              endMaxDate={dayjs().endOf('day').toDate()}
              startDate={startDate}
              endDate={endDate}
              onChange={(start, end) => {
                setStartDate(start);
                setEndDate(end);
              }}
            />
          </HStack>
        </Flex>
        }
      </HStack>
      <>
        {props.children}
      </>
    </Stack>
  );
}